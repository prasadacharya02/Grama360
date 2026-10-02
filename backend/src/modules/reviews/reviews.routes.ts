import { Router, type Response } from 'express';
import { z } from 'zod';

import {
  createRequireFirebaseAuth,
  type FirebaseIdTokenVerifier,
} from '../../middleware/require-firebase-auth.js';
import {
  decodePageCursor,
  InvalidPageCursorError,
  type PageCursorPosition,
} from '../../utils/page-cursor.js';
import type { AppSession, AuthUserStore, FirebaseIdentity } from '../auth/types.js';
import { AccountNotActiveError } from '../auth/types.js';
import { ReviewAlreadyExistsError, type ReviewStore } from './reviews.types.js';

const providerIdSchema = z.string().uuid();
const reviewIdSchema = z.string().uuid();
const reviewListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().max(256).optional(),
}).strict();
const reviewInputSchema = z.object({
  rating: z.number().int().min(1).max(5),
  reviewText: z.string().trim().max(1500).nullable().optional(),
}).strict();

export interface ReviewRouterDependencies {
  store: ReviewStore;
  authUserStore: AuthUserStore;
  verifyToken?: FirebaseIdTokenVerifier;
}

export function createReviewRouter(dependencies: ReviewRouterDependencies): Router {
  const router = Router();
  const requireAuth = createRequireFirebaseAuth(dependencies.verifyToken);

  router.get('/providers/:providerId/reviews', requireAuth, async (request, response) => {
    const session = await requireCustomer(request.firebaseIdentity, dependencies, response);
    if (!session) return;

    const parsedId = providerIdSchema.safeParse(request.params.providerId);
    const parsedQuery = reviewListQuerySchema.safeParse(request.query);
    if (!parsedId.success || !parsedQuery.success) {
      response.status(400).json({
        error: { code: 'INVALID_REVIEW_REQUEST', message: 'Check the provider and review page filters.' },
      });
      return;
    }

    let cursor: PageCursorPosition | null = null;
    try {
      if (parsedQuery.data.cursor) cursor = decodePageCursor(parsedQuery.data.cursor, 'review');
    } catch (error) {
      if (!(error instanceof InvalidPageCursorError)) throw error;
      response.status(400).json({
        error: { code: 'INVALID_REVIEW_REQUEST', message: 'Check the provider and review page filters.' },
      });
      return;
    }

    const page = await dependencies.store.listProviderReviews(
      parsedId.data,
      session.user.id,
      parsedQuery.data.limit,
      cursor,
    );
    if (!page) {
      response.status(404).json({
        error: { code: 'PROVIDER_NOT_FOUND', message: 'This provider is not available.' },
      });
      return;
    }
    response.status(200).json({
      items: page.items,
      hasMore: page.hasMore,
      nextCursor: page.nextCursor,
      myReview: page.myReview,
      limit: parsedQuery.data.limit,
    });
  });

  router.post('/providers/:providerId/reviews', requireAuth, async (request, response) => {
    const session = await requireCustomer(request.firebaseIdentity, dependencies, response);
    if (!session) return;

    const parsedId = providerIdSchema.safeParse(request.params.providerId);
    const parsedInput = reviewInputSchema.safeParse(request.body ?? {});
    if (!parsedId.success || !parsedInput.success) {
      response.status(400).json({
        error: { code: 'INVALID_REVIEW', message: 'Enter a rating from 1 to 5 and review text up to 1,500 characters.' },
      });
      return;
    }

    try {
      const review = await dependencies.store.createReview(
        session.user.id,
        parsedId.data,
        normalizeReviewInput(parsedInput.data),
      );
      if (!review) {
        response.status(404).json({
          error: { code: 'PROVIDER_NOT_FOUND', message: 'This provider is not available.' },
        });
        return;
      }
      response.status(201).json({ review });
    } catch (error) {
      if (error instanceof ReviewAlreadyExistsError) {
        response.status(409).json({
          error: { code: 'REVIEW_ALREADY_EXISTS', message: 'Edit your existing review instead.' },
        });
        return;
      }
      throw error;
    }
  });

  router.patch('/reviews/:reviewId', requireAuth, async (request, response) => {
    const session = await requireCustomer(request.firebaseIdentity, dependencies, response);
    if (!session) return;

    const parsedId = reviewIdSchema.safeParse(request.params.reviewId);
    const parsedInput = reviewInputSchema.safeParse(request.body ?? {});
    if (!parsedId.success || !parsedInput.success) {
      response.status(400).json({
        error: { code: 'INVALID_REVIEW', message: 'Enter a rating from 1 to 5 and review text up to 1,500 characters.' },
      });
      return;
    }

    const review = await dependencies.store.updateReview(
      session.user.id,
      parsedId.data,
      normalizeReviewInput(parsedInput.data),
    );
    if (!review) {
      response.status(404).json({
        error: { code: 'REVIEW_NOT_FOUND', message: 'This review cannot be edited.' },
      });
      return;
    }
    response.status(200).json({ review });
  });

  return router;
}

function normalizeReviewInput(input: z.infer<typeof reviewInputSchema>) {
  return {
    rating: input.rating,
    reviewText: input.reviewText?.trim() || null,
  };
}

async function requireCustomer(
  identity: FirebaseIdentity | undefined,
  dependencies: ReviewRouterDependencies,
  response: Response,
): Promise<AppSession | null> {
  if (!identity) {
    response.status(401).json({
      error: { code: 'UNAUTHENTICATED', message: 'Sign in to continue.' },
    });
    return null;
  }

  try {
    const session = await dependencies.authUserStore.findSession(identity.uid);
    if (!session) {
      response.status(404).json({
        error: { code: 'SESSION_NOT_FOUND', message: 'Complete sign-in before continuing.' },
      });
      return null;
    }
    if (!session.roles.includes('CUSTOMER')) {
      response.status(403).json({
        error: { code: 'CUSTOMER_ROLE_REQUIRED', message: 'Choose the customer role to review providers.' },
      });
      return null;
    }
    return session;
  } catch (error) {
    if (error instanceof AccountNotActiveError) {
      response.status(403).json({
        error: { code: 'ACCOUNT_DISABLED', message: 'This account is not active.' },
      });
      return null;
    }
    throw error;
  }
}
