export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  role: 'customer' | 'provider' | 'admin';
  language: 'en' | 'kn';
  createdAt: string;
  verified: boolean;
}

export interface ServiceCategory {
  id: string;
  name: string;          // English
  kannadaName: string;   // Kannada
  icon: string;          // lucide icon key
}

export interface ProviderProfile {
  id: string;
  userId: string;
  categoryId: string;
  village: string;
  district: string;
  serviceArea: string;
  latitude: number | null;
  longitude: number | null;
  experienceYears: number;
  description: string;
  availabilityStatus: 'AVAILABLE_NOW' | 'BUSY' | 'OFFLINE';
  verificationStatus: 'PENDING' | 'PHONE_VERIFIED' | 'GRAMA360_VERIFIED';
  rating: number;        // average 1-5
  reviewCount: number;
  phoneNumber: string;
  photoUrl: string | null;
  workingHours: string;
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

export interface Notification {
  id: string;
  userId: string;
  message: string;
  messageKn: string;
  type: 'new_review' | 'verification' | 'report_update';
  read: boolean;
  createdAt: string;
}

export interface AnalyticsSnapshot {
  totalCustomers: number;
  totalProviders: number;
  totalCategories: number;
  pendingVerifications: number;
  openReports: number;
  topDistrict: string;
}
