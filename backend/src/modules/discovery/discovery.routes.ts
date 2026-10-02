import { Router, type Response } from 'express';
import { z } from 'zod';

import {
  createRequireFirebaseAuth,
  type FirebaseIdTokenVerifier,
} from '../../middleware/require-firebase-auth.js';
import { decodePageCursor, InvalidPageCursorError, type PageCursorPosition } from '../../utils/page-cursor.js';
import type { AppSession, AuthUserStore, FirebaseIdentity } from '../auth/types.js';
import { AccountNotActiveError } from '../auth/types.js';
import type {
  ProviderDirectoryStore,
  ProviderSearchOptions,
} from './discovery.types.js';

const searchQuerySchema = z.object({
  language: z.enum(['en', 'kn']).default('en'),
  categoryId: z.string().uuid().optional(),
  q: z.string().trim().max(100).optional(),
  location: z.string().trim().max(100).optional(),
  availableNow: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
}).strict();
const favoritesQuerySchema = z.object({
  language: z.enum(['en', 'kn']).default('en'),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().max(256).optional(),
}).strict();
const providerIdSchema = z.string().uuid();

export interface ProviderDirectoryRouterDependencies {
  store: ProviderDirectoryStore;
  authUserStore: AuthUserStore;
  verifyToken?: FirebaseIdTokenVerifier;
}

export function createProviderDirectoryRouter(
  dependencies: ProviderDirectoryRouterDependencies,
): Router {
  const router = Router();
  const requireAuth = createRequireFirebaseAuth(dependencies.verifyToken);

  router.get('/me/favorites', requireAuth, async (request, response) => {
    const session = await requireCustomer(request.firebaseIdentity, dependencies, response);
    if (!session) return;

    const parsed = favoritesQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      response.status(400).json({
        error: { code: 'INVALID_FAVORITES_QUERY', message: 'Check the favorites page filters.' },
      });
      return;
    }

    let cursor: PageCursorPosition | null = null;
    try {
      if (parsed.data.cursor) cursor = decodePageCursor(parsed.data.cursor, 'favorite');
    } catch (error) {
      if (!(error instanceof InvalidPageCursorError)) throw error;
      response.status(400).json({
        error: { code: 'INVALID_FAVORITES_QUERY', message: 'Check the favorites page filters.' },
      });
      return;
    }

    const page = await dependencies.store.listFavorites(
      session.user.id,
      parsed.data.language,
      parsed.data.limit,
      cursor,
    );
    response.status(200).json({
      items: page.items,
      hasMore: page.hasMore,
      nextCursor: page.nextCursor,
      limit: parsed.data.limit,
    });
  });

  router.put('/me/favorites/:providerId', requireAuth, async (request, response) => {
    const session = await requireCustomer(request.firebaseIdentity, dependencies, response);
    if (!session) return;

    const parsedId = providerIdSchema.safeParse(request.params.providerId);
    if (!parsedId.success) {
      response.status(400).json({
        error: { code: 'INVALID_PROVIDER_ID', message: 'The provider identifier is invalid.' },
      });
      return;
    }

    const eligible = await dependencies.store.addFavorite(session.user.id, parsedId.data);
    if (!eligible) {
      response.status(404).json({
        error: { code: 'PROVIDER_NOT_FOUND', message: 'This provider is not available.' },
      });
      return;
    }
    response.status(200).json({ favorite: true });
  });

  router.delete('/me/favorites/:providerId', requireAuth, async (request, response) => {
    const session = await requireCustomer(request.firebaseIdentity, dependencies, response);
    if (!session) return;

    const parsedId = providerIdSchema.safeParse(request.params.providerId);
    if (!parsedId.success) {
      response.status(400).json({
        error: { code: 'INVALID_PROVIDER_ID', message: 'The provider identifier is invalid.' },
      });
      return;
    }

    await dependencies.store.removeFavorite(session.user.id, parsedId.data);
    response.status(200).json({ favorite: false });
  });

  router.get('/providers', requireAuth, async (request, response) => {
    if (!(await requireCustomer(request.firebaseIdentity, dependencies, response))) return;

    const parsed = searchQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      response.status(400).json({
        error: {
          code: 'INVALID_PROVIDER_SEARCH',
          message: 'Check the service, location, and page filters.',
        },
      });
      return;
    }

    const searchOptions: ProviderSearchOptions = {
      language: parsed.data.language,
      limit: parsed.data.limit,
      offset: parsed.data.offset,
      ...(parsed.data.categoryId ? { categoryId: parsed.data.categoryId } : {}),
      ...(parsed.data.q ? { query: parsed.data.q } : {}),
      ...(parsed.data.location ? { location: parsed.data.location } : {}),
      ...(parsed.data.availableNow !== undefined
        ? { availableNow: parsed.data.availableNow }
        : {}),
    };
    const page = await dependencies.store.searchProviders(searchOptions);
    response.status(200).json({
      items: page.items,
      hasMore: page.hasMore,
      limit: searchOptions.limit,
      offset: searchOptions.offset,
    });
  });

  router.get('/providers/:providerId', requireAuth, async (request, response) => {
    if (!(await requireCustomer(request.firebaseIdentity, dependencies, response))) return;

    const parsedId = providerIdSchema.safeParse(request.params.providerId);
    if (!parsedId.success) {
      response.status(400).json({
        error: { code: 'INVALID_PROVIDER_ID', message: 'The provider identifier is invalid.' },
      });
      return;
    }
    const parsedLanguage = z.enum(['en', 'kn']).safeParse(request.query.language ?? 'en');
    if (!parsedLanguage.success) {
      response.status(400).json({
        error: { code: 'INVALID_LANGUAGE', message: 'Choose language en or kn.' },
      });
      return;
    }

    const provider = await dependencies.store.getPublicProfile(
      parsedId.data,
      parsedLanguage.data,
    );
    if (!provider) {
      response.status(404).json({
        error: { code: 'PROVIDER_NOT_FOUND', message: 'This provider is not available.' },
      });
      return;
    }
    response.status(200).json({ provider });
  });

  router.post('/providers/:providerId/call-intent', requireAuth, async (request, response) => {
    if (!(await requireCustomer(request.firebaseIdentity, dependencies, response))) return;

    const parsedId = providerIdSchema.safeParse(request.params.providerId);
    if (!parsedId.success) {
      response.status(400).json({
        error: { code: 'INVALID_PROVIDER_ID', message: 'The provider identifier is invalid.' },
      });
      return;
    }

    const phoneNumber = await dependencies.store.recordCallIntent(parsedId.data);
    if (!phoneNumber) {
      response.status(404).json({
        error: { code: 'PROVIDER_NOT_FOUND', message: 'This provider is not available.' },
      });
      return;
    }
    response.status(200).json({ phoneNumber });
  });

  return router;
}

async function requireCustomer(
  identity: FirebaseIdentity | undefined,
  dependencies: ProviderDirectoryRouterDependencies,
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
        error: {
          code: 'CUSTOMER_ROLE_REQUIRED',
          message: 'Choose the customer role to find local service providers.',
        },
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
