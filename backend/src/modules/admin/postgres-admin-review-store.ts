import type { Pool, PoolClient, QueryResultRow } from 'pg';

import { getDatabasePool } from '../../db/pool.js';
import type { AdminRole, AdminReviewService, AdminReviewStore, AdminReviewWorkingHour, PendingProviderReview, ProviderReviewDecision, ProviderReviewResult } from './admin-review.types.js';
import {
  AdminAccessRequiredError,
  AdminPermissionRequiredError,
  ProviderReviewNotPendingError,
  ProviderReviewRecordMissingError,
} from './admin-review.types.js';

interface AdminAccessRow extends QueryResultRow {
  userId: string;
  role: AdminRole;
  mfaEnrolled: boolean;
}

interface PendingProviderReviewRow extends QueryResultRow {
  id: string;
  displayName: string;
  businessName: string | null;
  primaryPhoneNumber: string;
  secondaryPhoneNumber: string | null;
  profilePhotoPath: string | null;
  serviceRadiusKm: string | number;
  experienceYears: number;
  description: string | null;
  locality: string;
  taluk: string | null;
  district: string;
  state: string;
  locationLanguage: 'en' | 'kn';
  services: AdminReviewService[] | string;
  languages: string[] | null;
  workingHours: AdminReviewWorkingHour[] | string;
  submittedAt: Date | string;
}

interface ReviewStatusRow extends QueryResultRow {
  profileStatus: string;
}

interface ReviewResultRow extends QueryResultRow {
  reviewedAt: Date | string;
}

export class PostgresAdminReviewStore implements AdminReviewStore {
  constructor(private readonly getPool: () => Pool = getDatabasePool) {}

  async getAdminAccess(firebaseUid: string): Promise<AdminAccessRow | null> {
    const result = await this.getPool().query<AdminAccessRow>(
      `
        SELECT users.id::TEXT AS "userId",
               admin_users.admin_role AS role,
               (admin_users.mfa_enrolled_at IS NOT NULL) AS "mfaEnrolled"
        FROM users
        JOIN admin_users ON admin_users.user_id = users.id
        WHERE users.firebase_uid = $1
          AND users.account_status = 'ACTIVE'
          AND admin_users.enabled = TRUE
      `,
      [firebaseUid],
    );
    return result.rows[0] ?? null;
  }

  async listPendingProviderReviews(limit: number, offset: number): Promise<{
    items: PendingProviderReview[];
    total: number;
  }> {
    const pool = this.getPool();
    const [rowsResult, countResult] = await Promise.all([
      pool.query<PendingProviderReviewRow>(
        `
          SELECT
            provider_profiles.id::TEXT AS id,
            provider_profiles.display_name AS "displayName",
            provider_profiles.business_name AS "businessName",
            users.phone_e164 AS "primaryPhoneNumber",
            provider_profiles.secondary_phone_e164 AS "secondaryPhoneNumber",
            provider_profiles.profile_photo_path AS "profilePhotoPath",
            provider_profiles.service_radius_km AS "serviceRadiusKm",
            provider_profiles.experience_years AS "experienceYears",
            provider_profiles.description,
            COALESCE(locations.locality_en, locations.locality_kn, '') AS locality,
            COALESCE(locations.taluk_en, locations.taluk_kn) AS taluk,
            COALESCE(locations.district_en, locations.district_kn, '') AS district,
            COALESCE(locations.state_en, 'Karnataka') AS state,
            CASE
              WHEN locations.locality_kn IS NOT NULL AND locations.locality_en IS NULL THEN 'kn'
              ELSE 'en'
            END AS "locationLanguage",
            COALESCE((
              SELECT JSON_AGG(JSON_BUILD_OBJECT(
                'id', service_categories.id::TEXT,
                'slug', service_categories.slug,
                'nameEn', service_categories.name_en,
                'nameKn', service_categories.name_kn,
                'isPrimary', provider_services.is_primary
              ) ORDER BY provider_services.is_primary DESC,
                       service_categories.sort_order, service_categories.name_en)
              FROM provider_services
              JOIN service_categories ON service_categories.id = provider_services.category_id
              WHERE provider_services.provider_id = provider_profiles.id
            ), '[]'::JSON) AS services,
            COALESCE((
              SELECT ARRAY_AGG(provider_languages.language_code ORDER BY provider_languages.language_code)
              FROM provider_languages
              WHERE provider_languages.provider_id = provider_profiles.id
            ), ARRAY[]::TEXT[]) AS languages,
            COALESCE((
              SELECT JSON_AGG(JSON_BUILD_OBJECT(
                'weekday', working_hours.weekday,
                'isClosed', working_hours.is_closed,
                'opensAt', to_char(working_hours.opens_at, 'HH24:MI'),
                'closesAt', to_char(working_hours.closes_at, 'HH24:MI')
              ) ORDER BY working_hours.weekday)
              FROM working_hours
              WHERE working_hours.provider_id = provider_profiles.id
            ), '[]'::JSON) AS "workingHours",
            COALESCE(pending_review.submitted_at, provider_profiles.created_at) AS "submittedAt"
          FROM provider_profiles
          JOIN users ON users.id = provider_profiles.user_id
          JOIN locations ON locations.id = provider_profiles.location_id
          LEFT JOIN LATERAL (
            SELECT verification_records.submitted_at
            FROM verification_records
            WHERE verification_records.provider_id = provider_profiles.id
              AND verification_records.level = 'GRAMA360'
              AND verification_records.status = 'PENDING'
              AND verification_records.reviewed_at IS NULL
            ORDER BY verification_records.submitted_at DESC, verification_records.id DESC
            LIMIT 1
          ) AS pending_review ON TRUE
          WHERE provider_profiles.profile_status = 'PENDING_REVIEW'
          ORDER BY COALESCE(pending_review.submitted_at, provider_profiles.created_at),
                   provider_profiles.id
          LIMIT $1 OFFSET $2
        `,
        [limit, offset],
      ),
      pool.query<{ total: number }>(
        `
          SELECT COUNT(*)::INT AS total
          FROM provider_profiles
          WHERE profile_status = 'PENDING_REVIEW'
        `,
      ),
    ]);

    return {
      items: rowsResult.rows.map(toPendingProviderReview),
      total: countResult.rows[0]?.total ?? 0,
    };
  }

