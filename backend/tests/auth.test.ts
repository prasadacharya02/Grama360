import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { createApp } from '../src/app.js';
import type { AuthUserStore, AppSession, FirebaseIdentity } from '../src/modules/auth/types.js';

const phoneIdentity: FirebaseIdentity = {
  uid: 'firebase-uid-123',
  phoneNumber: '+919876543210',
  signInProvider: 'phone',
};

const baseSession: AppSession = {
  user: {
    id: 'a3c7b9dd-9d43-48e4-93ba-7d40d2162b11',
    phoneNumber: '+919876543210',
    fullName: null,
    preferredLanguage: 'en',
  },
  roles: [],
  onboardingComplete: false,
};

function createTestContext(identity: FirebaseIdentity = phoneIdentity) {
  const store: AuthUserStore = {
    syncPhoneAccount: vi.fn(async (_identity, language) => ({
      ...baseSession,
      user: {
        ...baseSession.user,
        preferredLanguage: language ?? 'en',
      },
    })),
    findSession: vi.fn(async () => baseSession),
    addRole: vi.fn(async (_uid, role) => ({
      ...baseSession,
      roles: [role],
      onboardingComplete: true,
    })),
  };

  const app = createApp({
    authUserStore: store,
    verifyFirebaseIdToken: async (token) => {
      if (token !== 'valid-test-token') throw new Error('invalid test token');
      return identity;
    },
  });

  return { app, store };
}

describe('phone authentication and role API', () => {
  it('returns a safe 400 response for malformed JSON', async () => {
    const { app } = createTestContext();
    const response = await request(app)
      .post('/api/v1/auth/session')
      .set('Content-Type', 'application/json')
      .send('{invalid');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_JSON');
  });

  it('rejects requests without a bearer token', async () => {
    const { app, store } = createTestContext();
    const response = await request(app).get('/api/v1/me');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
    expect(store.findSession).not.toHaveBeenCalled();
  });

  it('rejects an invalid Firebase ID token without leaking verifier details', async () => {
    const { app, store } = createTestContext();
    const response = await request(app)
      .get('/api/v1/me')
      .set('Authorization', 'Bearer invalid-test-token');

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Your session is invalid or expired.');
    expect(JSON.stringify(response.body)).not.toContain('invalid test token');
    expect(store.findSession).not.toHaveBeenCalled();
  });

  it('syncs a phone-authenticated identity and only accepts a supported language', async () => {
    const { app, store } = createTestContext();
    const response = await request(app)
      .post('/api/v1/auth/session')
      .set('Authorization', 'Bearer valid-test-token')
      .send({ preferredLanguage: 'kn' });

    expect(response.status).toBe(200);
    expect(response.body.user.phoneNumber).toBe('+919876543210');
    expect(response.body.user.preferredLanguage).toBe('kn');
    expect(response.body.roles).toEqual([]);
    expect(store.syncPhoneAccount).toHaveBeenCalledWith(phoneIdentity, 'kn');
  });

  it('does not create an app session for a non-phone Firebase sign-in', async () => {
    const passwordIdentity: FirebaseIdentity = {
      ...phoneIdentity,
      signInProvider: 'password',
    };
    const { app, store } = createTestContext(passwordIdentity);
    const response = await request(app)
      .post('/api/v1/auth/session')
      .set('Authorization', 'Bearer valid-test-token')
      .send({});

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('PHONE_VERIFICATION_REQUIRED');
    expect(store.syncPhoneAccount).not.toHaveBeenCalled();
  });

  it('allows customer/provider role assignment but never self-assigned admin', async () => {
    const { app, store } = createTestContext();
    const forbidden = await request(app)
      .put('/api/v1/me/roles')
      .set('Authorization', 'Bearer valid-test-token')
      .send({ role: 'ADMIN' });

    expect(forbidden.status).toBe(400);
    expect(forbidden.body.error.code).toBe('INVALID_ROLE');
    expect(store.addRole).not.toHaveBeenCalled();

    const allowed = await request(app)
      .put('/api/v1/me/roles')
      .set('Authorization', 'Bearer valid-test-token')
      .send({ role: 'PROVIDER' });

    expect(allowed.status).toBe(200);
    expect(allowed.body.roles).toEqual(['PROVIDER']);
    expect(store.addRole).toHaveBeenCalledWith('firebase-uid-123', 'PROVIDER');
  });
});
