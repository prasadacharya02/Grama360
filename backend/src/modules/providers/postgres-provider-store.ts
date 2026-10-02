import type { Pool, PoolClient, QueryResultRow } from 'pg';

import { getDatabasePool } from '../../db/pool.js';
import { AccountNotActiveError } from '../auth/types.js';
import type {
  LocationLanguage,
  ProviderAvailability,
  ProviderProfileView,
  ProviderRegistrationInput,
  ProviderStore,
  ProviderWorkingHourInput,
} from './provider.types.js';
import {
  ProviderAlreadyExistsError,
  ProviderAvailabilityNotEditableError,
  ProviderCategoriesInvalidError,
  ProviderProfileLockedError,
  ProviderRoleRequiredError,
  ProviderSecondaryPhoneError,
} from './provider.types.js';
import { manualLocationSlug, normalizeProviderInput } from './provider.utils.js';

interface ProviderAccountRow extends QueryResultRow {
  id: string;
  phoneNumber: string;
  accountStatus: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
}

interface ProviderStatusRow extends QueryResultRow {
  id: string;
  profileStatus: ProviderProfileView['profileStatus'];
}

interface ProviderProfileRow extends QueryResultRow {
  id: string;
  displayName: string;
  businessName: string | null;
  secondaryPhoneNumber: string | null;
  serviceRadiusKm: string | number;
  experienceYears: number;
  description: string | null;
  profilePhotoPath: string | null;
  profileStatus: ProviderProfileView['profileStatus'];
  reviewNote: string | null;
  availability: ProviderProfileView['availability'];
  locality: string;
  taluk: string | null;
  district: string;
  state: string;
  languageCode: LocationLanguage;
}

interface ProviderServiceRow extends QueryResultRow {
  id: string;
  slug: string;
  name: string;
  isPrimary: boolean;
}

interface ProviderLanguageRow extends QueryResultRow {
  languageCode: ProviderProfileView['languages'][number];
}

interface ProviderWorkingHourRow extends QueryResultRow {
  weekday: number;
  opensAt: string | null;
  closesAt: string | null;
  isClosed: boolean;
}

export class PostgresProviderStore implements ProviderStore {
  constructor(private readonly getPool: () => Pool = getDatabasePool) {}

  async createProfile(
    firebaseUid: string,
    input: ProviderRegistrationInput,
  ): Promise<ProviderProfileView> {
    return this.withTransaction(async (client) => {
      const normalized = normalizeProviderInput(input);
      const account = await requireProviderAccount(client, firebaseUid, normalized.secondaryPhoneNumber);
      await requireActiveCategories(client, normalized.serviceIds);
      const locationId = await upsertLocation(client, normalized);

      const inserted = await client.query<{ id: string }>(
        `
          INSERT INTO provider_profiles (
            user_id,
            display_name,
            business_name,
            location_id,
            service_radius_km,
            experience_years,
            description,
            profile_photo_path,
            secondary_phone_e164,
            profile_status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING_REVIEW')
          ON CONFLICT (user_id) DO NOTHING
          RETURNING id::TEXT AS id
        `,
        [
          account.id,
          normalized.displayName,
          normalized.businessName,
          locationId,
          normalized.serviceRadiusKm,
          normalized.experienceYears,
          normalized.description,
          normalized.profilePhotoPath,
          normalized.secondaryPhoneNumber,
        ],
      );
      const providerId = inserted.rows[0]?.id;
      if (!providerId) throw new ProviderAlreadyExistsError();

      await replaceProviderDetails(client, providerId, normalized);
      await client.query(
        `
          INSERT INTO availability (provider_id, status)
          VALUES ($1, 'OFFLINE')
          ON CONFLICT (provider_id) DO NOTHING
        `,
        [providerId],
      );
      await client.query(
        `
          INSERT INTO verification_records (provider_id, level, status)
          VALUES ($1, 'GRAMA360', 'PENDING')
        `,
        [providerId],
      );

      const profile = await loadProfile(client, firebaseUid);
      if (!profile) throw new Error('Created provider profile could not be read.');
      return profile;
    });
  }

  async getMyProfile(firebaseUid: string): Promise<ProviderProfileView | null> {
    const client = await this.getPool().connect();
    try {
      return await loadProfile(client, firebaseUid);
    } finally {
      client.release();
    }
  }

