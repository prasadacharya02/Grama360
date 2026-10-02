import { Router, type Request, type Response } from 'express';

import { createRequireFirebaseAuth, type FirebaseIdTokenVerifier } from '../../middleware/require-firebase-auth.js';
import type { AuthUserStore } from '../auth/types.js';
import { AccountNotActiveError } from '../auth/types.js';
import {
  providerAvailabilitySchema,
  providerRegistrationSchema,
} from './provider.schema.js';
import type { ProviderStore } from './provider.types.js';
import {
  ProviderAlreadyExistsError,
  ProviderAvailabilityNotEditableError,
  ProviderCategoriesInvalidError,
  ProviderProfileLockedError,
  ProviderRoleRequiredError,
  ProviderSecondaryPhoneError,
} from './provider.types.js';
import { normalizeProviderInput } from './provider.utils.js';

export interface ProviderRouterDependencies {
  store: ProviderStore;
  authUserStore: AuthUserStore;
  verifyToken?: FirebaseIdTokenVerifier;
}

export function createProviderRouter(dependencies: ProviderRouterDependencies): Router {
  const router = Router();
  const requireAuth = createRequireFirebaseAuth(dependencies.verifyToken);

  router.get('/provider-profiles/me', requireAuth, async (request, response) => {
    const identity = request.firebaseIdentity;
    if (!identity) {
      response.status(401).json({
        error: { code: 'UNAUTHENTICATED', message: 'Sign in to continue.' },
      });
      return;
    }

    try {
      const session = await dependencies.authUserStore.findSession(identity.uid);
      if (!session) {
        response.status(404).json({
          error: { code: 'SESSION_NOT_FOUND', message: 'Complete sign-in before continuing.' },
        });
        return;
      }
      if (!session.roles.includes('PROVIDER')) {
        response.status(403).json({
          error: { code: 'PROVIDER_ROLE_REQUIRED', message: 'Choose the service provider role first.' },
        });
        return;
      }

      const profile = await dependencies.store.getMyProfile(identity.uid);
      if (!profile) {
        response.status(404).json({
          error: { code: 'PROVIDER_PROFILE_NOT_FOUND', message: 'Complete provider registration.' },
        });
        return;
      }
      response.status(200).json(profile);
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

  router.post('/provider-profiles', requireAuth, async (request, response) => {
    await saveProfile(request, response, dependencies, 'create');
  });

  router.patch('/provider-profiles/me', requireAuth, async (request, response) => {
    await saveProfile(request, response, dependencies, 'update');
  });

  router.patch('/provider-profiles/me/availability', requireAuth, async (request, response) => {
    await setAvailability(request, response, dependencies);
  });

  return router;
}

async function setAvailability(
  request: Request,
  response: Response,
  dependencies: ProviderRouterDependencies,
): Promise<void> {
  const identity = request.firebaseIdentity;
  if (!identity) {
    response.status(401).json({
      error: { code: 'UNAUTHENTICATED', message: 'Sign in to continue.' },
    });
    return;
  }

  const parsed = providerAvailabilitySchema.safeParse(request.body ?? {});
  if (!parsed.success) {
    response.status(400).json({
      error: {
        code: 'INVALID_PROVIDER_AVAILABILITY',
        message: 'Choose AVAILABLE, BUSY, or OFFLINE.',
      },
    });
    return;
  }

  try {
    const session = await dependencies.authUserStore.findSession(identity.uid);
    if (!session) {
      response.status(404).json({
        error: { code: 'SESSION_NOT_FOUND', message: 'Complete sign-in before continuing.' },
      });
      return;
    }
    if (!session.roles.includes('PROVIDER')) {
      response.status(403).json({
        error: { code: 'PROVIDER_ROLE_REQUIRED', message: 'Choose the service provider role first.' },
      });
      return;
    }

    const profile = await dependencies.store.setAvailability(identity.uid, parsed.data.availability);
    if (!profile) {
      response.status(404).json({
        error: { code: 'PROVIDER_PROFILE_NOT_FOUND', message: 'Complete provider registration.' },
      });
      return;
    }
    response.status(200).json(profile);
  } catch (error) {
    if (error instanceof ProviderAvailabilityNotEditableError) {
      response.status(409).json({
        error: {
          code: 'AVAILABILITY_NOT_EDITABLE',
          message: 'Only an active provider profile can update availability.',
        },
      });
      return;
    }
    if (error instanceof ProviderRoleRequiredError) {
      response.status(403).json({
        error: { code: 'PROVIDER_ROLE_REQUIRED', message: 'Choose the service provider role first.' },
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
}

async function saveProfile(
  request: Request,
  response: Response,
  dependencies: ProviderRouterDependencies,
  mode: 'create' | 'update',
): Promise<void> {
  const identity = request.firebaseIdentity;
  if (!identity) {
    response.status(401).json({
      error: { code: 'UNAUTHENTICATED', message: 'Sign in to continue.' },
    });
    return;
  }

  const parsed = providerRegistrationSchema.safeParse(request.body ?? {});
  if (!parsed.success) {
    response.status(400).json({
      error: { code: 'INVALID_PROVIDER_PROFILE', message: 'Check the provider details and try again.' },
    });
    return;
  }

  const expectedPhotoPath = `provider-profiles/${identity.uid}/profile.jpg`;
  const photoPath = parsed.data.profilePhotoPath ?? null;
  if (photoPath !== null && photoPath !== expectedPhotoPath) {
    response.status(400).json({
      error: { code: 'INVALID_PROFILE_PHOTO', message: 'The selected profile photo is invalid.' },
    });
    return;
  }

  try {
    const session = await dependencies.authUserStore.findSession(identity.uid);
    if (!session) {
      response.status(404).json({
        error: { code: 'SESSION_NOT_FOUND', message: 'Complete sign-in before continuing.' },
      });
      return;
    }
    if (!session.roles.includes('PROVIDER')) {
      response.status(403).json({
        error: { code: 'PROVIDER_ROLE_REQUIRED', message: 'Choose the service provider role first.' },
      });
      return;
    }
    if (
      parsed.data.secondaryPhoneNumber &&
      parsed.data.secondaryPhoneNumber === session.user.phoneNumber
    ) {
      response.status(400).json({
        error: {
          code: 'SECONDARY_PHONE_DUPLICATES_PRIMARY',
          message: 'Use a different secondary number.',
        },
      });
      return;
    }

    const input = normalizeProviderInput({
      ...parsed.data,
      businessName: parsed.data.businessName ?? null,
      secondaryPhoneNumber: parsed.data.secondaryPhoneNumber ?? null,
      description: parsed.data.description ?? null,
      profilePhotoPath: photoPath,
      location: {
        ...parsed.data.location,
        taluk: parsed.data.location.taluk ?? null,
      },
    });

    const profile =
      mode === 'create'
        ? await dependencies.store.createProfile(identity.uid, input)
        : await dependencies.store.updateProfile(identity.uid, input);

    if (!profile) {
      response.status(404).json({
        error: { code: 'PROVIDER_PROFILE_NOT_FOUND', message: 'Complete provider registration.' },
      });
      return;
    }

    response.status(mode === 'create' ? 201 : 200).json(profile);
  } catch (error) {
    if (error instanceof ProviderAlreadyExistsError) {
      response.status(409).json({
        error: { code: 'PROVIDER_PROFILE_EXISTS', message: 'A provider profile already exists.' },
      });
      return;
    }
    if (error instanceof ProviderRoleRequiredError) {
      response.status(403).json({
        error: { code: 'PROVIDER_ROLE_REQUIRED', message: 'Choose the service provider role first.' },
      });
      return;
    }
    if (error instanceof ProviderCategoriesInvalidError) {
      response.status(400).json({
        error: { code: 'INVALID_SERVICE_CATEGORY', message: 'Choose an active service category.' },
      });
      return;
    }
    if (error instanceof ProviderSecondaryPhoneError) {
      response.status(400).json({
        error: {
          code: 'SECONDARY_PHONE_DUPLICATES_PRIMARY',
          message: 'Use a different secondary number.',
        },
      });
      return;
    }
    if (error instanceof ProviderProfileLockedError) {
      response.status(409).json({
        error: { code: 'PROFILE_REVIEW_REQUIRED', message: 'Contact Grama360 to change this profile.' },
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
}
