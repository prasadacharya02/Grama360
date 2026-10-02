import type { Pool, QueryResultRow } from 'pg';

import { getDatabasePool } from '../../db/pool.js';
import type {
  DiscoveryLanguage,
  ProviderDirectoryStore,
  ProviderSearchOptions,
  ProviderSearchPage,
  PublicProviderProfile,
  PublicProviderService,
  PublicProviderSummary,
} from './discovery.types.js';

interface ProviderDirectoryRow extends QueryResultRow {
  id: string;
  displayName: string;
  businessName: string | null;
  profilePhotoPath: string | null;
  serviceRadiusKm: string | number;
  experienceYears: number;
  availability: PublicProviderSummary['availability'] | null;
  locality: string;
  district: string;
  state: string;
  languageCode: DiscoveryLanguage;
  services: unknown;
  languages: unknown;
  averageRating: string | number | null;
  reviewCount: string | number;
  description?: string | null;
  workingHours?: unknown;
}

const providerProjection = `
  provider_profiles.id::TEXT AS id,
  provider_profiles.display_name AS "displayName",
  provider_profiles.business_name AS "businessName",
  provider_profiles.profile_photo_path AS "profilePhotoPath",
  provider_profiles.service_radius_km AS "serviceRadiusKm",
  provider_profiles.experience_years::INTEGER AS "experienceYears",
  COALESCE(availability.status, 'OFFLINE') AS availability,
  CASE WHEN $1::TEXT = 'kn'
       THEN COALESCE(locations.locality_kn, locations.locality_en)
       ELSE COALESCE(locations.locality_en, locations.locality_kn)
  END AS locality,
  CASE WHEN $1::TEXT = 'kn'
       THEN COALESCE(locations.district_kn, locations.district_en)
       ELSE COALESCE(locations.district_en, locations.district_kn)
  END AS district,
  CASE WHEN $1::TEXT = 'kn'
       THEN COALESCE(locations.state_kn, locations.state_en)
       ELSE COALESCE(locations.state_en, locations.state_kn)
  END AS state,
  $1::TEXT AS "languageCode",
  COALESCE(provider_services.items, '[]'::JSON) AS services,
  COALESCE(provider_languages.items, ARRAY[]::TEXT[]) AS languages,
  review_stats.average_rating AS "averageRating",
  COALESCE(review_stats.review_count, 0)::INTEGER AS "reviewCount"
`;

const providerJoins = `
  FROM provider_profiles
  JOIN users AS provider_user
    ON provider_user.id = provider_profiles.user_id
   AND provider_user.account_status = 'ACTIVE'
  JOIN locations ON locations.id = provider_profiles.location_id
  LEFT JOIN availability ON availability.provider_id = provider_profiles.id
  LEFT JOIN LATERAL (
    SELECT
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', service_categories.id::TEXT,
          'slug', service_categories.slug,
          'name', CASE WHEN $1::TEXT = 'kn'
                       THEN service_categories.name_kn
                       ELSE service_categories.name_en
                  END,
          'isPrimary', provider_services.is_primary
        )
        ORDER BY provider_services.is_primary DESC,
                 service_categories.sort_order,
                 service_categories.name_en
      ) AS items
    FROM provider_services
    JOIN service_categories ON service_categories.id = provider_services.category_id
    WHERE provider_services.provider_id = provider_profiles.id
      AND service_categories.is_active = TRUE
  ) AS provider_services ON TRUE
  LEFT JOIN LATERAL (
    SELECT ARRAY_AGG(provider_languages.language_code ORDER BY provider_languages.language_code) AS items
    FROM provider_languages
    WHERE provider_languages.provider_id = provider_profiles.id
  ) AS provider_languages ON TRUE
  LEFT JOIN LATERAL (
    SELECT
      ROUND(AVG(reviews.rating)::NUMERIC, 1)::DOUBLE PRECISION AS average_rating,
      COUNT(*)::INTEGER AS review_count
    FROM reviews
    WHERE reviews.provider_id = provider_profiles.id
      AND reviews.moderation_status = 'VISIBLE'
  ) AS review_stats ON TRUE
`;

export class PostgresProviderDirectoryStore implements ProviderDirectoryStore {
  constructor(private readonly getPool: () => Pool = getDatabasePool) {}

