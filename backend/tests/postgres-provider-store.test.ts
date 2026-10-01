import type { Pool, PoolClient } from 'pg';
import { describe, expect, it, vi } from 'vitest';

import { PostgresProviderStore } from '../src/modules/providers/postgres-provider-store.js';
import type { ProviderRegistrationInput } from '../src/modules/providers/provider.types.js';
import {
  ProviderAlreadyExistsError,
  ProviderCategoriesInvalidError,
} from '../src/modules/providers/provider.types.js';

const uid = 'firebase-provider-test';
const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const providerId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const locationId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const categoryIds = [
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
];

function registration(): ProviderRegistrationInput {
  return {
    displayName: 'Provider Name',
    businessName: null,
    secondaryPhoneNumber: null,
    serviceRadiusKm: 12,
    experienceYears: 8,
    description: null,
    profilePhotoPath: null,
    serviceIds: categoryIds,
    languages: ['kn', 'en'],
    location: {
      locality: 'ಕುಸುಗಲ್',
      taluk: 'ಹುಬ್ಬಳ್ಳಿ',
      district: 'ಧಾರವಾಡ',
      languageCode: 'kn',
    },
    workingHours: Array.from({ length: 7 }, (_, weekday) => ({
      weekday,
      isClosed: weekday === 0,
      opensAt: weekday === 0 ? null : '09:00',
      closesAt: weekday === 0 ? null : '17:00',
    })),
  };
}

interface FakePoolOptions {
  missingSecondCategory?: boolean;
  existingProfile?: boolean;
}

function createFakePool(options: FakePoolOptions = {}) {
  const statements: Array<{ sql: string; values: unknown[] }> = [];
  const profileRow = {
    id: providerId,
    displayName: 'Provider Name',
    businessName: null,
    secondaryPhoneNumber: null,
    serviceRadiusKm: '12.00',
    experienceYears: 8,
    description: null,
    profilePhotoPath: null,
    profileStatus: 'PENDING_REVIEW',
    reviewNote: null,
    availability: 'OFFLINE',
    locality: 'ಕುಸುಗಲ್',
    taluk: 'ಹುಬ್ಬಳ್ಳಿ',
    district: 'ಧಾರವಾಡ',
    state: 'Karnataka',
    languageCode: 'kn',
  };

  const query = vi.fn(async (sql: string, values: unknown[] = []) => {
    const normalized = sql.replace(/\s+/g, ' ').trim();
    statements.push({ sql: normalized, values });

    if (normalized === 'BEGIN' || normalized === 'COMMIT' || normalized === 'ROLLBACK') {
      return { rows: [] };
    }
    if (normalized.includes('FROM users') && normalized.includes('FOR UPDATE')) {
      return {
        rows: [{ id: userId, phoneNumber: '+919876543210', accountStatus: 'ACTIVE' }],
      };
    }
    if (normalized.includes('FROM user_roles')) return { rows: [{ role: 'PROVIDER' }] };
    if (normalized.includes('FROM service_categories')) {
      const ids = values[0] as string[];
      return {
        rows: options.missingSecondCategory
          ? [{ id: ids[0] }]
          : ids.map((id) => ({ id })),
      };
    }
    if (normalized.startsWith('INSERT INTO locations')) return { rows: [{ id: locationId }] };
    if (normalized.startsWith('INSERT INTO provider_profiles')) {
      return { rows: options.existingProfile ? [] : [{ id: providerId }] };
    }
    if (normalized.includes('FROM provider_profiles') && normalized.includes('JOIN users')) {
      return { rows: [profileRow] };
    }
    if (normalized.includes('FROM provider_services')) {
      return {
        rows: [
          {
            id: categoryIds[0],
            slug: 'electrician',
            name: 'Electrician',
            isPrimary: true,
          },
        ],
      };
    }
    if (normalized.includes('FROM provider_languages')) {
      return { rows: [{ languageCode: 'en' }, { languageCode: 'kn' }] };
    }
    if (normalized.includes('FROM working_hours')) {
      return {
        rows: Array.from({ length: 7 }, (_, weekday) => ({
          weekday,
          opensAt: weekday === 0 ? null : '09:00',
          closesAt: weekday === 0 ? null : '17:00',
          isClosed: weekday === 0,
        })),
      };
    }
    return { rows: [] };
  });
  const client = {
    query,
    release: vi.fn(),
  } as unknown as PoolClient;
  const pool = { connect: vi.fn(async () => client) } as unknown as Pool;
  return { store: new PostgresProviderStore(() => pool), statements, query, client };
}

describe('PostgresProviderStore transaction behavior', () => {
  it('saves the profile, relations, location labels and review request atomically', async () => {
    const fake = createFakePool();
    const profile = await fake.store.createProfile(uid, registration());

    expect(profile.profileStatus).toBe('PENDING_REVIEW');
    expect(profile.location).toMatchObject({
      locality: 'ಕುಸುಗಲ್',
      taluk: 'ಹುಬ್ಬಳ್ಳಿ',
      district: 'ಧಾರವಾಡ',
      languageCode: 'kn',
    });
    expect(fake.statements[0]?.sql).toBe('BEGIN');
    expect(fake.statements.at(-1)?.sql).toBe('COMMIT');
    expect(fake.client.release).toHaveBeenCalledOnce();

    const locationInsert = fake.statements.find(({ sql }) => sql.startsWith('INSERT INTO locations'));
    expect(locationInsert?.values).toEqual([
      expect.stringMatching(/^manual-[a-f0-9]{40}$/),
      null,
      'ಕುಸುಗಲ್',
      null,
      'ಹುಬ್ಬಳ್ಳಿ',
      null,
      'ಧಾರವಾಡ',
    ]);
    const providerInsert = fake.statements.find(({ sql }) =>
      sql.startsWith('INSERT INTO provider_profiles'),
    );
    expect(providerInsert?.sql).toContain("'PENDING_REVIEW'");
    expect(fake.statements.filter(({ sql }) => sql.startsWith('INSERT INTO working_hours')))
      .toHaveLength(7);
    expect(fake.statements.some(({ sql }) => sql.includes('INSERT INTO verification_records')))
      .toBe(true);
    expect(fake.statements.some(({ sql }) => sql.includes('INSERT INTO provider_services')))
      .toBe(true);
  });

  it('rolls back a registration if any selected category is inactive', async () => {
    const fake = createFakePool({ missingSecondCategory: true });

    await expect(fake.store.createProfile(uid, registration())).rejects.toBeInstanceOf(
      ProviderCategoriesInvalidError,
    );
    expect(fake.statements.at(-1)?.sql).toBe('ROLLBACK');
    expect(fake.statements.some(({ sql }) => sql.startsWith('INSERT INTO locations'))).toBe(false);
    expect(fake.client.release).toHaveBeenCalledOnce();
  });

  it('rolls back the location if this user already has a provider profile', async () => {
    const fake = createFakePool({ existingProfile: true });

    await expect(fake.store.createProfile(uid, registration())).rejects.toBeInstanceOf(
      ProviderAlreadyExistsError,
    );
    expect(fake.statements.at(-1)?.sql).toBe('ROLLBACK');
    expect(fake.statements.some(({ sql }) => sql.startsWith('INSERT INTO locations'))).toBe(true);
    expect(fake.client.release).toHaveBeenCalledOnce();
  });
});
