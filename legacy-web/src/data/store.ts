import type {
  User, ServiceCategory, ProviderProfile, Review, Report, AnalyticsSnapshot
} from '../types';

export const CATEGORY_MAP: ServiceCategory[] = [
  { id: 'auto', name: 'Auto Driver', kannadaName: 'ಆಟೋ ಚಾಲಕ', icon: 'Car' },
  { id: 'electrician', name: 'Electrician', kannadaName: 'ವಿದ್ಯುತ್ ಕೆಲಸ', icon: 'Zap' },
  { id: 'plumber', name: 'Plumber', kannadaName: 'ಪ್ಲಂಬರ್', icon: 'Droplets' },
  { id: 'carpenter', name: 'Carpenter', kannadaName: 'ಮರಗೆಲಸ', icon: 'Hammer' },
  { id: 'mechanic', name: 'Mechanic', kannadaName: 'ಮೆಕಾನಿಕ್', icon: 'Wrench' },
  { id: 'farmer', name: 'Farmer Services', kannadaName: 'ಕೃಷಿ ಸೇವೆ', icon: 'Tractor' },
  { id: 'tractor', name: 'Tractor Services', kannadaName: 'ಟ್ರಾಕ್ಟರ್ ಸೇವೆ', icon: 'Tractor' },
  { id: 'tutor', name: 'Tutor', kannadaName: 'ಶಿಕ್ಷಕ', icon: 'BookOpen' },
  { id: 'shop', name: 'Shop', kannadaName: 'ಅಂಗಡಿ', icon: 'Store' },
];

export const MOCK_USERS: User[] = [
  { id: 'u-c1', name: 'Basavaraj', phoneNumber: '+919876543210', role: 'customer', language: 'en', createdAt: '2025-01-10T08:00:00Z', verified: true },
  { id: 'u-c2', name: 'Ramesh', phoneNumber: '+919123456789', role: 'customer', language: 'kn', createdAt: '2025-02-20T10:00:00Z', verified: true },
  { id: 'u-c3', name: 'Lakshmi', phoneNumber: '+919876500001', role: 'customer', language: 'en', createdAt: '2025-03-05T09:30:00Z', verified: false },
  { id: 'u-p1', name: 'Shivanna', phoneNumber: '+919876543211', role: 'provider', language: 'kn', createdAt: '2025-01-05T07:00:00Z', verified: true },
  { id: 'u-p2', name: 'Manjunath', phoneNumber: '+919876543212', role: 'provider', language: 'en', createdAt: '2025-01-15T08:00:00Z', verified: true },
  { id: 'u-p3', name: 'Geetha', phoneNumber: '+919876543213', role: 'provider', language: 'kn', createdAt: '2025-02-01T09:00:00Z', verified: true },
  { id: 'u-p4', name: 'Venkat', phoneNumber: '+919876543214', role: 'provider', language: 'en', createdAt: '2025-02-10T10:00:00Z', verified: false },
  { id: 'u-p5', name: 'Ravi', phoneNumber: '+919876543215', role: 'provider', language: 'kn', createdAt: '2025-03-01T11:00:00Z', verified: true },
  { id: 'u-adm', name: 'Admin', phoneNumber: '+919987654321', role: 'admin', language: 'en', createdAt: '2024-11-01T00:00:00Z', verified: true },
];

