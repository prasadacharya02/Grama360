import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { createApp } from '../src/app.js';
import type { AppSession, AuthUserStore, FirebaseIdentity } from '../src/modules/auth/types.js';
import type {
  ProviderDirectoryStore,
  ProviderSearchOptions,
  PublicProviderProfile,
  PublicProviderSummary,
} from '../src/modules/discovery/discovery.types.js';

const customerUid = 'firebase-uid-customer-1';
const customerPhone = '+919876543210';
const providerId = '33333333-3333-4333-8333-333333333333';
const categoryId = '11111111-1111-4111-8111-111111111111';

const customerIdentity: FirebaseIdentity = {
  uid: customerUid,
  phoneNumber: customerPhone,
  signInProvider: 'phone',
};

const customerSession: AppSession = {
  user: {
    id: 'a3c7b9dd-9d43-48e4-93ba-7d40d2162b11',
    phoneNumber: customerPhone,
    fullName: 'Lakshmi',
    preferredLanguage: 'kn',
  },
  roles: ['CUSTOMER'],
  onboardingComplete: true,
};

const provider: PublicProviderSummary = {
  id: providerId,
  displayName: 'Gopal Rao',
  businessName: 'Gopal Electricals',
  profilePhotoPath: null,
  serviceRadiusKm: 20,
  experienceYears: 5,
  availability: 'AVAILABLE',
  location: {
    locality: 'ಕುಸುಗಲ್',
    district: 'ಧಾರವಾಡ',
    state: 'ಕರ್ನಾಟಕ',
    languageCode: 'kn',
  },
  services: [
    { id: categoryId, slug: 'electrician', name: 'ಎಲೆಕ್ಟ್ರಿಷಿಯನ್', isPrimary: true },
  ],
  languages: ['kn', 'en'],
  averageRating: 4.8,
  reviewCount: 12,
};

const profile: PublicProviderProfile = {
  ...provider,
  description: 'ವಿದ್ಯುತ್ ದುರಸ್ತಿ ಸೇವೆ',
  workingHours: Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    isClosed: weekday === 0,
    opensAt: weekday === 0 ? null : '09:00',
    closesAt: weekday === 0 ? null : '17:00',
  })),
};

function createTestContext(roles: AppSession['roles'] = ['CUSTOMER']) {
  const authUserStore: AuthUserStore = {
    syncPhoneAccount: vi.fn(async () => customerSession),
    findSession: vi.fn(async () => ({ ...customerSession, roles })),
    addRole: vi.fn(async () => ({ ...customerSession, roles })),
  };
  const providerDirectoryStore: ProviderDirectoryStore = {
    searchProviders: vi.fn(async (_options: ProviderSearchOptions) => ({
      items: [provider],
      hasMore: false,
    })),
    getPublicProfile: vi.fn(async () => profile),
    recordCallIntent: vi.fn(async () => '+919123456789'),
  };
  const app = createApp({
    authUserStore,
    providerDirectoryStore,
    verifyFirebaseIdToken: async (token) => {
      if (token !== 'valid-customer-token') throw new Error('invalid test token');
      return customerIdentity;
    },
  });
  return { app, authUserStore, providerDirectoryStore };
}

