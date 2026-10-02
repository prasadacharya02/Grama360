import { Router } from 'express';
import { z } from 'zod';

import { createRequireFirebaseAuth, type FirebaseIdTokenVerifier } from '../../middleware/require-firebase-auth.js';
import {
  AdminAccessRequiredError,
  AdminPermissionRequiredError,
  ProviderReviewNotPendingError,
  ProviderReviewRecordMissingError,
  type AdminAccess,
  type AdminReviewStore,
} from './admin-review.types.js';

const reviewQueueQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
});
const providerIdSchema = z.string().uuid();
const reviewDecisionSchema = z
  .object({
    decision: z.enum(['APPROVE', 'REJECT']),
    decisionNote: z.string().trim().max(1000).nullable().optional(),
  })
  .strict()
  .superRefine((input, context) => {
    if (input.decision === 'REJECT' && !input.decisionNote?.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['decisionNote'],
        message: 'A rejection reason is required.',
      });
    }
  });

export interface AdminReviewRouterDependencies {
  store: AdminReviewStore;
  verifyToken?: FirebaseIdTokenVerifier;
  now?: () => number;
}

const recentMfaWindowSeconds = 15 * 60;

export function createAdminReviewRouter(dependencies: AdminReviewRouterDependencies): Router {
  const router = Router();
  const requireAuth = createRequireFirebaseAuth(dependencies.verifyToken);

  router.get('/admin/me', requireAuth, async (request, response) => {
    const access = await authorizeAdmin(request.firebaseIdentity, response, dependencies);
    if (!access) return;
    response.status(200).json({ role: access.role });
  });

  router.get('/admin/provider-reviews', requireAuth, async (request, response) => {
    const access = await authorizeAdmin(request.firebaseIdentity, response, dependencies);
    if (!access) return;

    const parsedQuery = reviewQueueQuerySchema.safeParse(request.query);
    if (!parsedQuery.success) {
      response.status(400).json({
        error: { code: 'INVALID_PAGINATION', message: 'Choose a valid review queue page.' },
      });
      return;
    }

    const result = await dependencies.store.listPendingProviderReviews(
      parsedQuery.data.limit,
      parsedQuery.data.offset,
    );
    response.status(200).json({ ...result, ...parsedQuery.data });
  });

  router.post('/admin/provider-reviews/:providerId/decision', requireAuth, async (request, response) => {
    const access = await authorizeAdmin(request.firebaseIdentity, response, dependencies);
    if (!access) return;
    if (access.role === 'SUPPORT') {
      response.status(403).json({
        error: { code: 'ADMIN_PERMISSION_REQUIRED', message: 'This administrator cannot review providers.' },
      });
      return;
    }

    const providerId = providerIdSchema.safeParse(request.params.providerId);
    const parsed = reviewDecisionSchema.safeParse(request.body ?? {});
    if (!providerId.success || !parsed.success) {
      response.status(400).json({
        error: { code: 'INVALID_PROVIDER_DECISION', message: 'Check the provider decision and try again.' },
      });
      return;
    }

    try {
      const result = await dependencies.store.decideProviderReview(
        request.firebaseIdentity!.uid,
        providerId.data,
        parsed.data.decision,
        parsed.data.decisionNote ?? null,
      );
      if (!result) {
        response.status(404).json({
          error: { code: 'PROVIDER_REVIEW_NOT_FOUND', message: 'The provider review was not found.' },
        });
        return;
      }
      response.status(200).json(result);
    } catch (error) {
      if (error instanceof ProviderReviewNotPendingError) {
        response.status(409).json({
          error: { code: 'PROVIDER_REVIEW_ALREADY_DECIDED', message: 'This provider is not awaiting review.' },
        });
        return;
      }
      if (error instanceof ProviderReviewRecordMissingError) {
        response.status(409).json({
          error: { code: 'PROVIDER_REVIEW_STATE_INVALID', message: 'The review state changed. Reload the queue.' },
        });
        return;
      }
      if (error instanceof AdminAccessRequiredError) {
        response.status(403).json({
          error: { code: 'ADMIN_ACCESS_REQUIRED', message: 'An enabled administrator account is required.' },
        });
        return;
      }
      if (error instanceof AdminPermissionRequiredError) {
        response.status(403).json({
          error: { code: 'ADMIN_PERMISSION_REQUIRED', message: 'This administrator cannot review providers.' },
        });
        return;
      }
      throw error;
    }
  });

  return router;
}

async function authorizeAdmin(
  identity: Express.Request['firebaseIdentity'],
  response: import('express').Response,
  dependencies: AdminReviewRouterDependencies,
) {
  if (!identity) {
    response.status(401).json({
      error: { code: 'UNAUTHENTICATED', message: 'Sign in to continue.' },
    });
    return null;
  }

  let access: AdminAccess | null = null;
  try {
    access = await dependencies.store.getAdminAccess(identity.uid);
  } catch (error) {
    if (!(error instanceof AdminAccessRequiredError)) throw error;
  }
  if (!access) {
    response.status(403).json({
      error: { code: 'ADMIN_ACCESS_REQUIRED', message: 'An enabled administrator account is required.' },
    });
    return null;
  }
  if (!access.mfaEnrolled) {
    response.status(403).json({
      error: {
        code: 'ADMIN_MFA_ENROLLMENT_REQUIRED',
        message: 'Administrator multi-factor authentication is not enrolled.',
      },
    });
    return null;
  }

  const now = dependencies.now?.() ?? Date.now();
  const ageSeconds = now / 1000 - (identity.authTime ?? Number.POSITIVE_INFINITY);
  if (!identity.signInSecondFactor) {
    response.status(403).json({
      error: { code: 'ADMIN_MFA_REQUIRED', message: 'Complete administrator multi-factor sign-in.' },
    });
    return null;
  }
  if (ageSeconds < 0 || ageSeconds > recentMfaWindowSeconds) {
    response.status(403).json({
      error: {
        code: 'ADMIN_MFA_REAUTH_REQUIRED',
        message: 'Sign in again with administrator multi-factor authentication.',
      },
    });
    return null;
  }
  return access;
}
