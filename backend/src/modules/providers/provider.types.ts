export type ProviderProfileStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'ACTIVE'
  | 'REJECTED'
  | 'SUSPENDED';
export type SpokenLanguage = 'kn' | 'en' | 'tcy';
export type LocationLanguage = 'kn' | 'en';
export type ProviderAvailability = 'AVAILABLE' | 'BUSY' | 'OFFLINE';

export interface ProviderWorkingHourInput {
  weekday: number;
  opensAt: string | null;
  closesAt: string | null;
  isClosed: boolean;
}

export interface ProviderRegistrationInput {
  displayName: string;
  businessName: string | null;
  secondaryPhoneNumber: string | null;
  serviceRadiusKm: number;
  experienceYears: number;
  description: string | null;
  profilePhotoPath: string | null;
  serviceIds: string[];
  languages: SpokenLanguage[];
  location: {
    locality: string;
    taluk: string | null;
    district: string;
    languageCode: LocationLanguage;
  };
  workingHours: ProviderWorkingHourInput[];
}

export interface ProviderProfileView {
  id: string;
  displayName: string;
  businessName: string | null;
  secondaryPhoneNumber: string | null;
  serviceRadiusKm: number;
  experienceYears: number;
  description: string | null;
  profilePhotoPath: string | null;
  profileStatus: ProviderProfileStatus;
  reviewNote: string | null;
  availability: ProviderAvailability;
  location: {
    locality: string;
    taluk: string | null;
    district: string;
    state: string;
    languageCode: LocationLanguage;
  };
  services: Array<{
    id: string;
    slug: string;
    name: string;
    isPrimary: boolean;
  }>;
  languages: SpokenLanguage[];
  workingHours: ProviderWorkingHourInput[];
}

export interface ProviderStore {
  createProfile(firebaseUid: string, input: ProviderRegistrationInput): Promise<ProviderProfileView>;
  getMyProfile(firebaseUid: string): Promise<ProviderProfileView | null>;
  updateProfile(firebaseUid: string, input: ProviderRegistrationInput): Promise<ProviderProfileView | null>;
  setAvailability(
    firebaseUid: string,
    availability: ProviderAvailability,
  ): Promise<ProviderProfileView | null>;
}

export class ProviderRoleRequiredError extends Error {
  constructor() {
    super('An active provider role is required.');
    this.name = 'ProviderRoleRequiredError';
  }
}

export class ProviderAlreadyExistsError extends Error {
  constructor() {
    super('A provider profile already exists.');
    this.name = 'ProviderAlreadyExistsError';
  }
}

export class ProviderProfileLockedError extends Error {
  constructor() {
    super('This provider profile cannot be edited in its current state.');
    this.name = 'ProviderProfileLockedError';
  }
}

export class ProviderCategoriesInvalidError extends Error {
  constructor() {
    super('One or more service categories are unavailable.');
    this.name = 'ProviderCategoriesInvalidError';
  }
}

export class ProviderSecondaryPhoneError extends Error {
  constructor() {
    super('Secondary phone number cannot be the verified account number.');
    this.name = 'ProviderSecondaryPhoneError';
  }
}

export class ProviderAvailabilityNotEditableError extends Error {
  constructor() {
    super('Only approved provider profiles can update availability.');
    this.name = 'ProviderAvailabilityNotEditableError';
  }
}
