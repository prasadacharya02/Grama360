import type { Pool } from 'pg';
import { describe, expect, it, vi } from 'vitest';

import { PostgresProviderDirectoryStore } from '../src/modules/discovery/postgres-provider-directory-store.js';
import { decodePageCursor } from '../src/utils/page-cursor.js';

const customerUserId = 'a3c7b9dd-9d43-48e4-93ba-7d40d2162b11';
const firstProviderId = '33333333-3333-4333-8333-333333333333';
const nextProviderId = '44444444-4444-4444-8444-444444444444';
const createdAt = '2026-10-01T10:00:00.123456Z';

function providerRow(id: string, favoriteCreatedAt: string) {
  return {
    id,
    displayName: 'Local Provider',
    businessName: null,
    profilePhotoPath: null,
    serviceRadiusKm: '10.00',
    experienceYears: 4,
    availability: 'AVAILABLE',
    locality: 'Kusugal',
    district: 'Dharwad',
    state: 'Karnataka',
    languageCode: 'en',
    services: [],
    languages: ['en'],
    averageRating: null,
    reviewCount: 0,
    favoriteCreatedAt,
  };
}

function createStore() {
  const query = vi.fn();
  const pool = { query } as unknown as Pool;
  return { store: new PostgresProviderDirectoryStore(() => pool), query };
}

describe('PostgresProviderDirectoryStore favorites pagination', () => {
  it('uses a stable keyset cursor and returns public-safe active providers', async () => {
    const { store, query } = createStore();
    query.mockResolvedValueOnce({
      rows: [
        providerRow(firstProviderId, createdAt),
        providerRow(nextProviderId, '2026-09-30T10:00:00.000000Z'),
      ],
    });

    const firstPage = await store.listFavorites(customerUserId, 'en', 1, null);

    expect(firstPage.items).toHaveLength(1);
    expect(firstPage.items[0]?.id).toBe(firstProviderId);
    expect(firstPage.items[0]).not.toHaveProperty('phoneNumber');
    expect(firstPage.hasMore).toBe(true);
    expect(decodePageCursor(firstPage.nextCursor!, 'favorite')).toEqual({
      id: firstProviderId,
      createdAt,
    });

    const sql = String(query.mock.calls[0]?.[0]);
    expect(sql).toContain('customer_favorites.created_at < $3::TIMESTAMPTZ');
    expect(sql).toContain('provider_profiles.id > $4::UUID');
    expect(sql).toContain("customer_role.role = 'CUSTOMER'");
    expect(sql).toContain("provider_role.role = 'PROVIDER'");
    expect(sql).toContain('service_categories.is_active = TRUE');
    expect(sql).not.toContain('phone_e164');
    expect(query.mock.calls[0]?.[1]).toEqual([ 'en', customerUserId, null, null, 2 ]);

    query.mockResolvedValueOnce({ rows: [providerRow(nextProviderId, '2026-09-30T10:00:00.000000Z')] });
    const secondPage = await store.listFavorites(customerUserId, 'en', 1, {
      id: firstProviderId,
      createdAt,
    });
    expect(secondPage.items[0]?.id).toBe(nextProviderId);
    expect(secondPage.hasMore).toBe(false);
    expect(secondPage.nextCursor).toBeNull();
    expect(query.mock.calls[1]?.[1]).toEqual([
      'en',
      customerUserId,
      createdAt,
      firstProviderId,
      2,
    ]);
  });
});