  async decideProviderReview(
    firebaseUid: string,
    providerId: string,
    decision: ProviderReviewDecision,
    decisionNote: string | null,
  ): Promise<ProviderReviewResult | null> {
    return this.withTransaction(async (client) => {
      const admin = await requireEnabledAdmin(client, firebaseUid, true);
      const target = await client.query<ReviewStatusRow>(
        `
          SELECT id::TEXT AS id, profile_status AS "profileStatus"
          FROM provider_profiles
          WHERE id = $1::UUID
          FOR UPDATE
        `,
        [providerId],
      );
      const provider = target.rows[0];
      if (!provider) return null;
      if (provider.profileStatus !== 'PENDING_REVIEW') {
        throw new ProviderReviewNotPendingError();
      }

      const verificationStatus = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      const reviewResult = await client.query<ReviewResultRow>(
        `
          WITH latest_pending AS (
            SELECT id
            FROM verification_records
            WHERE provider_id = $1::UUID
              AND level = 'GRAMA360'
              AND status = 'PENDING'
              AND reviewed_at IS NULL
            ORDER BY submitted_at DESC, id DESC
            LIMIT 1
            FOR UPDATE
          )
          UPDATE verification_records AS record
          SET status = $2,
              reviewed_by_admin_user_id = $3::UUID,
              reviewed_at = NOW(),
              decision_note = $4
          FROM latest_pending
          WHERE record.id = latest_pending.id
          RETURNING record.reviewed_at AS "reviewedAt"
        `,
        [providerId, verificationStatus, admin.userId, decisionNote],
      );
      const reviewRow = reviewResult.rows[0];
      if (!reviewRow) throw new ProviderReviewRecordMissingError();

      const profileStatus = decision === 'APPROVE' ? 'ACTIVE' : 'REJECTED';
      await client.query(
        `
          UPDATE provider_profiles
          SET profile_status = $2
          WHERE id = $1::UUID
        `,
        [providerId, profileStatus],
      );
      await client.query(
        `
          INSERT INTO admin_audit_logs (
            admin_user_id, action, target_type, target_id, metadata
          )
          VALUES ($1::UUID, $2, 'PROVIDER_PROFILE', $3::UUID, $4::JSONB)
        `,
        [
          admin.userId,
          decision === 'APPROVE' ? 'PROVIDER_PROFILE_APPROVED' : 'PROVIDER_PROFILE_REJECTED',
          providerId,
          JSON.stringify({ decision }),
        ],
      );

      return {
        providerId,
        profileStatus,
        decision,
        decisionNote,
        reviewedAt: asIsoString(reviewRow.reviewedAt),
      };
    });
  }

  private async withTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getPool().connect();
    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // Keep the original error if rollback also fails.
      }
      throw error;
    } finally {
      client.release();
    }
  }
}

async function requireEnabledAdmin(
  client: PoolClient,
  firebaseUid: string,
  requireReviewPermission: boolean,
): Promise<AdminAccessRow> {
  const result = await client.query<AdminAccessRow>(
    `
      SELECT users.id::TEXT AS "userId",
             admin_users.admin_role AS role,
             (admin_users.mfa_enrolled_at IS NOT NULL) AS "mfaEnrolled"
      FROM users
      JOIN admin_users ON admin_users.user_id = users.id
      WHERE users.firebase_uid = $1
        AND users.account_status = 'ACTIVE'
        AND admin_users.enabled = TRUE
        AND admin_users.mfa_enrolled_at IS NOT NULL
      FOR SHARE OF users, admin_users
    `,
    [firebaseUid],
  );
  const admin = result.rows[0];
  if (!admin) throw new AdminAccessRequiredError();
  if (requireReviewPermission && admin.role === 'SUPPORT') {
    throw new AdminPermissionRequiredError();
  }
  return admin;
}

function toPendingProviderReview(row: PendingProviderReviewRow): PendingProviderReview {
  return {
    id: row.id,
    displayName: row.displayName,
    businessName: row.businessName,
    primaryPhoneNumber: row.primaryPhoneNumber,
    secondaryPhoneNumber: row.secondaryPhoneNumber,
    profilePhotoPath: row.profilePhotoPath,
    serviceRadiusKm: Number(row.serviceRadiusKm),
    experienceYears: row.experienceYears,
    description: row.description,
    locality: row.locality,
    taluk: row.taluk,
    district: row.district,
    state: row.state,
    locationLanguage: row.locationLanguage,
    services: parseJsonArray<AdminReviewService>(row.services),
    languages: row.languages ?? [],
    workingHours: parseJsonArray<AdminReviewWorkingHour>(row.workingHours),
    submittedAt: asIsoString(row.submittedAt),
  };
}

function parseJsonArray<T>(value: T[] | string): T[] {
  if (Array.isArray(value)) return value;
  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed)) throw new Error('Expected a JSON array from PostgreSQL.');
  return parsed as T[];
}

function asIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
