import type { Pool, QueryResultRow } from 'pg';

import { getDatabasePool } from '../../db/pool.js';
import type { AppLanguage, AppRole, AppSession, AuthUserStore, PhoneVerifiedFirebaseIdentity } from './types.js';
import { AccountNotActiveError, PhoneNumberAlreadyLinkedError } from './types.js';

interface SessionRow extends QueryResultRow {
  id: string;
  phoneNumber: string;
  fullName: string | null;
  preferredLanguage: AppLanguage;
  accountStatus: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  roles: AppRole[];
}

function asSession(row: SessionRow): AppSession {
  return {
    user: {
      id: row.id,
      phoneNumber: row.phoneNumber,
      fullName: row.fullName,
      preferredLanguage: row.preferredLanguage,
    },
    roles: row.roles,
    onboardingComplete: row.roles.length > 0,
  };
}

export class PostgresAuthUserStore implements AuthUserStore {
  constructor(private readonly getPool: () => Pool = getDatabasePool) {}

  async syncPhoneAccount(
    identity: PhoneVerifiedFirebaseIdentity,
    preferredLanguage: AppLanguage | undefined,
  ): Promise<AppSession> {
    const pool = this.getPool();

    try {
      const result = await pool.query<SessionRow>(
        `
          WITH upserted AS (
            INSERT INTO users (firebase_uid, phone_e164, preferred_language, phone_verified_at)
            VALUES ($1, $2, COALESCE($3::TEXT, 'en'), NOW())
            ON CONFLICT (firebase_uid) DO UPDATE SET
              phone_e164 = EXCLUDED.phone_e164,
              preferred_language = COALESCE($3::TEXT, users.preferred_language),
              phone_verified_at = CASE
                WHEN users.phone_e164 IS DISTINCT FROM EXCLUDED.phone_e164 THEN NOW()
                ELSE COALESCE(users.phone_verified_at, NOW())
              END,
              updated_at = NOW()
            WHERE users.account_status = 'ACTIVE'
            RETURNING id, firebase_uid, phone_e164, full_name, preferred_language, account_status
          )
          SELECT
            upserted.id::TEXT AS id,
            upserted.phone_e164 AS "phoneNumber",
            upserted.full_name AS "fullName",
            upserted.preferred_language AS "preferredLanguage",
            upserted.account_status AS "accountStatus",
            COALESCE(
              ARRAY_AGG(user_roles.role) FILTER (WHERE user_roles.role IS NOT NULL),
              ARRAY[]::TEXT[]
            ) AS roles
          FROM upserted
          LEFT JOIN user_roles ON user_roles.user_id = upserted.id
          GROUP BY upserted.id, upserted.phone_e164, upserted.full_name,
                   upserted.preferred_language, upserted.account_status
        `,
        [identity.uid, identity.phoneNumber, preferredLanguage ?? null],
      );

      const row = result.rows[0];
      if (row) return asSession(row);

      const existing = await pool.query<{ account_status: string }>(
        'SELECT account_status FROM users WHERE firebase_uid = $1',
        [identity.uid],
      );
      if (existing.rows[0]) throw new AccountNotActiveError();
      throw new Error('Account sync did not return a user.');
    } catch (error) {
      if (isPostgresUniqueViolation(error)) throw new PhoneNumberAlreadyLinkedError();
      throw error;
    }
  }

  async findSession(firebaseUid: string): Promise<AppSession | null> {
    const pool = this.getPool();
    const result = await pool.query<SessionRow>(
      `
        SELECT
          users.id::TEXT AS id,
          users.phone_e164 AS "phoneNumber",
          users.full_name AS "fullName",
          users.preferred_language AS "preferredLanguage",
          users.account_status AS "accountStatus",
          COALESCE(
            ARRAY_AGG(user_roles.role) FILTER (WHERE user_roles.role IS NOT NULL),
            ARRAY[]::TEXT[]
          ) AS roles
        FROM users
        LEFT JOIN user_roles ON user_roles.user_id = users.id
        WHERE users.firebase_uid = $1
        GROUP BY users.id
      `,
      [firebaseUid],
    );

    const row = result.rows[0];
    if (!row) return null;
    if (row.accountStatus !== 'ACTIVE') throw new AccountNotActiveError();
    return asSession(row);
  }

  async addRole(firebaseUid: string, role: AppRole): Promise<AppSession | null> {
    const currentSession = await this.findSession(firebaseUid);
    if (!currentSession) return null;

    await this.getPool().query(
      `
        INSERT INTO user_roles (user_id, role)
        SELECT id, $2
        FROM users
        WHERE firebase_uid = $1 AND account_status = 'ACTIVE'
        ON CONFLICT (user_id, role) DO NOTHING
      `,
      [firebaseUid, role],
    );

    return this.findSession(firebaseUid);
  }
}

function isPostgresUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505'
  );
}