  async updateProfile(
    firebaseUid: string,
    input: ProviderRegistrationInput,
  ): Promise<ProviderProfileView | null> {
    return this.withTransaction(async (client) => {
      const normalized = normalizeProviderInput(input);
      const account = await requireProviderAccount(client, firebaseUid, normalized.secondaryPhoneNumber);
      const existing = await client.query<ProviderStatusRow>(
        `
          SELECT provider_profiles.id::TEXT AS id,
                 provider_profiles.profile_status AS "profileStatus"
          FROM provider_profiles
          WHERE provider_profiles.user_id = $1
          FOR UPDATE
        `,
        [account.id],
      );
      const current = existing.rows[0];
      if (!current) return null;
      if (current.profileStatus !== 'DRAFT' && current.profileStatus !== 'REJECTED') {
        throw new ProviderProfileLockedError();
      }

      await requireActiveCategories(client, normalized.serviceIds);
      const locationId = await upsertLocation(client, normalized);
      await client.query(
        `
          UPDATE provider_profiles
          SET display_name = $2,
              business_name = $3,
              location_id = $4,
              service_radius_km = $5,
              experience_years = $6,
              description = $7,
              profile_photo_path = $8,
              secondary_phone_e164 = $9,
              profile_status = 'PENDING_REVIEW'
          WHERE id = $1
        `,
        [
          current.id,
          normalized.displayName,
          normalized.businessName,
          locationId,
          normalized.serviceRadiusKm,
          normalized.experienceYears,
          normalized.description,
          normalized.profilePhotoPath,
          normalized.secondaryPhoneNumber,
        ],
      );

      await replaceProviderDetails(client, current.id, normalized);
      await client.query(
        `
          INSERT INTO availability (provider_id, status)
          VALUES ($1, 'OFFLINE')
          ON CONFLICT (provider_id) DO UPDATE
          SET status = 'OFFLINE', updated_at = NOW()
        `,
        [current.id],
      );
      await client.query(
        `
          INSERT INTO verification_records (provider_id, level, status)
          VALUES ($1, 'GRAMA360', 'PENDING')
        `,
        [current.id],
      );

      return loadProfile(client, firebaseUid);
    });
  }

  async setAvailability(
    firebaseUid: string,
    availability: ProviderAvailability,
  ): Promise<ProviderProfileView | null> {
    return this.withTransaction(async (client) => {
      const account = await requireProviderAccount(client, firebaseUid, null);
      const result = await client.query<ProviderStatusRow>(
        `
          SELECT provider_profiles.id::TEXT AS id,
                 provider_profiles.profile_status AS "profileStatus"
          FROM provider_profiles
          WHERE provider_profiles.user_id = $1
          FOR UPDATE
        `,
        [account.id],
      );
      const profile = result.rows[0];
      if (!profile) return null;
      if (profile.profileStatus !== 'ACTIVE') {
        throw new ProviderAvailabilityNotEditableError();
      }

      await client.query(
        `
          INSERT INTO availability (provider_id, status)
          VALUES ($1, $2)
          ON CONFLICT (provider_id) DO UPDATE
          SET status = EXCLUDED.status, updated_at = NOW()
        `,
        [profile.id, availability],
      );
      return loadProfile(client, firebaseUid);
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
        // Preserve the operation error; the connection will be discarded if broken.
      }
      throw error;
    } finally {
      client.release();
    }
  }
}

async function requireProviderAccount(
  client: PoolClient,
  firebaseUid: string,
  secondaryPhoneNumber: string | null,
): Promise<ProviderAccountRow> {
  const accountResult = await client.query<ProviderAccountRow>(
    `
      SELECT id::TEXT AS id,
             phone_e164 AS "phoneNumber",
             account_status AS "accountStatus"
      FROM users
      WHERE firebase_uid = $1
      FOR UPDATE
    `,
    [firebaseUid],
  );
  const account = accountResult.rows[0];
  if (!account) throw new ProviderRoleRequiredError();
  if (account.accountStatus !== 'ACTIVE') throw new AccountNotActiveError();

  const roleResult = await client.query<{ role: string }>(
    `
      SELECT role
      FROM user_roles
      WHERE user_id = $1 AND role = 'PROVIDER'
      FOR SHARE
    `,
    [account.id],
  );
  if (!roleResult.rows[0]) throw new ProviderRoleRequiredError();

  if (secondaryPhoneNumber && secondaryPhoneNumber === account.phoneNumber) {
    throw new ProviderSecondaryPhoneError();
  }
  return account;
}

