import type { RequestHandler } from 'express';

import { logger } from '../config/logger.js';
import { verifyFirebaseIdToken } from '../modules/auth/firebase-admin.js';
import type { FirebaseIdentity } from '../modules/auth/types.js';

export type FirebaseIdTokenVerifier = (token: string) => Promise<FirebaseIdentity>;

export function createRequireFirebaseAuth(
  verifyToken: FirebaseIdTokenVerifier = verifyFirebaseIdToken,
): RequestHandler {
  return async (request, response, next) => {
    const token = request.get('authorization')?.match(/^Bearer\s+([^\s]+)$/i)?.[1];

    if (!token) {
      response.status(401).json({
        error: { code: 'UNAUTHENTICATED', message: 'Sign in to continue.' },
      });
      return;
    }

    try {
      request.firebaseIdentity = await verifyToken(token);
      next();
    } catch {
      // Never log or return the bearer token or provider SDK error details.
      logger.warn('Firebase ID token verification failed');
      response.status(401).json({
        error: { code: 'UNAUTHENTICATED', message: 'Your session is invalid or expired.' },
      });
    }
  };
}
