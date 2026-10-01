import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { createApp } from '../src/app.js';
import type { AppSession, AuthUserStore, FirebaseIdentity } from '../src/modules/auth/types.js';
import type { CategoryStore, ServiceCategoryView } from '../src/modules/categories/categories.types.js';
import type {
  ProviderProfileView,
  ProviderRegistrationInput,
  ProviderStore,
} from '../src/modules/providers/provider.types.js';
import {
  ProviderAlreadyExistsError,
  ProviderProfileLockedError,
} from '../src/modules/providers/provider.types.js';

const firebaseUid = 'firebase-uid-provider-1';
const primaryPhone = '+919876543210';
const firstServiceId = '11111111-1111-4111-8111-111111111111';
const secondServiceId = '22222222-2222-4222-8222-222222222222';

const providerIdentity: FirebaseIdentity = {
  uid: firebaseUid,
  phoneNumber: primaryPhone,
  signInProvider: 'phone',
};

const providerSession: AppSession = {
  user: {
    id: 'a3c7b9dd-9d43-48e4-93ba-7d40d2162b11',
    phoneNumber: primaryPhone,
    fullName: null,
    preferredLanguage: 'en',
  },
  roles: ['PROVIDER'],
  onboardingComplete: true,
};

const categories: ServiceCategoryView[] = [
  {
    id: firstServiceId,
    parentId: null,
    slug: 'electrician',
    name: 'Electrician',
    iconKey: 'electrical_services',
    sortOrder: 10,
  },
];

const sampleProfile: ProviderProfileView = {
  id: '33333333-3333-4333-8333-333333333333',
  displayName: 'Gopal Rao',
  businessName: 'Gopal Electricals',
  secondaryPhoneNumber: null,
  serviceRadiusKm: 20,
  experienceYears: 5,
  description: null,
  profilePhotoPath: null,
  profileStatus: 'PENDING_REVIEW',
  reviewNote: null,
  availability: 'OFFLINE',
  location: {
    locality: 'Kusugal',
    taluk: 'Hubballi',
    district: 'Dharwad',
    state: 'Karnataka',
    languageCode: 'en',
  },
  services: [
    { id: firstServiceId, slug: 'electrician', name: 'Electrician', isPrimary: true },
  ],
  languages: ['kn', 'en'],
  workingHours: Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    isClosed: weekday === 0,
    opensAt: weekday === 0 ? null : '09:00',
    closesAt: weekday === 0 ? null : '17:00',
  })),
};

function validRegistration(): ProviderRegistrationInput {
  return {
    displayName: '  Gopal Rao  ',
    businessName: ' Gopal Electricals ',
    secondaryPhoneNumber: null,
    serviceRadiusKm: 20,
    experienceYears: 5,
    description: '  Electrical repairs  ',
    profilePhotoPath: null,
    serviceIds: [firstServiceId, secondServiceId],
    languages: ['kn', 'en'],
    location: {
      locality: ' Kusugal ',
      taluk: ' Hubballi ',
      district: ' Dharwad ',
      languageCode: 'en',
    },
    workingHours: Array.from({ length: 7 }, (_, weekday) => ({
      weekday,
      isClosed: weekday === 0,
      opensAt: weekday === 0 ? null : '09:00',
      closesAt: weekday === 0 ? null : '17:00',
    })),
  };
}

interface TestOptions {
  roles?: AppSession['roles'];
  identity?: FirebaseIdentity;
  profile?: ProviderProfileView | null;
}

