import express, { type ErrorRequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';

import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { checkDatabaseConnection } from './db/pool.js';
import type { FirebaseIdTokenVerifier } from './middleware/require-firebase-auth.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { PostgresAuthUserStore } from './modules/auth/postgres-auth-user-store.js';
import type { AuthUserStore } from './modules/auth/types.js';
import { createCategoriesRouter } from './modules/categories/categories.routes.js';
import type { CategoryStore } from './modules/categories/categories.types.js';
import { PostgresCategoryStore } from './modules/categories/postgres-category-store.js';
import { createAdminReviewRouter } from './modules/admin/admin-review.routes.js';
import type { AdminReviewStore } from './modules/admin/admin-review.types.js';
import { PostgresAdminReviewStore } from './modules/admin/postgres-admin-review-store.js';
import { createProviderRouter } from './modules/providers/provider.routes.js';
import type { ProviderStore } from './modules/providers/provider.types.js';
import { PostgresProviderStore } from './modules/providers/postgres-provider-store.js';
import { createProviderDirectoryRouter } from './modules/discovery/discovery.routes.js';
import type { ProviderDirectoryStore } from './modules/discovery/discovery.types.js';
import { PostgresProviderDirectoryStore } from './modules/discovery/postgres-provider-directory-store.js';
import { createReviewRouter } from './modules/reviews/reviews.routes.js';
import type { ReviewStore } from './modules/reviews/reviews.types.js';
import { PostgresReviewStore } from './modules/reviews/postgres-review-store.js';

export interface AppOptions {
  authUserStore?: AuthUserStore;
  categoryStore?: CategoryStore;
  providerStore?: ProviderStore;
  providerDirectoryStore?: ProviderDirectoryStore;
  reviewStore?: ReviewStore;
  adminReviewStore?: AdminReviewStore;
  verifyFirebaseIdToken?: FirebaseIdTokenVerifier;
}

export function createApp(options: AppOptions = {}) {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(pinoHttp({ logger }));
  app.use(express.json({ limit: '100kb', strict: true }));

  const apiRateLimit = rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please try again shortly.',
      },
    },
  });
  const sessionRateLimit = rateLimit({
    windowMs: 15 * 60_000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many sign-in requests. Please try again later.',
      },
    },
  });
  const callIntentRateLimit = rateLimit({
    windowMs: 15 * 60_000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many call requests. Please wait before trying again.',
      },
    },
  });
  const reviewWriteRateLimit = rateLimit({
    windowMs: 15 * 60_000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many review changes. Please wait before trying again.',
      },
    },
  });

  app.use('/api/v1', apiRateLimit);
  app.use('/api/v1/auth/session', sessionRateLimit);
  app.use('/api/v1/providers/:providerId/call-intent', callIntentRateLimit);
  app.post('/api/v1/providers/:providerId/reviews', reviewWriteRateLimit);
  app.patch('/api/v1/reviews/:reviewId', reviewWriteRateLimit);

  app.get('/api/v1/healthz', (_request, response) => {
    response.status(200).json({ status: 'ok' });
  });

  app.get('/api/v1/readyz', async (_request, response) => {
    try {
      await checkDatabaseConnection();
      response.status(200).json({ status: 'ready', checks: { database: 'ok' } });
    } catch {
      response.status(503).json({
        status: 'not_ready',
        checks: { database: 'unavailable' },
      });
    }
  });

  const authDependencies = {
    store: options.authUserStore ?? new PostgresAuthUserStore(),
    ...(options.verifyFirebaseIdToken
      ? { verifyToken: options.verifyFirebaseIdToken }
      : {}),
  };
  app.use('/api/v1', createAuthRouter(authDependencies));
  app.use(
    '/api/v1',
    createCategoriesRouter(options.categoryStore ?? new PostgresCategoryStore()),
  );
  app.use(
    '/api/v1',
    createProviderRouter({
      store: options.providerStore ?? new PostgresProviderStore(),
      authUserStore: authDependencies.store,
      ...(options.verifyFirebaseIdToken
        ? { verifyToken: options.verifyFirebaseIdToken }
        : {}),
    }),
  );
  app.use(
    '/api/v1',
    createProviderDirectoryRouter({
      store: options.providerDirectoryStore ?? new PostgresProviderDirectoryStore(),
      authUserStore: authDependencies.store,
      ...(options.verifyFirebaseIdToken
        ? { verifyToken: options.verifyFirebaseIdToken }
        : {}),
    }),
  );
  app.use(
    '/api/v1',
    createReviewRouter({
      store: options.reviewStore ?? new PostgresReviewStore(),
      authUserStore: authDependencies.store,
      ...(options.verifyFirebaseIdToken
        ? { verifyToken: options.verifyFirebaseIdToken }
        : {}),
    }),
  );
  app.use(
    '/api/v1',
    createAdminReviewRouter({
      store: options.adminReviewStore ?? new PostgresAdminReviewStore(),
      ...(options.verifyFirebaseIdToken
        ? { verifyToken: options.verifyFirebaseIdToken }
        : {}),
    }),
  );

  app.use('/api/v1', (_request, response) => {
    response.status(404).json({
      error: { code: 'NOT_FOUND', message: 'API endpoint not found.' },
    });
  });

  const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
    if (response.headersSent) return;

    const errorName = error instanceof Error ? error.name : 'UnknownError';
    const errorCode =
      typeof error === 'object' && error !== null && 'code' in error &&
      typeof error.code === 'string'
        ? error.code
        : undefined;
    const errorType =
      typeof error === 'object' && error !== null && 'type' in error
        ? error.type
        : undefined;
    const errorStatus =
      typeof error === 'object' && error !== null && 'status' in error
        ? error.status
        : undefined;

    if (errorType === 'entity.parse.failed' || errorStatus === 400) {
      response.status(400).json({
        error: { code: 'INVALID_JSON', message: 'The request body is not valid JSON.' },
      });
      return;
    }
    if (errorStatus === 413) {
      response.status(413).json({
        error: { code: 'PAYLOAD_TOO_LARGE', message: 'The request body is too large.' },
      });
      return;
    }

    // Avoid logging database error detail strings, which can contain a phone number.
    logger.error({ errorName, errorCode }, 'Unhandled API error');

    response.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message:
          env.NODE_ENV === 'production'
            ? 'An unexpected error occurred.'
            : 'An unexpected API error occurred.',
      },
    });
  };

  app.use(errorHandler);
  return app;
}