export const MOCK_PROVIDERS: ProviderProfile[] = [
  {
    id: 'pr-1', userId: 'u-p1', categoryId: 'auto',
    village: 'Kanakapura', district: 'Ramanagara',
    serviceArea: 'Kanakapura, Dodballapur, Harohalli',
    latitude: 12.54, longitude: 77.42,
    experienceYears: 15, description: 'Experienced auto driver serving Kanakapura and nearby villages. Always available for airport and railway station trips.',
    availabilityStatus: 'AVAILABLE_NOW', verificationStatus: 'GRAMA360_VERIFIED', rating: 4.8, reviewCount: 42,
    phoneNumber: '+919876543211', photoUrl: null, workingHours: '6 AM - 10 PM',
    createdAt: '2025-01-05T07:00:00Z', updatedAt: '2025-06-01T08:00:00Z',
  },
  {
    id: 'pr-2', userId: 'u-p2', categoryId: 'electrician',
    village: 'Magadi', district: 'Ramanagara',
    serviceArea: 'Magadi, Channapatna',
    latitude: 12.96, longitude: 77.21,
    experienceYears: 22, description: 'Licensed electrician for homes and farms. Handles wiring, pump sets, solar installation.',
    availabilityStatus: 'BUSY', verificationStatus: 'PHONE_VERIFIED', rating: 4.5, reviewCount: 28,
    phoneNumber: '+919876543212', photoUrl: null, workingHours: '8 AM - 7 PM',
    createdAt: '2025-01-15T08:00:00Z', updatedAt: '2025-06-02T09:30:00Z',
  },
  {
    id: 'pr-3', userId: 'u-p3', categoryId: 'plumber',
    village: 'Channapatna', district: 'Ramanagara',
    serviceArea: 'Channapatna, Kanakapura, Magadi',
    latitude: 12.65, longitude: 77.20,
    experienceYears: 8, description: 'Reliable plumbing for borewells, water tanks, farm pipelines. Quick response.',
    availabilityStatus: 'AVAILABLE_NOW', verificationStatus: 'GRAMA360_VERIFIED', rating: 4.2, reviewCount: 15,
    phoneNumber: '+919876543213', photoUrl: null, workingHours: '7 AM - 6 PM',
    createdAt: '2025-02-01T09:00:00Z', updatedAt: '2025-05-28T07:15:00Z',
  },
  {
    id: 'pr-4', userId: 'u-p4', categoryId: 'carpenter',
    village: 'Harohalli', district: 'Ramanagara',
    serviceArea: 'Harohalli, Kanakapura',
    latitude: 12.52, longitude: 77.35,
    experienceYears: 5, description: 'Custom woodwork, furniture repair, door and window frames.',
    availabilityStatus: 'OFFLINE', verificationStatus: 'PENDING', rating: 3.9, reviewCount: 3,
    phoneNumber: '+919876543214', photoUrl: null, workingHours: '9 AM - 5 PM',
    createdAt: '2025-02-10T10:00:00Z', updatedAt: '2025-06-01T06:00:00Z',
  },
  {
    id: 'pr-5', userId: 'u-p5', categoryId: 'tractor',
    village: 'Dodballapur', district: 'Bangalore Rural',
    serviceArea: 'Dodballapur, Devanahalli, Hoskote',
    latitude: 13.28, longitude: 77.57,
    experienceYears: 12, description: 'Own tractor with rotavator and plough. Rent by hour or day. Experience with paddy and ragi fields.',
    availabilityStatus: 'AVAILABLE_NOW', verificationStatus: 'GRAMA360_VERIFIED', rating: 4.9, reviewCount: 36,
    phoneNumber: '+919876543215', photoUrl: null, workingHours: '5 AM - 8 PM',
    createdAt: '2025-03-01T11:00:00Z', updatedAt: '2025-05-30T05:30:00Z',
  },
  {
    id: 'pr-6', userId: 'u-p1', categoryId: 'mechanic',
    village: 'Kanakapura', district: 'Ramanagara',
    serviceArea: 'Kanakapura, Sathanur',
    latitude: 12.54, longitude: 77.42,
    experienceYears: 10, description: 'Motorcycle and small engine repair. Pump set repair specialist.',
    availabilityStatus: 'BUSY', verificationStatus: 'PHONE_VERIFIED', rating: 4.0, reviewCount: 9,
    phoneNumber: '+919876543211', photoUrl: null, workingHours: '6 AM - 9 PM',
    createdAt: '2025-01-05T07:00:00Z', updatedAt: '2025-06-01T08:00:00Z',
  },
];

export const MOCK_REVIEWS: Review[] = [
  { id: 'r1', customerId: 'u-c1', providerId: 'pr-1', customerName: 'Basavaraj', rating: 5, comment: 'Very timely and polite. Best auto in Kanakapura.', createdAt: '2025-05-15T10:00:00Z' },
  { id: 'r2', customerId: 'u-c2', providerId: 'pr-1', customerName: 'Ramesh', rating: 4, comment: 'Good driver, knows all nearby villages.', createdAt: '2025-05-20T11:30:00Z' },
  { id: 'r3', customerId: 'u-c1', providerId: 'pr-5', customerName: 'Basavaraj', rating: 5, comment: 'Tractor was clean and worked perfectly for my fields.', createdAt: '2025-04-28T09:00:00Z' },
  { id: 'r4', customerId: 'u-c2', providerId: 'pr-2', customerName: 'Ramesh', rating: 4, comment: 'Fixed our pump wiring very quickly.', createdAt: '2025-06-01T14:00:00Z' },
];

export const MOCK_REPORTS: Report[] = [
  { id: 'rep-1', reporterId: 'u-c3', reporterName: 'Lakshmi', providerId: 'pr-4', reason: 'Profile photo looks fake. Could not reach number.', status: 'OPEN', createdAt: '2025-06-02T08:00:00Z' },
];

export const MOCK_ANALYTICS: AnalyticsSnapshot = {
  totalCustomers: 124,
  totalProviders: 87,
  totalCategories: 9,
  pendingVerifications: 14,
  openReports: 1,
  topDistrict: 'Ramanagara',
};
