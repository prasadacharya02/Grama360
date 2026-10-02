import type { Pool, QueryResultRow } from 'pg';

import { getDatabasePool } from '../../db/pool.js';
import { encodePageCursor, type PageCursorPosition } from '../../utils/page-cursor.js';
import type {
  CustomerProviderReview,
  ProviderReviewPage,
  PublicProviderReview,
  ReviewInput,
  ReviewStore,
} from './reviews.types.js';
import { ReviewAlreadyExistsError } from './reviews.types.js';

interface CustomerEligibilityRow extends QueryResultRow {
  eligible: boolean;
}

interface ReviewRow extends QueryResultRow {
  id: string;
  rating: number;
  reviewText: string | null;
  moderationStatus: CustomerProviderReview['moderationStatus'];
  createdAt: Date | string;
  cursorCreatedAt?: string;
  updatedAt: Date | string;
}

interface PublicReviewRow extends ReviewRow {
  reviewerDisplayName: string;
  isMine: boolean;
}

export class PostgresReviewStore implements ReviewStore {
  constructor(private readonly getPool: () => Pool = getDatabasePool) {}

  async listProviderReviews(
    providerId: string,
    customerUserId: string,
    limit: number,
    cursor: PageCursorPosition | null,
  ): Promise<ProviderReviewPage | null> {
    if (!(await this.isEligibleCustomerAndProvider(customerUserId, providerId))) return null;

    const [reviewsResult, myReviewResult] = await Promise.all([
      this.getPool().query<PublicReviewRow>(
        `
          SELECT reviews.id::TEXT AS id,
                 reviews.rating::INTEGER AS rating,
                 reviews.review_text AS "reviewText",
                 COALESCE(NULLIF(SPLIT_PART(BTRIM(reviewer.full_name), ' ', 1), ''), 'Customer') AS "reviewerDisplayName",
                 reviews.created_at AS "createdAt",
                 TO_CHAR(reviews.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "cursorCreatedAt",
                 reviews.updated_at AS "updatedAt",
                 reviews.moderation_status AS "moderationStatus",
                 (reviews.customer_user_id = $2::UUID) AS "isMine"
          FROM reviews
          JOIN users AS reviewer ON reviewer.id = reviews.customer_user_id
          WHERE reviews.provider_id = $1::UUID
            AND reviews.moderation_status = 'VISIBLE'
            AND EXISTS (
              SELECT 1
              FROM provider_profiles
              JOIN users AS provider_user
                ON provider_user.id = provider_profiles.user_id
               AND provider_user.account_status = 'ACTIVE'
              WHERE provider_profiles.id = reviews.provider_id
                AND provider_profiles.profile_status = 'ACTIVE'
                AND EXISTS (
                  SELECT 1
                  FROM user_roles AS provider_role
                  WHERE provider_role.user_id = provider_profiles.user_id
                    AND provider_role.role = 'PROVIDER'
                )
                AND EXISTS (
                  SELECT 1
                  FROM provider_services
                  JOIN service_categories
                    ON service_categories.id = provider_services.category_id
                   AND service_categories.is_active = TRUE
                  WHERE provider_services.provider_id = provider_profiles.id
                )
            )
            AND (
              $3::TIMESTAMPTZ IS NULL
              OR reviews.created_at < $3::TIMESTAMPTZ
              OR (reviews.created_at = $3::TIMESTAMPTZ AND reviews.id < $4::UUID)
            )
          ORDER BY reviews.created_at DESC, reviews.id DESC
          LIMIT $5
        `,
        [providerId, customerUserId, cursor?.createdAt ?? null, cursor?.id ?? null, limit + 1],
      ),
      this.getPool().query<ReviewRow>(
        `
          SELECT reviews.id::TEXT AS id,
                 reviews.rating::INTEGER AS rating,
                 reviews.review_text AS "reviewText",
                 reviews.moderation_status AS "moderationStatus",
                 reviews.created_at AS "createdAt",
                 reviews.updated_at AS "updatedAt"
          FROM reviews
          WHERE reviews.provider_id = $1::UUID
            AND reviews.customer_user_id = $2::UUID
          LIMIT 1
        `,
        [providerId, customerUserId],
      ),
    ]);

    const hasMore = reviewsResult.rows.length > limit;
    const visibleRows = reviewsResult.rows.slice(0, limit);
    const lastRow = visibleRows.at(-1);
    return {
      items: visibleRows.map(toPublicReview),
      hasMore,
      nextCursor: hasMore && lastRow?.cursorCreatedAt
        ? encodePageCursor('review', { createdAt: lastRow.cursorCreatedAt, id: lastRow.id })
        : null,
      myReview: myReviewResult.rows[0] ? toCustomerReview(myReviewResult.rows[0]) : null,
    };
  }