  async searchProviders(options: ProviderSearchOptions): Promise<ProviderSearchPage> {
    const queryPattern = toLikePattern(options.query);
    const locationPattern = toLikePattern(options.location);
    const result = await this.getPool().query<ProviderDirectoryRow>(
      `
        SELECT ${providerProjection}
        ${providerJoins}
        WHERE provider_profiles.profile_status = 'ACTIVE'
          AND EXISTS (
            SELECT 1
            FROM provider_services AS active_service
            JOIN service_categories AS active_category
              ON active_category.id = active_service.category_id
             AND active_category.is_active = TRUE
            WHERE active_service.provider_id = provider_profiles.id
          )
          AND ($2::UUID IS NULL OR EXISTS (
            SELECT 1
            FROM provider_services AS matching_service
            JOIN service_categories AS matching_category
              ON matching_category.id = matching_service.category_id
             AND matching_category.is_active = TRUE
            WHERE matching_service.provider_id = provider_profiles.id
              AND matching_service.category_id = $2::UUID
          ))
          AND ($3::TEXT IS NULL OR
            provider_profiles.display_name ILIKE $3 ESCAPE CHR(92) OR
            provider_profiles.business_name ILIKE $3 ESCAPE CHR(92) OR
            EXISTS (
              SELECT 1
              FROM provider_services AS searchable_service
              JOIN service_categories AS searchable_category
                ON searchable_category.id = searchable_service.category_id
               AND searchable_category.is_active = TRUE
              WHERE searchable_service.provider_id = provider_profiles.id
                AND (
                  searchable_category.name_en ILIKE $3 ESCAPE CHR(92) OR
                  searchable_category.name_kn ILIKE $3 ESCAPE CHR(92)
                )
            )
          )
          AND ($4::TEXT IS NULL OR
            locations.locality_en ILIKE $4 ESCAPE CHR(92) OR
            locations.locality_kn ILIKE $4 ESCAPE CHR(92) OR
            locations.district_en ILIKE $4 ESCAPE CHR(92) OR
            locations.district_kn ILIKE $4 ESCAPE CHR(92) OR
            locations.taluk_en ILIKE $4 ESCAPE CHR(92) OR
            locations.taluk_kn ILIKE $4 ESCAPE CHR(92)
          )
          AND ($5::BOOLEAN IS FALSE OR
            COALESCE(availability.status, 'OFFLINE') = 'AVAILABLE'
          )
        ORDER BY CASE COALESCE(availability.status, 'OFFLINE')
                   WHEN 'AVAILABLE' THEN 0
                   WHEN 'BUSY' THEN 1
                   ELSE 2
                 END,
                 review_stats.average_rating DESC NULLS LAST,
                 review_stats.review_count DESC,
                 provider_profiles.display_name ASC
        LIMIT $6 OFFSET $7
      `,
      [
        options.language,
        options.categoryId ?? null,
        queryPattern,
        locationPattern,
        options.availableNow ?? false,
        options.limit + 1,
        options.offset,
      ],
    );

    const hasMore = result.rows.length > options.limit;
    return {
      items: result.rows.slice(0, options.limit).map(toSummary),
      hasMore,
    };
  }

  async getPublicProfile(
    providerId: string,
    language: DiscoveryLanguage,
  ): Promise<PublicProviderProfile | null> {
    const result = await this.getPool().query<ProviderDirectoryRow>(
      `
        SELECT ${providerProjection},
               provider_profiles.description AS description,
               COALESCE(provider_hours.items, '[]'::JSON) AS "workingHours"
        ${providerJoins}
        LEFT JOIN LATERAL (
          SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'weekday', working_hours.weekday,
              'opensAt', CASE WHEN working_hours.opens_at IS NULL
                              THEN NULL
                              ELSE TO_CHAR(working_hours.opens_at, 'HH24:MI')
                         END,
              'closesAt', CASE WHEN working_hours.closes_at IS NULL
                               THEN NULL
                               ELSE TO_CHAR(working_hours.closes_at, 'HH24:MI')
                          END,
              'isClosed', working_hours.is_closed
            ) ORDER BY working_hours.weekday
          ) AS items
          FROM working_hours
          WHERE working_hours.provider_id = provider_profiles.id
        ) AS provider_hours ON TRUE
        WHERE provider_profiles.id = $2::UUID
          AND provider_profiles.profile_status = 'ACTIVE'
          AND EXISTS (
            SELECT 1
            FROM provider_services AS active_service
            JOIN service_categories AS active_category
              ON active_category.id = active_service.category_id
             AND active_category.is_active = TRUE
            WHERE active_service.provider_id = provider_profiles.id
          )
        LIMIT 1
      `,
      [language, providerId],
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      ...toSummary(row),
      description: row.description ?? null,
      workingHours: toWorkingHours(row.workingHours),
    };
  }

