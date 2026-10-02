import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { createApp } from '../src/app.js';
import { AccountNotActiveError, type AppSession, type AuthUserStore, type FirebaseIdentity } from '../src/modules/auth/types.js';
import {
  ReviewAlreadyExistsError,
  type CustomerProviderReview,
  type ProviderReviewPage,
  type ReviewStore,
} from '../src/modules/reviews/reviews.types.js';
import { encodePageCursor } from '../src/utils/page-cursor.js';

const firebaseUid = 'firebase-customer-review-test';
const customerUserId = 'a3c7b9dd-9d43-48e4-93ba-7d40d2162b11';
const providerId = '33333333-3333-4333-8333-333333333333';
const reviewId = '44444444-4444-4444-8444-444444444444';
const reviewerId = '55555555-5555-4555-8555-555555555555';
const identity: FirebaseIdentity = {
  uid: firebaseUid,
  phoneNumber: '+919876543210',
  signInProvider: 'phone',
};
const session: AppSession = {
  user: {
    id: customerUserId,
    phoneNumber: '+919876543210',
    fullName: 'Lakshmi Rao',
    preferredLanguage: 'kn',
  },
  roles: ['CUSTOMER'],
  onboardingComplete: true,
};
const savedReview: CustomerProviderReview = {
  id: reviewId,
  rating: 5,
  reviewText: 'Good service',
  moderationStatus: 'VISIBLE',
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
};
const reviewPage: ProviderReviewPage = {
  items: [{
    id: reviewId,
    rating: 5,
    reviewText: 'Good service',
    reviewerDisplayName: 'Lakshmi',
    createdAt: '2026-10-01T10:00:00.000Z',
    isMine: true,
  }],
  hasMore: true,
  nextCursor: encodePageCursor('review', {
    id: reviewId,
    createdAt: '2026-10-01T10:00:00.000000Z',
  }),
  myReview: savedReview,
};

interface TestOptions {
  roles?: AppSession['roles'];
  inactiveAccount?: boolean;
  page?: ProviderReviewPage | null;
}

function createTestContext(options: TestOptions = {}) {
  const authUserStore: AuthUserStore = {
    syncPhoneAccount: vi.fn(async () => session),
    findSession: vi.fn(async () => {
      if (options.inactiveAccount) throw new AccountNotActiveError();
      return { ...session, roles: options.roles ?? ['CUSTOMER'] };
    }),
    addRole: vi.fn(async () => session),
  };
  const reviewStore: ReviewStore = {
    listProviderReviews: vi.fn(async () => options.page === undefined ? reviewPage : options.page),
    createReview: vi.fn(async () => savedReview),
    updateReview: vi.fn(async () => savedReview),
  };
  const app = createApp({
    authUserStore,
    reviewStore,
    verifyFirebaseIdToken: async (token) => {
      if (token !== 'valid-review-token') throw new Error('invalid test token');
      return identity;
    },
  });
  return { app, authUserStore, reviewStore };
}

const authHeader = { Authorization: 'Bearer valid-review-token' };

