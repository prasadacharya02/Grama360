import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { createApp } from '../src/app.js';
import type { FirebaseIdentity } from '../src/modules/auth/types.js';
import type {
  AdminAccess,
  AdminReviewStore,
  PendingProviderReview,
  ProviderReviewDecision,
  ProviderReviewResult,
} from '../src/modules/admin/admin-review.types.js';

const firebaseUid = 'firebase-admin-test';
const now = Date.now();
const providerId = '33333333-3333-4333-8333-333333333333';

const mfaIdentity: FirebaseIdentity = {
  uid: firebaseUid,
  phoneNumber: '+919876543210',
  signInProvider: 'phone',
  signInSecondFactor: 'phone',
  authTime: now / 1000 - 60,
};

const pendingResult: ProviderReviewResult = {
  providerId,
  profileStatus: 'ACTIVE',
  decision: 'APPROVE',
  decisionNote: null,
  reviewedAt: new Date(now).toISOString(),
};

interface TestOptions {
  identity?: FirebaseIdentity;
  admin?: AdminAccess | null;
}

const pendingReview: PendingProviderReview = {
  id: providerId,
  displayName: 'Gopal Rao',
  businessName: null,
  primaryPhoneNumber: '+919876543210',
  secondaryPhoneNumber: null,
  profilePhotoPath: null,
  serviceRadiusKm: 10,
  experienceYears: 5,
  description: null,
  locality: 'Kusugal',
  taluk: 'Hubballi',
  district: 'Dharwad',
  state: 'Karnataka',
  locationLanguage: 'en',
  services: [],
  languages: ['kn'],
  workingHours: [],
  submittedAt: new Date(now).toISOString(),
};

function createTestContext(options: TestOptions = {}) {
  const store: AdminReviewStore = {
    getAdminAccess: vi.fn(async (): Promise<AdminAccess | null> =>
      options.admin === undefined
        ? { userId: 'admin-user-id', role: 'MODERATOR', mfaEnrolled: true }
        : options.admin,
    ),
    listPendingProviderReviews: vi.fn(async (limit: number, offset: number) => ({
      items: [pendingReview].slice(0, limit),
      total: 1 + offset,
    })),
    decideProviderReview: vi.fn(async (
      _uid: string,
      id: string,
      decision: ProviderReviewDecision,
      decisionNote: string | null,
    ): Promise<ProviderReviewResult> => ({
      ...pendingResult,
      providerId: id,
      decision,
      profileStatus: decision === 'APPROVE' ? 'ACTIVE' : 'REJECTED',
      decisionNote,
    })),
  };
  const app = createApp({
    adminReviewStore: store,
    verifyFirebaseIdToken: async (token) => {
      if (token !== 'valid-admin-token') throw new Error('invalid token');
      return options.identity ?? mfaIdentity;
    },
  });
  return { app, store };
}

function withAdminToken(
  test: ReturnType<typeof createTestContext>,
  method: 'get' | 'post',
  path: string,
) {
  const call = method === 'get' ? request(test.app).get(path) : request(test.app).post(path);
  return call.set('Authorization', 'Bearer valid-admin-token');
}

describe('admin provider review API', () => {
  it('identifies administrator accounts, then requires a fresh Firebase second-factor claim', async () => {
    const noMfa = createTestContext({
      identity: { ...mfaIdentity, signInSecondFactor: null },
    });
    const response = await withAdminToken(noMfa, 'get', '/api/v1/admin/me');

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ADMIN_MFA_REQUIRED');
    expect(noMfa.store.getAdminAccess).toHaveBeenCalledWith(firebaseUid);

    const staleMfa = createTestContext({
      identity: { ...mfaIdentity, authTime: now / 1000 - 16 * 60 },
    });
    const stale = await withAdminToken(staleMfa, 'get', '/api/v1/admin/me');
    expect(stale.status).toBe(403);
    expect(stale.body.error.code).toBe('ADMIN_MFA_REAUTH_REQUIRED');
    expect(staleMfa.store.getAdminAccess).toHaveBeenCalledWith(firebaseUid);
  });

  it('rejects identities without an enabled administrator database record', async () => {
    const test = createTestContext({ admin: null });
    const response = await withAdminToken(test, 'get', '/api/v1/admin/me');

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ADMIN_ACCESS_REQUIRED');
  });

  it('requires the Firebase MFA enrollment marker before staff access', async () => {
    const test = createTestContext({
      admin: { userId: 'admin-user-id', role: 'MODERATOR', mfaEnrolled: false },
    });
    const response = await withAdminToken(test, 'get', '/api/v1/admin/me');

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ADMIN_MFA_ENROLLMENT_REQUIRED');
  });

  it('lists provider submissions for an MFA-authenticated admin with bounded pagination', async () => {
    const test = createTestContext({ admin: { userId: 'admin-user-id', role: 'SUPPORT', mfaEnrolled: true } });
    const response = await withAdminToken(test, 'get', '/api/v1/admin/provider-reviews?limit=10&offset=5');

    expect(response.status).toBe(200);
    expect(response.body.items[0].id).toBe(providerId);
    expect(response.body).toMatchObject({ limit: 10, offset: 5, total: 6 });
    expect(test.store.listPendingProviderReviews).toHaveBeenCalledWith(10, 5);

    const invalid = await withAdminToken(test, 'get', '/api/v1/admin/provider-reviews?limit=500');
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe('INVALID_PAGINATION');
  });

  it('allows moderators to approve and rejects decisions from support admins', async () => {
    const moderator = createTestContext();
    const approved = await withAdminToken(moderator, 'post', `/api/v1/admin/provider-reviews/${providerId}/decision`)
      .send({ decision: 'APPROVE' });

    expect(approved.status).toBe(200);
    expect(approved.body.profileStatus).toBe('ACTIVE');
    expect(moderator.store.decideProviderReview).toHaveBeenCalledWith(
      firebaseUid,
      providerId,
      'APPROVE',
      null,
    );

    const support = createTestContext({ admin: { userId: 'support-id', role: 'SUPPORT', mfaEnrolled: true } });
    const forbidden = await withAdminToken(support, 'post', `/api/v1/admin/provider-reviews/${providerId}/decision`)
      .send({ decision: 'APPROVE' });
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.error.code).toBe('ADMIN_PERMISSION_REQUIRED');
    expect(support.store.decideProviderReview).not.toHaveBeenCalled();
  });

  it('requires a rejection note and safely records a valid rejection', async () => {
    const test = createTestContext();
    const missingNote = await withAdminToken(test, 'post', `/api/v1/admin/provider-reviews/${providerId}/decision`)
      .send({ decision: 'REJECT' });
    expect(missingNote.status).toBe(400);
    expect(test.store.decideProviderReview).not.toHaveBeenCalled();

    const rejected = await withAdminToken(test, 'post', `/api/v1/admin/provider-reviews/${providerId}/decision`)
      .send({ decision: 'REJECT', decisionNote: 'Please add a clearer locality.' });
    expect(rejected.status).toBe(200);
    expect(rejected.body.profileStatus).toBe('REJECTED');
    expect(rejected.body.decisionNote).toBe('Please add a clearer locality.');
    expect(test.store.decideProviderReview).toHaveBeenCalledWith(
      firebaseUid,
      providerId,
      'REJECT',
      'Please add a clearer locality.',
    );
  });
});
