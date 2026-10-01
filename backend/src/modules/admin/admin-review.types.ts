export type AdminRole = 'SUPER_ADMIN' | 'MODERATOR' | 'SUPPORT';
export type ProviderReviewDecision = 'APPROVE' | 'REJECT';
export type ReviewedProviderStatus = 'ACTIVE' | 'REJECTED';

export interface AdminAccess {
  userId: string;
  role: AdminRole;
  mfaEnrolled: boolean;
}

export interface AdminReviewService {
  id: string;
  slug: string;
  nameEn: string;
  nameKn: string;
  isPrimary: boolean;
}

export interface AdminReviewWorkingHour {
  weekday: number;
  isClosed: boolean;
  opensAt: string | null;
  closesAt: string | null;
}

export interface PendingProviderReview {
  id: string;
  displayName: string;
  businessName: string | null;
  primaryPhoneNumber: string;
  secondaryPhoneNumber: string | null;
  profilePhotoPath: string | null;
  serviceRadiusKm: number;
  experienceYears: number;
  description: string | null;
  locality: string;
  taluk: string | null;
  district: string;
  state: string;
  locationLanguage: 'en' | 'kn';
  services: AdminReviewService[];
  languages: string[];
  workingHours: AdminReviewWorkingHour[];
  submittedAt: string;
}

export interface ProviderReviewResult {
  providerId: string;
  profileStatus: ReviewedProviderStatus;
  decision: ProviderReviewDecision;
  decisionNote: string | null;
  reviewedAt: string;
}

export interface AdminReviewStore {
  getAdminAccess(firebaseUid: string): Promise<AdminAccess | null>;
  listPendingProviderReviews(limit: number, offset: number): Promise<{
    items: PendingProviderReview[];
    total: number;
  }>;
  decideProviderReview(
    firebaseUid: string,
    providerId: string,
    decision: ProviderReviewDecision,
    decisionNote: string | null,
  ): Promise<ProviderReviewResult | null>;
}

export class ProviderReviewNotPendingError extends Error {
  constructor() {
    super('Provider profile is not awaiting review.');
    this.name = 'ProviderReviewNotPendingError';
  }
}

export class ProviderReviewRecordMissingError extends Error {
  constructor() {
    super('The pending provider review record could not be found.');
    this.name = 'ProviderReviewRecordMissingError';
  }
}

export class AdminAccessRequiredError extends Error {
  constructor() {
    super('An enabled administrator account is required.');
    this.name = 'AdminAccessRequiredError';
  }
}

export class AdminPermissionRequiredError extends Error {
  constructor() {
    super('This administrator role cannot review provider profiles.');
    this.name = 'AdminPermissionRequiredError';
  }
}
