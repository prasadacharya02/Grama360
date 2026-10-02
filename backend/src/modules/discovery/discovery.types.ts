import type { ProviderProfileView } from '../providers/provider.types.js';

export type DiscoveryLanguage = 'en' | 'kn';

export interface ProviderSearchOptions {
  language: DiscoveryLanguage;
  categoryId?: string;
  query?: string;
  location?: string;
  availableNow?: boolean;
  limit: number;
  offset: number;
}

export interface PublicProviderService {
  id: string;
  slug: string;
  name: string;
  isPrimary: boolean;
}

export interface PublicProviderSummary {
  id: string;
  displayName: string;
  businessName: string | null;
  profilePhotoPath: string | null;
  serviceRadiusKm: number;
  experienceYears: number;
  availability: ProviderProfileView['availability'];
  location: {
    locality: string;
    district: string;
    state: string;
    languageCode: DiscoveryLanguage;
  };
  services: PublicProviderService[];
  languages: ProviderProfileView['languages'];
  averageRating: number | null;
  reviewCount: number;
}

export interface PublicProviderProfile extends PublicProviderSummary {
  description: string | null;
  workingHours: ProviderProfileView['workingHours'];
}

export interface ProviderSearchPage {
  items: PublicProviderSummary[];
  hasMore: boolean;
}

export interface ProviderDirectoryStore {
  searchProviders(options: ProviderSearchOptions): Promise<ProviderSearchPage>;
  getPublicProfile(
    providerId: string,
    language: DiscoveryLanguage,
  ): Promise<PublicProviderProfile | null>;
  recordCallIntent(providerId: string): Promise<string | null>;
}