function createTestContext(options: TestOptions = {}) {
  const roles = options.roles ?? ['PROVIDER'];
  const profile = options.profile === undefined ? sampleProfile : options.profile;

  const authUserStore: AuthUserStore = {
    syncPhoneAccount: vi.fn(async () => providerSession),
    findSession: vi.fn(async () => ({ ...providerSession, roles })),
    addRole: vi.fn(async () => providerSession),
  };
  const providerStore: ProviderStore = {
    createProfile: vi.fn(async (_uid, input) => ({
      ...sampleProfile,
      displayName: input.displayName,
      businessName: input.businessName,
      secondaryPhoneNumber: input.secondaryPhoneNumber,
      serviceRadiusKm: input.serviceRadiusKm,
      experienceYears: input.experienceYears,
      description: input.description,
      profilePhotoPath: input.profilePhotoPath,
      location: {
        ...sampleProfile.location,
        locality: input.location.locality,
        taluk: input.location.taluk,
        district: input.location.district,
      },
    })),
    getMyProfile: vi.fn(async () => profile),
    updateProfile: vi.fn(async (_uid, input) => ({
      ...sampleProfile,
      displayName: input.displayName,
      profileStatus: 'PENDING_REVIEW' as const,
    })),
  };
  const categoryStore: CategoryStore = {
    listActive: vi.fn(async (language) =>
      language === 'kn'
        ? [{ ...categories[0]!, name: 'ಎಲೆಕ್ಟ್ರಿಷಿಯನ್' }]
        : categories,
    ),
  };

  const app = createApp({
    authUserStore,
    categoryStore,
    providerStore,
    verifyFirebaseIdToken: async (token) => {
      if (token !== 'valid-test-token') throw new Error('invalid test token');
      return options.identity ?? providerIdentity;
    },
  });

  return { app, authUserStore, categoryStore, providerStore };
}