async function requireActiveCategories(client: PoolClient, serviceIds: string[]): Promise<void> {
  if (
    serviceIds.length < 1 ||
    serviceIds.length > 5 ||
    new Set(serviceIds).size !== serviceIds.length
  ) {
    throw new ProviderCategoriesInvalidError();
  }

  const result = await client.query<{ id: string }>(
    `
      SELECT id::TEXT AS id
      FROM service_categories
      WHERE id = ANY($1::UUID[]) AND is_active = TRUE
      FOR SHARE
    `,
    [serviceIds],
  );
  if (result.rows.length !== serviceIds.length) {
    throw new ProviderCategoriesInvalidError();
  }
}

async function upsertLocation(
  client: PoolClient,
  input: ProviderRegistrationInput,
): Promise<string> {
  const slug = manualLocationSlug(input.location);
  const isEnglish = input.location.languageCode === 'en';
  const locationConflictTarget = isEnglish
    ? '(locality_en, district_en, state_en)'
    : '(locality_kn, district_kn, state_kn) WHERE locality_kn IS NOT NULL AND district_kn IS NOT NULL';
  const result = await client.query<{ id: string }>(
    `
      INSERT INTO locations (
        slug,
        locality_en,
        locality_kn,
        taluk_en,
        taluk_kn,
        district_en,
        district_kn,
        state_en,
        state_kn
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'Karnataka', 'ಕರ್ನಾಟಕ')
      ON CONFLICT ${locationConflictTarget} DO UPDATE SET
        locality_en = COALESCE(EXCLUDED.locality_en, locations.locality_en),
        locality_kn = COALESCE(EXCLUDED.locality_kn, locations.locality_kn),
        taluk_en = COALESCE(EXCLUDED.taluk_en, locations.taluk_en),
        taluk_kn = COALESCE(EXCLUDED.taluk_kn, locations.taluk_kn),
        district_en = COALESCE(EXCLUDED.district_en, locations.district_en),
        district_kn = COALESCE(EXCLUDED.district_kn, locations.district_kn)
      RETURNING id::TEXT AS id
    `,
    [
      slug,
      isEnglish ? input.location.locality : null,
      isEnglish ? null : input.location.locality,
      isEnglish ? input.location.taluk : null,
      isEnglish ? null : input.location.taluk,
      isEnglish ? input.location.district : null,
      isEnglish ? null : input.location.district,
    ],
  );
  const locationId = result.rows[0]?.id;
  if (!locationId) throw new Error('Location upsert did not return an identifier.');
  return locationId;
}

async function replaceProviderDetails(
  client: PoolClient,
  providerId: string,
  input: ProviderRegistrationInput,
): Promise<void> {
  await client.query('DELETE FROM provider_services WHERE provider_id = $1', [providerId]);
  for (const [index, categoryId] of input.serviceIds.entries()) {
    await client.query(
      `
        INSERT INTO provider_services (provider_id, category_id, is_primary)
        VALUES ($1, $2, $3)
      `,
      [providerId, categoryId, index === 0],
    );
  }

  await client.query('DELETE FROM working_hours WHERE provider_id = $1', [providerId]);
  for (const hour of input.workingHours) {
    await insertWorkingHour(client, providerId, hour);
  }

  await client.query('DELETE FROM provider_languages WHERE provider_id = $1', [providerId]);
  for (const language of input.languages) {
    await client.query(
      'INSERT INTO provider_languages (provider_id, language_code) VALUES ($1, $2)',
      [providerId, language],
    );
  }
}

async function insertWorkingHour(
  client: PoolClient,
  providerId: string,
  hour: ProviderWorkingHourInput,
): Promise<void> {
  await client.query(
    `
      INSERT INTO working_hours (provider_id, weekday, opens_at, closes_at, is_closed)
      VALUES ($1, $2, $3::TIME, $4::TIME, $5)
    `,
    [providerId, hour.weekday, hour.opensAt, hour.closesAt, hour.isClosed],
  );
}