describe('customer provider review API', () => {
  it('requires an authenticated active customer before listing or writing reviews', async () => {
    const context = createTestContext();
    const unauthenticated = await request(context.app)
      .get(`/api/v1/providers/${providerId}/reviews`);
    expect(unauthenticated.status).toBe(401);
    expect(context.reviewStore.listProviderReviews).not.toHaveBeenCalled();

    const providerOnly = createTestContext({ roles: ['PROVIDER'] });
    const forbidden = await request(providerOnly.app)
      .post(`/api/v1/providers/${providerId}/reviews`)
      .set(authHeader)
      .send({ rating: 5 });
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.error.code).toBe('CUSTOMER_ROLE_REQUIRED');
    expect(providerOnly.reviewStore.createReview).not.toHaveBeenCalled();

    const inactive = createTestContext({ inactiveAccount: true });
    const disabled = await request(inactive.app)
      .get(`/api/v1/providers/${providerId}/reviews`)
      .set(authHeader);
    expect(disabled.status).toBe(403);
    expect(disabled.body.error.code).toBe('ACCOUNT_DISABLED');
    expect(inactive.reviewStore.listProviderReviews).not.toHaveBeenCalled();
  });

  it('lists visible reviews using a validated cursor and returns only safe reviewer fields', async () => {
    const context = createTestContext();
    const cursor = encodePageCursor('review', {
      id: reviewId,
      createdAt: '2026-10-01T10:00:00.000000Z',
    });
    const response = await request(context.app)
      .get(`/api/v1/providers/${providerId}/reviews?limit=10&cursor=${encodeURIComponent(cursor)}`)
      .set(authHeader);

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0]).toMatchObject({
      id: reviewId,
      rating: 5,
      reviewerDisplayName: 'Lakshmi',
      isMine: true,
    });
    expect(response.body.items[0]).not.toHaveProperty('phoneNumber');
    expect(response.body.myReview.id).toBe(reviewId);
    expect(response.body).toMatchObject({ hasMore: true, limit: 10 });
    expect(response.body.nextCursor).toBe(reviewPage.nextCursor);
    expect(context.reviewStore.listProviderReviews).toHaveBeenCalledWith(
      providerId,
      customerUserId,
      10,
      { id: reviewId, createdAt: '2026-10-01T10:00:00.000000Z' },
    );

    const invalidCursor = await request(context.app)
      .get(`/api/v1/providers/${providerId}/reviews?cursor=bad`)
      .set(authHeader);
    expect(invalidCursor.status).toBe(400);
    expect(invalidCursor.body.error.code).toBe('INVALID_REVIEW_REQUEST');
    expect(context.reviewStore.listProviderReviews).toHaveBeenCalledTimes(1);

    const inactiveProvider = createTestContext({ page: null });
    const missing = await request(inactiveProvider.app)
      .get(`/api/v1/providers/${providerId}/reviews`)
      .set(authHeader);
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('PROVIDER_NOT_FOUND');
  });

  it('validates one 1–5 rating and optional review text up to 1,500 characters', async () => {
    const context = createTestContext();
    const invalidRating = await request(context.app)
      .post(`/api/v1/providers/${providerId}/reviews`)
      .set(authHeader)
      .send({ rating: 0 });
    expect(invalidRating.status).toBe(400);
    expect(context.reviewStore.createReview).not.toHaveBeenCalled();

    const tooLong = await request(context.app)
      .post(`/api/v1/providers/${providerId}/reviews`)
      .set(authHeader)
      .send({ rating: 4, reviewText: 'x'.repeat(1501) });
    expect(tooLong.status).toBe(400);
    expect(context.reviewStore.createReview).not.toHaveBeenCalled();

    const clientIdentity = await request(context.app)
      .post(`/api/v1/providers/${providerId}/reviews`)
      .set(authHeader)
      .send({ rating: 4, customerUserId, reviewText: 'A review' });
    expect(clientIdentity.status).toBe(400);
    expect(context.reviewStore.createReview).not.toHaveBeenCalled();

    const created = await request(context.app)
      .post(`/api/v1/providers/${providerId}/reviews`)
      .set(authHeader)
      .send({ rating: 4, reviewText: '  Very helpful  ' });
    expect(created.status).toBe(201);
    expect(created.body.review.id).toBe(reviewId);
    expect(context.reviewStore.createReview).toHaveBeenCalledWith(
      customerUserId,
      providerId,
      { rating: 4, reviewText: 'Very helpful' },
    );

    const blankText = await request(context.app)
      .post(`/api/v1/providers/${providerId}/reviews`)
      .set(authHeader)
      .send({ rating: 3, reviewText: '   ' });
    expect(blankText.status).toBe(201);
    expect(context.reviewStore.createReview).toHaveBeenLastCalledWith(
      customerUserId,
      providerId,
      { rating: 3, reviewText: null },
    );
  });

  it('maps duplicate reviews to a conflict and permits only owner-scoped edits', async () => {
    const context = createTestContext();
    vi.mocked(context.reviewStore.createReview).mockRejectedValueOnce(new ReviewAlreadyExistsError());
    const duplicate = await request(context.app)
      .post(`/api/v1/providers/${providerId}/reviews`)
      .set(authHeader)
      .send({ rating: 5 });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('REVIEW_ALREADY_EXISTS');

    const edited = await request(context.app)
      .patch(`/api/v1/reviews/${reviewId}`)
      .set(authHeader)
      .send({ rating: 2, reviewText: 'Updated' });
    expect(edited.status).toBe(200);
    expect(context.reviewStore.updateReview).toHaveBeenCalledWith(
      customerUserId,
      reviewId,
      { rating: 2, reviewText: 'Updated' },
    );

    vi.mocked(context.reviewStore.updateReview).mockResolvedValueOnce(null);
    const notOwned = await request(context.app)
      .patch(`/api/v1/reviews/${reviewId}`)
      .set(authHeader)
      .send({ rating: 5 });
    expect(notOwned.status).toBe(404);
    expect(notOwned.body.error.code).toBe('REVIEW_NOT_FOUND');

    const invalidId = await request(context.app)
      .patch('/api/v1/reviews/not-a-uuid')
      .set(authHeader)
      .send({ rating: 4 });
    expect(invalidId.status).toBe(400);
    expect(context.reviewStore.updateReview).toHaveBeenCalledTimes(2);
  });

  it('rate-limits repeated review writes from one IP', async () => {
    const context = createTestContext();
    const responses = [];
    for (let attempt = 0; attempt < 21; attempt++) {
      responses.push(await request(context.app)
        .post(`/api/v1/providers/${providerId}/reviews`)
        .set(authHeader)
        .send({ rating: 5 }));
    }

    expect(responses.slice(0, 20).every((response) => response.status === 201)).toBe(true);
    expect(responses[20]?.status).toBe(429);
    expect(responses[20]?.body.error.code).toBe('RATE_LIMITED');
    expect(context.reviewStore.createReview).toHaveBeenCalledTimes(20);
  });
});