  async recordCallIntent(providerId: string): Promise<string | null> {
    const result = await this.getPool().query<{ phoneNumber: string }>(
      `
        WITH eligible_provider AS (
          SELECT provider_profiles.id, provider_user.phone_e164
          FROM provider_profiles
          JOIN users AS provider_user ON provider_user.id = provider_profiles.user_id
          WHERE provider_profiles.id = $1::UUID
            AND provider_profiles.profile_status = 'ACTIVE'
            AND provider_user.account_status = 'ACTIVE'
          FOR SHARE OF provider_profiles, provider_user
        ), recorded_tap AS (
          INSERT INTO provider_metrics_daily (provider_id, metric_date, call_taps)
          SELECT id, (NOW() AT TIME ZONE 'UTC')::DATE, 1
          FROM eligible_provider
          ON CONFLICT (provider_id, metric_date)
          DO UPDATE SET call_taps = provider_metrics_daily.call_taps + 1
          RETURNING provider_id
        )
        SELECT eligible_provider.phone_e164 AS "phoneNumber"
        FROM eligible_provider
        JOIN recorded_tap ON recorded_tap.provider_id = eligible_provider.id
      `,
      [providerId],
    );
    return result.rows[0]?.phoneNumber ?? null;
  }
}

function toLikePattern(value: string | undefined): string | null {
  if (value === undefined || value.length === 0) return null;
  const escaped = value.replace(/[\\%_]/g, (character) => `\\${character}`);
  return `%${escaped}%`;
}

function toSummary(row: ProviderDirectoryRow): PublicProviderSummary {
  const radius = Number(row.serviceRadiusKm);
  if (!Number.isFinite(radius)) {
    throw new Error('Database returned an invalid provider service radius.');
  }
  const averageRating = row.averageRating === null ? null : Number(row.averageRating);
  if (averageRating !== null && !Number.isFinite(averageRating)) {
    throw new Error('Database returned an invalid provider rating.');
  }
  return {
    id: row.id,
    displayName: row.displayName,
    businessName: row.businessName,
    profilePhotoPath: row.profilePhotoPath,
    serviceRadiusKm: radius,
    experienceYears: row.experienceYears,
    availability: row.availability ?? 'OFFLINE',
    location: {
      locality: row.locality,
      district: row.district,
      state: row.state,
      languageCode: row.languageCode,
    },
    services: toServices(row.services),
    languages: toSpokenLanguages(row.languages),
    averageRating,
    reviewCount: Number(row.reviewCount),
  };
}

function toServices(value: unknown): PublicProviderService[] {
  const parsed = parseJsonArray(value, 'provider services');
  return parsed.map((item) => {
    if (typeof item !== 'object' || item === null) {
      throw new Error('Database returned invalid provider service data.');
    }
    const service = item as Record<string, unknown>;
    if (
      typeof service.id !== 'string' ||
      typeof service.slug !== 'string' ||
      typeof service.name !== 'string'
    ) {
      throw new Error('Database returned invalid provider service data.');
    }
    return {
      id: service.id,
      slug: service.slug,
      name: service.name,
      isPrimary: service.isPrimary === true,
    };
  });
}

function toWorkingHours(value: unknown): PublicProviderProfile['workingHours'] {
  const parsed = parseJsonArray(value, 'provider working hours');
  return parsed.map((item) => {
    if (typeof item !== 'object' || item === null) {
      throw new Error('Database returned invalid provider working hours.');
    }
    const hour = item as Record<string, unknown>;
    if (
      typeof hour.weekday !== 'number' ||
      typeof hour.isClosed !== 'boolean' ||
      (hour.opensAt !== null && typeof hour.opensAt !== 'string') ||
      (hour.closesAt !== null && typeof hour.closesAt !== 'string')
    ) {
      throw new Error('Database returned invalid provider working hours.');
    }
    return {
      weekday: hour.weekday,
      isClosed: hour.isClosed,
      opensAt: hour.opensAt as string | null,
      closesAt: hour.closesAt as string | null,
    };
  });
}

function toSpokenLanguages(value: unknown): PublicProviderSummary['languages'] {
  const parsed = typeof value === 'string' ? JSON.parse(value) as unknown : value;
  const allowedLanguages = new Set(['kn', 'en', 'tcy']);
  if (
    !Array.isArray(parsed) ||
    parsed.some((item) => typeof item !== 'string' || !allowedLanguages.has(item))
  ) {
    throw new Error('Database returned invalid provider language data.');
  }
  return parsed as PublicProviderSummary['languages'];
}

function parseJsonArray(value: unknown, label: string): unknown[] {
  const parsed = typeof value === 'string' ? JSON.parse(value) as unknown : value;
  if (!Array.isArray(parsed)) throw new Error(`Database returned invalid ${label}.`);
  return parsed;
}