  async createReview(
    customerUserId: string,
    providerId: string,
    input: ReviewInput,
  ): Promise<CustomerProviderReview | null> {
    try {
      const result = await this.getPool().query<ReviewRow>(
        `
          WITH eligible_customer AS MATERIALIZED (
            SELECT users.id
            FROM users
            JOIN user_roles
              ON user_roles.user_id = users.id
             AND user_roles.role = 'CUSTOMER'
            WHERE users.id = $1::UUID
              AND users.account_status = 'ACTIVE'
            FOR SHARE OF users, user_roles
          ), eligible_provider AS MATERIALIZED (
            SELECT provider_profiles.id
            FROM provider_profiles
            JOIN users AS provider_user
              ON provider_user.id = provider_profiles.user_id
             AND provider_user.account_status = 'ACTIVE'
            WHERE provider_profiles.id = $2::UUID
              AND provider_profiles.profile_status = 'ACTIVE'
              AND EXISTS (
                SELECT 1
                FROM user_roles AS provider_role
                WHERE provider_role.user_id = provider_profiles.user_id
                  AND provider_role.role = 'PROVIDER'
              )
              AND EXISTS (
                SELECT 1
                FROM provider_services
                JOIN service_categories
                  ON service_categories.id = provider_services.category_id
                 AND service_categories.is_active = TRUE
                WHERE provider_services.provider_id = provider_profiles.id
              )
            FOR SHARE OF provider_profiles, provider_user
          )
          INSERT INTO reviews (
            provider_id,
            customer_user_id,
            rating,
            review_text,
            moderation_status
          )
          SELECT eligible_provider.id, eligible_customer.id, $3, $4, 'VISIBLE'
          FROM eligible_customer
          CROSS JOIN eligible_provider
          RETURNING id::TEXT AS id,
                    rating::INTEGER AS rating,
                    review_text AS "reviewText",
                    moderation_status AS "moderationStatus",
                    created_at AS "createdAt",
                    updated_at AS "updatedAt"
        `,
        [customerUserId, providerId, input.rating, input.reviewText],
      );
      const row = result.rows[0];
      return row ? toCustomerReview(row) : null;
    } catch (error) {
      if (isUniqueViolation(error)) throw new ReviewAlreadyExistsError();
      throw error;
    }
  }

  async updateReview(
    customerUserId: string,
    reviewId: string,
    input: ReviewInput,
  ): Promise<CustomerProviderReview | null> {
    const result = await this.getPool().query<ReviewRow>(
      `
        UPDATE reviews
        SET rating = $3,
            review_text = $4,
            updated_at = NOW()
        WHERE reviews.id = $1::UUID
          AND reviews.customer_user_id = $2::UUID
          AND reviews.moderation_status = 'VISIBLE'
          AND EXISTS (
            SELECT 1
            FROM users AS customer_user
            JOIN user_roles AS customer_role
              ON customer_role.user_id = customer_user.id
             AND customer_role.role = 'CUSTOMER'
            WHERE customer_user.id = $2::UUID
              AND customer_user.account_status = 'ACTIVE'
          )
          AND EXISTS (
            SELECT 1
            FROM provider_profiles
            JOIN users AS provider_user
              ON provider_user.id = provider_profiles.user_id
             AND provider_user.account_status = 'ACTIVE'
            WHERE provider_profiles.id = reviews.provider_id
              AND provider_profiles.profile_status = 'ACTIVE'
              AND EXISTS (
                SELECT 1
                FROM user_roles AS provider_role
                WHERE provider_role.user_id = provider_profiles.user_id
                  AND provider_role.role = 'PROVIDER'
              )
              AND EXISTS (
                SELECT 1
                FROM provider_services
                JOIN service_categories
                  ON service_categories.id = provider_services.category_id
                 AND service_categories.is_active = TRUE
                WHERE provider_services.provider_id = provider_profiles.id
              )
          )
        RETURNING reviews.id::TEXT AS id,
                  reviews.rating::INTEGER AS rating,
                  reviews.review_text AS "reviewText",
                  reviews.moderation_status AS "moderationStatus",
                  reviews.created_at AS "createdAt",
                  reviews.updated_at AS "updatedAt"
      `,
      [reviewId, customerUserId, input.rating, input.reviewText],
    );
    const row = result.rows[0];
    return row ? toCustomerReview(row) : null;
  }

  private async isEligibleCustomerAndProvider(
    customerUserId: string,
    providerId: string,
  ): Promise<boolean> {
    const result = await this.getPool().query<CustomerEligibilityRow>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM users AS customer_user
          JOIN user_roles AS customer_role
            ON customer_role.user_id = customer_user.id
           AND customer_role.role = 'CUSTOMER'
          WHERE customer_user.id = $1::UUID
            AND customer_user.account_status = 'ACTIVE'
        ) AND EXISTS (
          SELECT 1
          FROM provider_profiles
          JOIN users AS provider_user
            ON provider_user.id = provider_profiles.user_id
           AND provider_user.account_status = 'ACTIVE'
          WHERE provider_profiles.id = $2::UUID
            AND provider_profiles.profile_status = 'ACTIVE'
            AND EXISTS (
              SELECT 1
              FROM user_roles AS provider_role
              WHERE provider_role.user_id = provider_profiles.user_id
                AND provider_role.role = 'PROVIDER'
            )
            AND EXISTS (
              SELECT 1
              FROM provider_services
              JOIN service_categories
                ON service_categories.id = provider_services.category_id
               AND service_categories.is_active = TRUE
              WHERE provider_services.provider_id = provider_profiles.id
            )
        ) AS eligible
      `,
      [customerUserId, providerId],
    );
    return result.rows[0]?.eligible ?? false;
  }
}

function toPublicReview(row: PublicReviewRow): PublicProviderReview {
  return {
    id: row.id,
    rating: Number(row.rating),
    reviewText: row.reviewText,
    reviewerDisplayName: row.reviewerDisplayName,
    createdAt: toIsoString(row.createdAt),
    isMine: row.isMine,
  };
}

function toCustomerReview(row: ReviewRow): CustomerProviderReview {
  return {
    id: row.id,
    rating: Number(row.rating),
    reviewText: row.reviewText,
    moderationStatus: row.moderationStatus,
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
  };
}

function toIsoString(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new Error('Database returned an invalid review timestamp.');
  }
  return date.toISOString();
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}