describe('customer provider discovery API', () => {
  it('requires a signed-in customer before searching', async () => {
    const { app, providerDirectoryStore } = createTestContext();
    const response = await request(app).get('/api/v1/providers');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
    expect(providerDirectoryStore.searchProviders).not.toHaveBeenCalled();
  });

  it('rejects provider-only accounts and validates search filters', async () => {
    const providerContext = createTestContext(['PROVIDER']);
    const forbidden = await request(providerContext.app)
      .get('/api/v1/providers')
      .set('Authorization', 'Bearer valid-customer-token');
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.error.code).toBe('CUSTOMER_ROLE_REQUIRED');
    expect(providerContext.providerDirectoryStore.searchProviders).not.toHaveBeenCalled();

    const invalidFilter = await request(createTestContext().app)
      .get('/api/v1/providers?limit=500&language=tc')
      .set('Authorization', 'Bearer valid-customer-token');
    expect(invalidFilter.status).toBe(400);
    expect(invalidFilter.body.error.code).toBe('INVALID_PROVIDER_SEARCH');
  });

  it('searches by service and location in the selected language without exposing a phone number', async () => {
    const { app, providerDirectoryStore } = createTestContext();
    const response = await request(app)
      .get(`/api/v1/providers?categoryId=${categoryId}&q=ವಿದ್ಯುತ್&location=ಧಾರವಾಡ&language=kn&limit=10`)
      .set('Authorization', 'Bearer valid-customer-token');

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].displayName).toBe('Gopal Rao');
    expect(response.body.items[0].location.locality).toBe('ಕುಸುಗಲ್');
    expect(response.body.items[0]).not.toHaveProperty('phoneNumber');
    expect(providerDirectoryStore.searchProviders).toHaveBeenCalledWith({
      language: 'kn',
      categoryId,
      query: 'ವಿದ್ಯುತ್',
      location: 'ಧಾರವಾಡ',
      limit: 10,
      offset: 0,
    });
  });

  it('validates and passes through the Available now search filter', async () => {
    const { app, providerDirectoryStore } = createTestContext();
    const available = await request(app)
      .get('/api/v1/providers?availableNow=true')
      .set('Authorization', 'Bearer valid-customer-token');
    expect(available.status).toBe(200);
    expect(providerDirectoryStore.searchProviders).toHaveBeenCalledWith({
      language: 'en',
      limit: 20,
      offset: 0,
      availableNow: true,
    });

    const allStatuses = await request(app)
      .get('/api/v1/providers?availableNow=false')
      .set('Authorization', 'Bearer valid-customer-token');
    expect(allStatuses.status).toBe(200);
    expect(providerDirectoryStore.searchProviders).toHaveBeenLastCalledWith({
      language: 'en',
      limit: 20,
      offset: 0,
      availableNow: false,
    });

    const invalid = await request(app)
      .get('/api/v1/providers?availableNow=yes')
      .set('Authorization', 'Bearer valid-customer-token');
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe('INVALID_PROVIDER_SEARCH');
  });

  it('returns only an approved public profile and validates provider IDs', async () => {
    const { app, providerDirectoryStore } = createTestContext();
    const invalid = await request(app)
      .get('/api/v1/providers/not-a-uuid')
      .set('Authorization', 'Bearer valid-customer-token');
    expect(invalid.status).toBe(400);
    expect(providerDirectoryStore.getPublicProfile).not.toHaveBeenCalled();

    const detail = await request(app)
      .get(`/api/v1/providers/${providerId}?language=kn`)
      .set('Authorization', 'Bearer valid-customer-token');
    expect(detail.status).toBe(200);
    expect(detail.body.provider.description).toBe('ವಿದ್ಯುತ್ ದುರಸ್ತಿ ಸೇವೆ');
    expect(detail.body.provider.workingHours).toHaveLength(7);
    expect(detail.body.provider).not.toHaveProperty('phoneNumber');
  });

  it('records an authenticated call tap and returns the verified number for the native dialer', async () => {
    const { app, providerDirectoryStore } = createTestContext();
    const response = await request(app)
      .post(`/api/v1/providers/${providerId}/call-intent`)
      .set('Authorization', 'Bearer valid-customer-token');

    expect(response.status).toBe(200);
    expect(response.body.phoneNumber).toBe('+919123456789');
    expect(providerDirectoryStore.recordCallIntent).toHaveBeenCalledWith(providerId);

    const missing = createTestContext();
    vi.mocked(missing.providerDirectoryStore.recordCallIntent).mockResolvedValueOnce(null);
    const notFound = await request(missing.app)
      .post(`/api/v1/providers/${providerId}/call-intent`)
      .set('Authorization', 'Bearer valid-customer-token');
    expect(notFound.status).toBe(404);
    expect(notFound.body.error.code).toBe('PROVIDER_NOT_FOUND');
  });
});
