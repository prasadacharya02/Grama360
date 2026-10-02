import type { PageCursorPosition } from '../../utils/page-cursor.js';

export type ReviewModerationStatus = 'VISIBLE' | 'HIDDEN' | 'PENDING';

export interface ReviewInput {
  rating: number;
  reviewText: string | null;
}

export interface PublicProviderReview {
  id: string;
  rating: number;
  reviewText: string | null;
  reviewerDisplayName: string;
  createdAt: string;
  isMine: boolean;
}

export interface CustomerProviderReview {
  id: string;
  rating: number;
  reviewText: string | null;
  moderationStatus: ReviewModerationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderReviewPage {
  items: PublicProviderReview[];
  hasMore: boolean;
  nextCursor: string | null;
  myReview: CustomerProviderReview | null;
}

export interface ReviewStore {
  listProviderReviews(
    providerId: string,
    customerUserId: string,
    limit: number,
    cursor: PageCursorPosition | null,
  ): Promise<ProviderReviewPage | null>;
  createReview(
    customerUserId: string,
    providerId: string,
    input: ReviewInput,
  ): Promise<CustomerProviderReview | null>;
  updateReview(
    customerUserId: string,
    reviewId: string,
    input: ReviewInput,
  ): Promise<CustomerProviderReview | null>;
}

export class ReviewAlreadyExistsError extends Error {
  constructor() {
    super('A review already exists for this customer and provider.');
    this.name = 'ReviewAlreadyExistsError';
  }
}
