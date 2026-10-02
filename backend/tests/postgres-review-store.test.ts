import type { Pool } from 'pg';
import { describe, expect, it, vi } from 'vitest';

import { PostgresReviewStore } from '../src/modules/reviews/postgres-review-store.js';
import { ReviewAlreadyExistsError } from '../src/modules/reviews/reviews.types.js';
import { decodePageCursor } from '../src/utils/page-cursor.js';

const providerId = '33333333-3333-4333-8333-333333333333';
const customerUserId = 'a3c7b9dd-9d43-48e4-93ba-7d40d2162b11';
const reviewId = '44444444-4444-4444-8444-444444444444';
const createdAt = '2026-10-01T10:00:00.123456Z';

const reviewRow = {
  id: reviewId,
  rating: 5,
  reviewText: 'Good work',
  moderationStatus: 'VISIBLE' as const,
  createdAt: '2026-10-01T10:00:00.123Z',
  updatedAt: '2026-10-01T10:00:00.123Z',
};

function createStore() {
  const query = vi.fn();
  const pool = { query } as unknown as Pool;
  return { store: new PostgresReviewStore(() => pool), query };
}

describe('PostgresReviewStore', () => {
  it('lists visible public-safe reviews with a stable cursor and the customer’s own review', async () => {
    const { store, query } = createStore();
    query.mockResolvedValueOnce({ rows: [{ eligible: true }] });
    query.mockResolvedValueOnce({
      rows: [
        {
          ...reviewRow,
          reviewerDisplayName: 'Lakshmi',
          cursorCreatedAt: createdAt,
          isMine: true,
        },
        {
          ...reviewRow,
          id: '55555555-5555-4555-8555-555555555555',
          reviewerDisplayName: 'Gopal',
          cursorCreatedAt: '2026-09-30T10:00:00.000000Z',
          isMine: false,
        },
      ],
    });
    query.mockResolvedValueOnce({ rows: [reviewRow] });

    const page = await store.listProviderReviews(providerId, customerUserId, 1, null);

    expect(page).not.toBeNull();
    expect(page?.items).toHaveLength(1);
    expect(page?.items[0]).toMatchObject({
      reviewerDisplayName: 'Lakshmi',
      rating: 5,
      isMine: true,
      reviewText: 'Good work',
    });
    expect(page?.items[0]).not.toHaveProperty('phoneNumber');
    expect(page?.myReview?.id).toBe(reviewId);
    expect(page?.hasMore).toBe(true);
    expect(decodePageCursor(page!.nextCursor!, 'review')).toEqual({
      createdAt,
      id: reviewId,
    });

    const publicQuery = String(query.mock.calls[1]?.[0]);
    expect(publicQuery).toContain("reviews.moderation_status = 'VISIBLE'");
    expect(publicQuery).toContain('reviewer.full_name');
    expect(publicQuery).not.toContain('phone_e164');
    expect(publicQuery).toContain('reviews.id < $4::UUID');
    expect(query.mock.calls[1]?.[1]).toEqual([providerId, customerUserId, null, null, 2]);
  });

  it('rechecks customer/provider/category eligibility before returning review pages', async () => {
    const { store, query } = createStore();
    query.mockResolvedValueOnce({ rows: [{ eligible: false }] });

    await expect(store.listProviderReviews(providerId, customerUserId, 20, null)).resolves.toBeNull();
    expect(query).toHaveBeenCalledTimes(1);
    const eligibilityQuery = String(query.mock.calls[0]?.[0]);
    expect(eligibilityQuery).toContain("customer_role.role = 'CUSTOMER'");
    expect(eligibilityQuery).toContain("provider_role.role = 'PROVIDER'");
    expect(eligibilityQuery).toContain("customer_user.account_status = 'ACTIVE'");
    expect(eligibilityQuery).toContain("provider_profiles.profile_status = 'ACTIVE'");
    expect(eligibilityQuery).toContain('service_categories.is_active = TRUE');
  });

  it('creates a visible review only for an eligible active customer and provider', async () => {
    const { store, query } = createStore();
    query.mockResolvedValueOnce({ rows: [reviewRow] });

    const created = await store.createReview(customerUserId, providerId, {
      rating: 5,
      reviewText: 'Good work',
    });

    expect(created).toMatchObject({
      id: reviewId,
      rating: 5,
      reviewText: 'Good work',
      moderationStatus: 'VISIBLE',
    });
    const sql = String(query.mock.calls[0]?.[0]);
    expect(sql).toContain("users.account_status = 'ACTIVE'");
    expect(sql).toContain("user_roles.role = 'CUSTOMER'");
    expect(sql).toContain("provider_role.role = 'PROVIDER'");
    expect(sql).toContain("provider_profiles.profile_status = 'ACTIVE'");
    expect(sql).toContain('service_categories.is_active = TRUE');
    expect(sql).toContain("'VISIBLE'");
    expect(query.mock.calls[0]?.[1]).toEqual([customerUserId, providerId, 5, 'Good work']);
  });

  it('maps the unique provider/customer constraint to a duplicate-review conflict', async () => {
    const { store, query } = createStore();
    query.mockRejectedValueOnce({ code: '23505' });

    await expect(store.createReview(customerUserId, providerId, {
      rating: 4,
      reviewText: null,
    })).rejects.toBeInstanceOf(ReviewAlreadyExistsError);
  });

  it('updates only a visible review owned by an active customer for an active provider', async () => {
    const { store, query } = createStore();
    query.mockResolvedValueOnce({ rows: [reviewRow] });

    const updated = await store.updateReview(customerUserId, reviewId, {
      rating: 3,
      reviewText: 'Updated note',
    });

    expect(updated?.id).toBe(reviewId);
    const sql = String(query.mock.calls[0]?.[0]);
    expect(sql).toContain('reviews.customer_user_id = $2::UUID');
    expect(sql).toContain("reviews.moderation_status = 'VISIBLE'");
    expect(sql).toContain("customer_user.account_status = 'ACTIVE'");
    expect(sql).toContain("customer_role.role = 'CUSTOMER'");
    expect(sql).toContain("provider_role.role = 'PROVIDER'");
    expect(sql).toContain("provider_profiles.profile_status = 'ACTIVE'");
    expect(sql).toContain('service_categories.is_active = TRUE');
    expect(query.mock.calls[0]?.[1]).toEqual([reviewId, customerUserId, 3, 'Updated note']);
  });
});