describe('provider self-registration API', () => {
  it('lists active categories in Kannada and rejects unsupported locales', async () => {
    const { app, categoryStore } = createTestContext();
    const localized = await request(app).get('/api/v1/categories?language=kn');

    expect(localized.status).toBe(200);
    expect(localized.body.categories[0].name).toBe('ಎಲೆಕ್ಟ್ರಿಷಿಯನ್');
    expect(categoryStore.listActive).toHaveBeenCalledWith('kn');

    const invalid = await request(app).get('/api/v1/categories?language=tc');
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe('INVALID_LANGUAGE');
  });

  it('requires a verified Firebase session and provider role to read a profile', async () => {
    const { app, providerStore } = createTestContext();
    const unauthenticated = await request(app).get('/api/v1/provider-profiles/me');
    expect(unauthenticated.status).toBe(401);
    expect(providerStore.getMyProfile).not.toHaveBeenCalled();

    const customerContext = createTestContext({ roles: ['CUSTOMER'] });
    const forbidden = await request(customerContext.app)
      .get('/api/v1/provider-profiles/me')
      .set('Authorization', 'Bearer valid-test-token');
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.error.code).toBe('PROVIDER_ROLE_REQUIRED');
    expect(customerContext.providerStore.getMyProfile).not.toHaveBeenCalled();
  });

  it('creates an owner-scoped profile with normalized inputs and pending review status', async () => {
    const { app, providerStore } = createTestContext({ profile: null });
    const response = await request(app)
      .post('/api/v1/provider-profiles')
      .set('Authorization', 'Bearer valid-test-token')
      .send(validRegistration());

    expect(response.status).toBe(201);
    expect(response.body.profileStatus).toBe('PENDING_REVIEW');
    expect(providerStore.createProfile).toHaveBeenCalledWith(
      firebaseUid,
      expect.objectContaining({
        displayName: 'Gopal Rao',
        businessName: 'Gopal Electricals',
        description: 'Electrical repairs',
        location: {
          locality: 'Kusugal',
          taluk: 'Hubballi',
          district: 'Dharwad',
          languageCode: 'en',
        },
      }),
    );
  });

  it('rejects malformed schedules, duplicate services, and photos outside the owner path', async () => {
    const { app, providerStore } = createTestContext({ profile: null });
    const headers = { Authorization: 'Bearer valid-test-token' };

    const duplicateServices = await request(app)
      .post('/api/v1/provider-profiles')
      .set(headers)
      .send({ ...validRegistration(), serviceIds: [firstServiceId, firstServiceId] });
    expect(duplicateServices.status).toBe(400);

    const closedWeek = await request(app)
      .post('/api/v1/provider-profiles')
      .set(headers)
      .send({
        ...validRegistration(),
        workingHours: Array.from({ length: 7 }, (_, weekday) => ({
          weekday,
          isClosed: true,
          opensAt: null,
          closesAt: null,
        })),
      });
    expect(closedWeek.status).toBe(400);

    const foreignPhoto = await request(app)
      .post('/api/v1/provider-profiles')
      .set(headers)
      .send({
        ...validRegistration(),
        profilePhotoPath: 'provider-profiles/someone-else/profile.jpg',
      });
    expect(foreignPhoto.status).toBe(400);
    expect(foreignPhoto.body.error.code).toBe('INVALID_PROFILE_PHOTO');

    const duplicatePhone = await request(app)
      .post('/api/v1/provider-profiles')
      .set(headers)
      .send({ ...validRegistration(), secondaryPhoneNumber: primaryPhone });
    expect(duplicatePhone.status).toBe(400);
    expect(duplicatePhone.body.error.code).toBe('SECONDARY_PHONE_DUPLICATES_PRIMARY');

    const attemptedApproval = await request(app)
      .post('/api/v1/provider-profiles')
      .set(headers)
      .send({ ...validRegistration(), profileStatus: 'ACTIVE', userId: 'another-user' });
    expect(attemptedApproval.status).toBe(400);
    expect(providerStore.createProfile).not.toHaveBeenCalled();
  });

  it('does not accept a client-supplied user ID and returns only the caller profile', async () => {
    const { app, providerStore } = createTestContext();
    const response = await request(app)
      .get('/api/v1/provider-profiles/me?userId=another-user')
      .set('Authorization', 'Bearer valid-test-token');

    expect(response.status).toBe(200);
    expect(providerStore.getMyProfile).toHaveBeenCalledWith(firebaseUid);
  });

  it('maps duplicate submissions and locked profiles to safe conflict responses', async () => {
    const createContext = createTestContext({ profile: null });
    vi.mocked(createContext.providerStore.createProfile).mockRejectedValue(
      new ProviderAlreadyExistsError(),
    );
    const duplicate = await request(createContext.app)
      .post('/api/v1/provider-profiles')
      .set('Authorization', 'Bearer valid-test-token')
      .send(validRegistration());
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('PROVIDER_PROFILE_EXISTS');

    const updateContext = createTestContext();
    vi.mocked(updateContext.providerStore.updateProfile).mockRejectedValue(
      new ProviderProfileLockedError(),
    );
    const locked = await request(updateContext.app)
      .patch('/api/v1/provider-profiles/me')
      .set('Authorization', 'Bearer valid-test-token')
      .send(validRegistration());
    expect(locked.status).toBe(409);
    expect(locked.body.error.code).toBe('PROFILE_REVIEW_REQUIRED');
  });

  it('returns a rejection note only through the owner profile endpoint', async () => {
    const rejectionNote = 'Please include a clearer locality.';
    const rejectedProfile = {
      ...sampleProfile,
      profileStatus: 'REJECTED' as const,
      reviewNote: rejectionNote,
    };
    const { app } = createTestContext({ profile: rejectedProfile });
    const response = await request(app)
      .get('/api/v1/provider-profiles/me')
      .set('Authorization', 'Bearer valid-test-token');

    expect(response.status).toBe(200);
    expect(response.body.profileStatus).toBe('REJECTED');
    expect(response.body.reviewNote).toBe(rejectionNote);
  });

  it('returns 404 when the authenticated provider has not registered yet', async () => {
    const { app } = createTestContext({ profile: null });
    const response = await request(app)
      .get('/api/v1/provider-profiles/me')
      .set('Authorization', 'Bearer valid-test-token');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('PROVIDER_PROFILE_NOT_FOUND');
  });
});
