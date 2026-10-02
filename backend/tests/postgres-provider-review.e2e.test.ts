import { randomInt, randomUUID } from 'node:crypto';

import type { Pool } from 'pg';
import { Pool as PgPool } from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import { closeDatabasePool } from '../src/db/pool.js';
import type { FirebaseIdentity } from '../src/modules/auth/types.js';
import { manualLocationSlug } from '../src/modules/providers/provider.utils.js';

const runDatabaseSmoke = process.env.RUN_DB_SMOKE === 'true' && Boolean(process.env.DATABASE_URL);
describe.skipIf(!runDatabaseSmoke)('PostgreSQL provider review end-to-end smoke test', () => {
  const pool: Pool = new PgPool({ connectionString: process.env.DATABASE_URL });
  const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
  const phoneSuffix = String(randomInt(0, 1_000_000_000)).padStart(9, '0');
  const providerUid = `smoke-provider-${suffix}`;
  const adminUid = `smoke-admin-${suffix}`;
  const customerUid = `smoke-customer-${suffix}`;
  const providerPhone = `+919${phoneSuffix}`;
  const adminPhone = `+918${phoneSuffix}`;
  const customerPhone = `+917${phoneSuffix}`;
  const locality = `Smoke ${suffix}`;
  const district = 'Dharwad';
  const locationSlug = manualLocationSlug({
    locality,
    district,
    taluk: null,
    languageCode: 'en',
  });
  let serviceId: string;
  let app: ReturnType<typeof createApp>;
  let providerProfileId: string | null = null;
  let providerSeeded = false;
  let adminSeeded = false;
  let customerSeeded = false;

  beforeAll(async () => {
    const category = await pool.query<{ id: string }>(
      `SELECT id::TEXT AS id FROM service_categories WHERE slug = 'electrician' AND is_active = TRUE`,
    );
    if (!category.rows[0]) throw new Error('Seed migration did not create the electrician category.');
    serviceId = category.rows[0].id;

    await pool.query(
      `INSERT INTO users (firebase_uid, phone_e164, phone_verified_at)
       VALUES ($1, $2, NOW())`,
      [providerUid, providerPhone],
    );
    providerSeeded = true;
    await pool.query(
      `INSERT INTO user_roles (user_id, role)
       SELECT id, 'PROVIDER' FROM users WHERE firebase_uid = $1`,
      [providerUid],
    );
    await pool.query(
      `INSERT INTO users (firebase_uid, phone_e164, phone_verified_at)
       VALUES ($1, $2, NOW())`,
      [customerUid, customerPhone],
    );
    customerSeeded = true;
    await pool.query(
      `INSERT INTO user_roles (user_id, role)
       SELECT id, 'CUSTOMER' FROM users WHERE firebase_uid = $1`,
      [customerUid],
    );
    await pool.query(
      `INSERT INTO users (firebase_uid, phone_e164, phone_verified_at)
       VALUES ($1, $2, NOW())`,
      [adminUid, adminPhone],
    );
    adminSeeded = true;
    await pool.query(
      `INSERT INTO admin_users (user_id, admin_role, enabled, mfa_enrolled_at)
       SELECT id, 'MODERATOR', TRUE, NOW() FROM users WHERE firebase_uid = $1`,
      [adminUid],
    );

    const identities: Record<string, FirebaseIdentity> = {
      'smoke-provider-token': {
        uid: providerUid,
        phoneNumber: providerPhone,
        signInProvider: 'phone',
      },
      'smoke-admin-token': {
        uid: adminUid,
        phoneNumber: adminPhone,
        signInProvider: 'password',
        signInSecondFactor: 'phone',
        authTime: Math.floor(Date.now() / 1000),
      },
      'smoke-customer-token': {
        uid: customerUid,
        phoneNumber: customerPhone,
        signInProvider: 'phone',
      },
    };
    app = createApp({
      verifyFirebaseIdToken: async (token) => {
        const identity = identities[token];
        if (!identity) throw new Error('Unknown smoke-test token.');
        return identity;
      },
    });
  }, 20_000);

  afterAll(async () => {
    try {
      if (providerProfileId) {
        await pool.query('DELETE FROM admin_audit_logs WHERE target_id = $1::UUID', [providerProfileId]);
        await pool.query('DELETE FROM verification_records WHERE provider_id = $1::UUID', [providerProfileId]);
        await pool.query('DELETE FROM provider_profiles WHERE id = $1::UUID', [providerProfileId]);
      }
      if (adminSeeded) {
        await pool.query(
          `DELETE FROM admin_audit_logs
           WHERE admin_user_id = (SELECT id FROM users WHERE firebase_uid = $1)`,
          [adminUid],
        );
        await pool.query(
          'DELETE FROM admin_users WHERE user_id = (SELECT id FROM users WHERE firebase_uid = $1)',
          [adminUid],
        );
        await pool.query('DELETE FROM users WHERE firebase_uid = $1', [adminUid]);
      }
      if (providerSeeded) await pool.query('DELETE FROM users WHERE firebase_uid = $1', [providerUid]);
      if (customerSeeded) await pool.query('DELETE FROM users WHERE firebase_uid = $1', [customerUid]);
      await pool.query('DELETE FROM locations WHERE slug = $1', [locationSlug]);
    } finally {
      await pool.end();
      await closeDatabasePool();
    }
  }, 20_000);

  it('registers a provider, records a rejection note, accepts resubmission, and approves it', async () => {
    const workingHours = Array.from({ length: 7 }, (_, weekday) => ({
      weekday,
      isClosed: weekday === 0,
      opensAt: weekday === 0 ? null : '09:00',
      closesAt: weekday === 0 ? null : '17:00',
    }));
    const profileInput = {
      displayName: 'Smoke Test Provider',
      businessName: null,
      secondaryPhoneNumber: null,
      serviceRadiusKm: 12,
      experienceYears: 4,
      description: 'Initial smoke-test description',
      profilePhotoPath: null,
      serviceIds: [serviceId],
      languages: ['kn', 'en'],
      location: { locality, taluk: 'Hubballi', district, languageCode: 'en' },
      workingHours,
    };

    const providerHeaders = { Authorization: 'Bearer smoke-provider-token' };
    const adminHeaders = { Authorization: 'Bearer smoke-admin-token' };
    const customerHeaders = { Authorization: 'Bearer smoke-customer-token' };
    const created = await request(app)
      .post('/api/v1/provider-profiles')
      .set(providerHeaders)
      .send(profileInput);
    expect(created.status).toBe(201);
    expect(created.body.profileStatus).toBe('PENDING_REVIEW');
    providerProfileId = created.body.id;

    const pendingAvailability = await request(app)
      .patch('/api/v1/provider-profiles/me/availability')
      .set({ Authorization: 'Bearer smoke-provider-token' })
      .send({ availability: 'AVAILABLE' });
    expect(pendingAvailability.status).toBe(409);
    expect(pendingAvailability.body.error.code).toBe('AVAILABILITY_NOT_EDITABLE');

    const hiddenWhilePending = await request(app)
      .get('/api/v1/providers')
      .set(customerHeaders);
    expect(hiddenWhilePending.status).toBe(200);
    expect(hiddenWhilePending.body.items).toEqual([]);

    const queue = await request(app)
      .get('/api/v1/admin/provider-reviews?limit=10&offset=0')
      .set(adminHeaders);
    expect(queue.status).toBe(200);
    expect(queue.body.items.map((item: { id: string }) => item.id)).toContain(providerProfileId);

    const rejected = await request(app)
      .post(`/api/v1/admin/provider-reviews/${providerProfileId}/decision`)
      .set(adminHeaders)
      .send({ decision: 'REJECT', decisionNote: 'Please include a clearer service locality.' });
    expect(rejected.status).toBe(200);
    expect(rejected.body.profileStatus).toBe('REJECTED');

    const ownerProfile = await request(app)
      .get('/api/v1/provider-profiles/me')
      .set(providerHeaders);
    expect(ownerProfile.status).toBe(200);
    expect(ownerProfile.body.reviewNote).toBe('Please include a clearer service locality.');

    const resubmitted = await request(app)
      .patch('/api/v1/provider-profiles/me')
      .set(providerHeaders)
      .send({ ...profileInput, description: 'Updated after reviewer feedback' });
    expect(resubmitted.status).toBe(200);
    expect(resubmitted.body.profileStatus).toBe('PENDING_REVIEW');
    expect(resubmitted.body.reviewNote).toBeNull();

    const approved = await request(app)
      .post(`/api/v1/admin/provider-reviews/${providerProfileId}/decision`)
      .set(adminHeaders)
      .send({ decision: 'APPROVE' });
    expect(approved.status).toBe(200);
    expect(approved.body.profileStatus).toBe('ACTIVE');

    const finalOwnerProfile = await request(app)
      .get('/api/v1/provider-profiles/me')
      .set(providerHeaders);
    expect(finalOwnerProfile.status).toBe(200);
    expect(finalOwnerProfile.body.profileStatus).toBe('ACTIVE');
    expect(finalOwnerProfile.body.reviewNote).toBeNull();

    const emptyFavorites = await request(app)
      .get('/api/v1/me/favorites?language=en')
      .set(customerHeaders);
    expect(emptyFavorites.status).toBe(200);
    expect(emptyFavorites.body.items).toEqual([]);

    const savedFavorite = await request(app)
      .put(`/api/v1/me/favorites/${providerProfileId}`)
      .set(customerHeaders);
    expect(savedFavorite.status).toBe(200);
    expect(savedFavorite.body.favorite).toBe(true);
    const savedAgain = await request(app)
      .put(`/api/v1/me/favorites/${providerProfileId}`)
      .set(customerHeaders);
    expect(savedAgain.status).toBe(200);
    expect(savedAgain.body.favorite).toBe(true);

    const favorites = await request(app)
      .get('/api/v1/me/favorites?language=kn&limit=10')
      .set(customerHeaders);
    expect(favorites.status).toBe(200);
    expect(favorites.body.items.map((item: { id: string }) => item.id)).toContain(
      providerProfileId,
    );
    expect(favorites.body.items[0]).not.toHaveProperty('phoneNumber');

    const removedFavorite = await request(app)
      .delete(`/api/v1/me/favorites/${providerProfileId}`)
      .set(customerHeaders);
    expect(removedFavorite.status).toBe(200);
    expect(removedFavorite.body.favorite).toBe(false);
    const removedAgain = await request(app)
      .delete(`/api/v1/me/favorites/${providerProfileId}`)
      .set(customerHeaders);
    expect(removedAgain.status).toBe(200);

    const availableFilterBeforeChange = await request(app)
      .get(`/api/v1/providers?categoryId=${serviceId}&availableNow=true`)
      .set(customerHeaders);
    expect(availableFilterBeforeChange.status).toBe(200);
    expect(availableFilterBeforeChange.body.items).toEqual([]);

    const available = await request(app)
      .patch('/api/v1/provider-profiles/me/availability')
      .set(providerHeaders)
      .send({ availability: 'AVAILABLE' });
    expect(available.status).toBe(200);
    expect(available.body.availability).toBe('AVAILABLE');

    const availableSearch = await request(app)
      .get(`/api/v1/providers?categoryId=${serviceId}&availableNow=true&location=${encodeURIComponent(locality)}`)
      .set(customerHeaders);
    expect(availableSearch.status).toBe(200);
    expect(availableSearch.body.items.map((item: { id: string }) => item.id)).toContain(
      providerProfileId,
    );

    const busy = await request(app)
      .patch('/api/v1/provider-profiles/me/availability')
      .set(providerHeaders)
      .send({ availability: 'BUSY' });
    expect(busy.status).toBe(200);
    expect(busy.body.availability).toBe('BUSY');

    const busyFilteredSearch = await request(app)
      .get(`/api/v1/providers?categoryId=${serviceId}&availableNow=true`)
      .set(customerHeaders);
    expect(busyFilteredSearch.status).toBe(200);
    expect(busyFilteredSearch.body.items).toEqual([]);

    const availableAgain = await request(app)
      .patch('/api/v1/provider-profiles/me/availability')
      .set(providerHeaders)
      .send({ availability: 'AVAILABLE' });
    expect(availableAgain.status).toBe(200);
    expect(availableAgain.body.availability).toBe('AVAILABLE');

    await pool.query(
      "UPDATE provider_profiles SET profile_status = 'SUSPENDED' WHERE id = $1::UUID",
      [providerProfileId],
    );
    const suspendedFavorite = await request(app)
      .put(`/api/v1/me/favorites/${providerProfileId}`)
      .set(customerHeaders);
    expect(suspendedFavorite.status).toBe(404);
    const suspendedAvailability = await request(app)
      .patch('/api/v1/provider-profiles/me/availability')
      .set(providerHeaders)
      .send({ availability: 'OFFLINE' });
    expect(suspendedAvailability.status).toBe(409);
    expect(suspendedAvailability.body.error.code).toBe('AVAILABILITY_NOT_EDITABLE');
    await pool.query(
      "UPDATE provider_profiles SET profile_status = 'ACTIVE' WHERE id = $1::UUID",
      [providerProfileId],
    );

    const offline = await request(app)
      .patch('/api/v1/provider-profiles/me/availability')
      .set(providerHeaders)
      .send({ availability: 'OFFLINE' });
    expect(offline.status).toBe(200);
    expect(offline.body.availability).toBe('OFFLINE');

    const search = await request(app)
      .get(
        `/api/v1/providers?categoryId=${serviceId}&location=${encodeURIComponent(locality)}&language=en`,
      )
      .set(customerHeaders);
    expect(search.status).toBe(200);
    expect(search.body.items).toHaveLength(1);
    expect(search.body.items[0].id).toBe(providerProfileId);
    expect(search.body.items[0].availability).toBe('OFFLINE');
    expect(search.body.items[0]).not.toHaveProperty('phoneNumber');

    const publicProfile = await request(app)
      .get(`/api/v1/providers/${providerProfileId}?language=en`)
      .set(customerHeaders);
    expect(publicProfile.status).toBe(200);
    expect(publicProfile.body.provider.description).toBe('Updated after reviewer feedback');
    expect(publicProfile.body.provider.workingHours).toHaveLength(7);
    expect(publicProfile.body.provider).not.toHaveProperty('phoneNumber');

    const callIntent = await request(app)
      .post(`/api/v1/providers/${providerProfileId}/call-intent`)
      .set(customerHeaders);
    expect(callIntent.status).toBe(200);
    expect(callIntent.body.phoneNumber).toBe(providerPhone);
    const metric = await pool.query<{ call_taps: number }>(
      'SELECT call_taps FROM provider_metrics_daily WHERE provider_id = $1::UUID',
      [providerProfileId],
    );
    expect(metric.rows[0]?.call_taps).toBe(1);
  });
});
