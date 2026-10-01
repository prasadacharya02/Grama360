import type { Pool, PoolClient } from 'pg';
import { describe, expect, it, vi } from 'vitest';

import { PostgresAdminReviewStore } from '../src/modules/admin/postgres-admin-review-store.js';
import {
  AdminPermissionRequiredError,
  ProviderReviewRecordMissingError,
} from '../src/modules/admin/admin-review.types.js';

const firebaseUid = 'firebase-moderator-1';
const adminUserId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const providerId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const reviewedAt = new Date('2026-10-01T12:00:00.000Z');

interface FakeOptions {
  adminRole?: 'SUPER_ADMIN' | 'MODERATOR' | 'SUPPORT';
  missingPendingRecord?: boolean;
}

function createFakeStore(options: FakeOptions = {}) {
  const statements: Array<{ sql: string; values: unknown[] }> = [];
  const query = vi.fn(async (sql: string, values: unknown[] = []) => {
    const normalized = sql.replace(/\s+/g, ' ').trim();
    statements.push({ sql: normalized, values });
    if (normalized === 'BEGIN' || normalized === 'COMMIT' || normalized === 'ROLLBACK') {
      return { rows: [] };
    }
    if (normalized.includes('FROM users') && normalized.includes('JOIN admin_users')) {
      return {
        rows: [{ userId: adminUserId, role: options.adminRole ?? 'MODERATOR', mfaEnrolled: true }],
      };
    }
    if (normalized.includes('FROM provider_profiles') && normalized.includes('FOR UPDATE')) {
      return { rows: [{ id: providerId, profileStatus: 'PENDING_REVIEW' }] };
    }
    if (normalized.startsWith('WITH latest_pending')) {
      return {
        rows: options.missingPendingRecord ? [] : [{ reviewedAt }],
      };
    }
    return { rows: [] };
  });
  const client = { query, release: vi.fn() } as unknown as PoolClient;
  const pool = { connect: vi.fn(async () => client) } as unknown as Pool;
  return {
    store: new PostgresAdminReviewStore(() => pool),
    statements,
    client,
  };
}

describe('PostgresAdminReviewStore transactions', () => {
  it('updates profile and verification states and writes an audit row atomically', async () => {
    const fake = createFakeStore();
    const result = await fake.store.decideProviderReview(
      firebaseUid,
      providerId,
      'APPROVE',
      null,
    );

    expect(result).toMatchObject({
      providerId,
      profileStatus: 'ACTIVE',
      decision: 'APPROVE',
      reviewedAt: reviewedAt.toISOString(),
    });
    expect(fake.statements[0]?.sql).toBe('BEGIN');
    expect(fake.statements.at(-1)?.sql).toBe('COMMIT');
    expect(fake.statements.some(({ sql }) => sql.includes('UPDATE verification_records AS record')))
      .toBe(true);
    expect(fake.statements.some(({ sql }) => sql.startsWith('UPDATE provider_profiles')))
      .toBe(true);
    expect(fake.statements.some(({ sql }) => sql.startsWith('INSERT INTO admin_audit_logs')))
      .toBe(true);
    expect(fake.client.release).toHaveBeenCalledOnce();
  });

  it('rolls back when the provider has no pending verification record', async () => {
    const fake = createFakeStore({ missingPendingRecord: true });
    await expect(
      fake.store.decideProviderReview(firebaseUid, providerId, 'REJECT', 'Needs more detail.'),
    ).rejects.toBeInstanceOf(ProviderReviewRecordMissingError);

    expect(fake.statements.at(-1)?.sql).toBe('ROLLBACK');
    expect(fake.statements.some(({ sql }) => sql.startsWith('UPDATE provider_profiles')))
      .toBe(false);
    expect(fake.client.release).toHaveBeenCalledOnce();
  });

  it('does not allow a support admin to review even if an upstream check was bypassed', async () => {
    const fake = createFakeStore({ adminRole: 'SUPPORT' });
    await expect(
      fake.store.decideProviderReview(firebaseUid, providerId, 'APPROVE', null),
    ).rejects.toBeInstanceOf(AdminPermissionRequiredError);

    expect(fake.statements.at(-1)?.sql).toBe('ROLLBACK');
    expect(fake.statements.some(({ sql }) => sql.includes('FROM provider_profiles'))).toBe(false);
  });
});
