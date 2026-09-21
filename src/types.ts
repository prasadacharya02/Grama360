export type Language = 'en' | 'kn';
export type Role = 'customer' | 'provider' | 'admin';

export type AvailabilityStatus = 'AVAILABLE_NOW' | 'BUSY' | 'OFFLINE';
export type VerificationStatus = 'PENDING' | 'PHONE_VERIFIED' | 'GRAMA360_VERIFIED';

/** The three launch pillars (+ transport, because "I need an auto" is the #1 rural request). */
export type CategoryGroup = 'transport' | 'agriculture' | 'home' | 'essential';

export interface User {
  id: string;
  name: string;
  phoneNumber: string; // E.164, e.g. +919845000001
  role: Role;
  language: Language;
  createdAt: string;
  verified: boolean; // phone OTP verified
}

export interface ServiceCategory {
  id: string;
  name: string; // English
  kannadaName: string; // Kannada
  icon: string; // lucide icon key
  group: CategoryGroup;
  /**
   * Words people actually say/type for this service, in English and Kannada.
   * Used by text search, the voice search and the operator desk
   * ("ನನಗೆ ಆಟೋ ಬೇಕು" → auto).
   */
  keywords: string[];
}

export interface Village {
  id: string;
  name: string;
  kannadaName: string;
}

/**
 * A self-registered service provider. One row = one person / one occupation.
 * (A person offering two services registers two profiles.)
 */
export interface ProviderProfile {
  id: string;
  userId: string;
  name: string; // the provider's own name, e.g. "Ravi"
  phoneNumber: string; // what the customer will call
  categoryId: string;
  village: string;
  district: string;
  serviceArea: string[]; // villages they are willing to go to
  experienceYears: number;
  description: string;
  workingHours: string;
  hasWhatsApp: boolean;
  photoUrl: string | null;
  availabilityStatus: AvailabilityStatus;
  verificationStatus: VerificationStatus;
  rating: number; // average 1-5 (0 = no reviews yet)
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  customerId: string;
  providerId: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  providerId: string;
  reason: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'REJECTED';
  createdAt: string;
}

/** How the request reached Grama360. */
export type RequestChannel = 'app' | 'call' | 'whatsapp' | 'walk_in';

/**
 * A service request = one customer need that Grama360 helped with.
 * This is the "Google Sheet" of the pilot: it powers demand analytics
 * and (later) the ₹ commission model.
 */
export interface ServiceRequest {
  id: string;
  channel: RequestChannel;
  callerName: string;
  callerPhone: string;
  village: string;
  categoryId: string | null;
  note: string; // what the person asked for, in their own words
  providerId: string | null; // provider they were connected to
  status: 'OPEN' | 'CONNECTED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export interface AnalyticsSnapshot {
  totalCustomers: number;
  totalProviders: number;
  availableNow: number;
  totalCategories: number;
  pendingVerifications: number;
  openReports: number;
  requestsThisMonth: number;
  topVillage: string;
}
