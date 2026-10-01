import { Router } from 'express';
import { z } from 'zod';

import { createRequireFirebaseAuth, type FirebaseIdTokenVerifier } from '../../middleware/require-firebase-auth.js';
import type { AuthUserStore, FirebaseIdentity, PhoneVerifiedFirebaseIdentity } from './types.js';
import { AccountNotActiveError, PhoneNumberAlreadyLinkedError } from './types.js';

const phoneNumberPattern = /^\+[1-9][0-9]{7,14}$/;
const sessionBodySchema = z
  .object({ preferredLanguage: z.enum(['en', 'kn']).optional() })
  .strict();
const roleBodySchema = z.object({ role: z.enum(['CUSTOMER', 'PROVIDER']) }).strict();

export interface AuthRouterDependencies {
  store: AuthUserStore;
  verifyToken?: FirebaseIdTokenVerifier;
}

export function createAuthRouter(dependencies: AuthRouterDependencies): Router {
  const router = Router();
  const requireAuth = createRequireFirebaseAuth(dependencies.verifyToken);

  router.post('/auth/session', requireAuth, async (request, response) => {
    const identity = request.firebaseIdentity;
    if (!identity) {
      response.status(401).json({
        error: { code: 'UNAUTHENTICATED', message: 'Sign in to continue.' },
      });
      return;
    }

    if (!isPhoneVerifiedIdentity(identity)) {
      response.status(403).json({
        error: {
          code: 'PHONE_VERIFICATION_REQUIRED',
          message: 'Verify your mobile number with phone sign-in before continuing.',
        },
      });
      return;
    }

    const body = sessionBodySchema.safeParse(request.body ?? {});
    if (!body.success) {
      response.status(400).json({
        error: { code: 'INVALID_REQUEST', message: 'The session request is invalid.' },
      });
      return;
    }

    try {
      const session = await dependencies.store.syncPhoneAccount(
        identity,
        body.data.preferredLanguage,
      );
      response.status(200).json(session);
    } catch (error) {
      if (error instanceof PhoneNumberAlreadyLinkedError) {
        response.status(409).json({
          error: {
            code: 'PHONE_ALREADY_LINKED',
            message: 'This phone number is linked to another account. Contact support.',
          },
        });
        return;
      }
      if (error instanceof AccountNotActiveError) {
        response.status(403).json({
          error: { code: 'ACCOUNT_DISABLED', message: 'This account is not active.' },
        });
        return;
      }
      throw error;
    }
  });

  router.get('/me', requireAuth, async (request, response) => {
    const identity = request.firebaseIdentity;
    if (!identity) {
      response.status(401).json({
        error: { code: 'UNAUTHENTICATED', message: 'Sign in to continue.' },
      });
      return;
    }

    try {
      const session = await dependencies.store.findSession(identity.uid);
      if (!session) {
        response.status(404).json({
          error: { code: 'SESSION_NOT_FOUND', message: 'Complete sign-in to create your account.' },
        });
        return;
      }
      response.status(200).json(session);
    } catch (error) {
      if (error instanceof AccountNotActiveError) {
        response.status(403).json({
          error: { code: 'ACCOUNT_DISABLED', message: 'This account is not active.' },
        });
        return;
      }
      throw error;
    }
  });

  router.put('/me/roles', requireAuth, async (request, response) => {
    const identity = request.firebaseIdentity;
    if (!identity) {
      response.status(401).json({
        error: { code: 'UNAUTHENTICATED', message: 'Sign in to continue.' },
      });
      return;
    }

    const body = roleBodySchema.safeParse(request.body ?? {});
    if (!body.success) {
      response.status(400).json({
        error: {
          code: 'INVALID_ROLE',
          message: 'Choose either CUSTOMER or PROVIDER. Admin access is assigned by the platform.',
        },
      });
      return;
    }

    try {
      const session = await dependencies.store.addRole(identity.uid, body.data.role);
      if (!session) {
        response.status(404).json({
          error: { code: 'SESSION_NOT_FOUND', message: 'Complete sign-in before choosing a role.' },
        });
        return;
      }
      response.status(200).json(session);
    } catch (error) {
      if (error instanceof AccountNotActiveError) {
        response.status(403).json({
          error: { code: 'ACCOUNT_DISABLED', message: 'This account is not active.' },
        });
        return;
      }
      throw error;
    }
  });

  return router;
}

function isPhoneVerifiedIdentity(
  identity: FirebaseIdentity,
): identity is PhoneVerifiedFirebaseIdentity {
  return (
    identity.signInProvider === 'phone' &&
    typeof identity.phoneNumber === 'string' &&
    phoneNumberPattern.test(identity.phoneNumber)
  );
}