async function loadProfile(
  client: PoolClient,
  firebaseUid: string,
): Promise<ProviderProfileView | null> {
  const profileResult = await client.query<ProviderProfileRow>(
    `
      SELECT
        provider_profiles.id::TEXT AS id,
        provider_profiles.display_name AS "displayName",
        provider_profiles.business_name AS "businessName",
        provider_profiles.secondary_phone_e164 AS "secondaryPhoneNumber",
        provider_profiles.service_radius_km AS "serviceRadiusKm",
        provider_profiles.experience_years AS "experienceYears",
        provider_profiles.description,
        provider_profiles.profile_photo_path AS "profilePhotoPath",
        provider_profiles.profile_status AS "profileStatus",
        latest_review.decision_note AS "reviewNote",
        COALESCE(availability.status, 'OFFLINE') AS availability,
        COALESCE(locations.locality_en, locations.locality_kn, '') AS locality,
        COALESCE(locations.taluk_en, locations.taluk_kn) AS taluk,
        COALESCE(locations.district_en, locations.district_kn, '') AS district,
        COALESCE(locations.state_en, 'Karnataka') AS state,
        CASE
          WHEN locations.locality_kn IS NOT NULL AND locations.locality_en IS NULL THEN 'kn'
          ELSE 'en'
        END AS "languageCode"
      FROM provider_profiles
      JOIN users ON users.id = provider_profiles.user_id
      JOIN locations ON locations.id = provider_profiles.location_id
      LEFT JOIN availability ON availability.provider_id = provider_profiles.id
      LEFT JOIN LATERAL (
        SELECT verification_records.decision_note
        FROM verification_records
        WHERE verification_records.provider_id = provider_profiles.id
          AND verification_records.level = 'GRAMA360'
        ORDER BY verification_records.submitted_at DESC, verification_records.id DESC
        LIMIT 1
      ) AS latest_review ON TRUE
      WHERE users.firebase_uid = $1
      LIMIT 1
    `,
    [firebaseUid],
  );
  const row = profileResult.rows[0];
  if (!row) return null;

  const [serviceResult, languageResult, hoursResult] = await Promise.all([
    client.query<ProviderServiceRow>(
      `
        SELECT service_categories.id::TEXT AS id,
               service_categories.slug,
               service_categories.name_en AS name,
               provider_services.is_primary AS "isPrimary"
        FROM provider_services
        JOIN service_categories ON service_categories.id = provider_services.category_id
        WHERE provider_services.provider_id = $1
        ORDER BY provider_services.is_primary DESC, service_categories.sort_order,
                 service_categories.name_en
      `,
      [row.id],
    ),
    client.query<ProviderLanguageRow>(
      `
        SELECT language_code AS "languageCode"
        FROM provider_languages
        WHERE provider_id = $1
        ORDER BY language_code
      `,
      [row.id],
    ),
    client.query<ProviderWorkingHourRow>(
      `
        SELECT weekday,
               to_char(opens_at, 'HH24:MI') AS "opensAt",
               to_char(closes_at, 'HH24:MI') AS "closesAt",
               is_closed AS "isClosed"
        FROM working_hours
        WHERE provider_id = $1
        ORDER BY weekday
      `,
      [row.id],
    ),
  ]);

  return {
    id: row.id,
    displayName: row.displayName,
    businessName: row.businessName,
    secondaryPhoneNumber: row.secondaryPhoneNumber,
    serviceRadiusKm: Number(row.serviceRadiusKm),
    experienceYears: row.experienceYears,
    description: row.description,
    profilePhotoPath: row.profilePhotoPath,
    profileStatus: row.profileStatus,
    reviewNote: row.reviewNote,
    availability: row.availability,
    location: {
      locality: row.locality,
      taluk: row.taluk,
      district: row.district,
      state: row.state,
      languageCode: row.languageCode,
    },
    services: serviceResult.rows,
    languages: languageResult.rows.map((language) => language.languageCode),
    workingHours: hoursResult.rows.map((hour) => ({
      weekday: hour.weekday,
      isClosed: hour.isClosed,
      opensAt: hour.opensAt,
      closesAt: hour.closesAt,
    })),
  };
}
