import type { ProviderProfile, Report, Review, ServiceRequest, User } from '../types';
import { PILOT_DISTRICT } from './catalog';

/**
 * Demo data for the Brahmavara–Mandarthi pilot (Udupi district).
 * All names and numbers are fictional. Real providers register themselves in the app.
 */

export const SEED_USERS: User[] = [
  // customers
  { id: 'u-c1', name: 'Ganapathi Bhat', phoneNumber: '+919900360001', role: 'customer', language: 'kn', createdAt: '2026-08-02T08:00:00Z', verified: true },
  { id: 'u-c2', name: 'Sumithra', phoneNumber: '+919900360002', role: 'customer', language: 'kn', createdAt: '2026-08-05T10:00:00Z', verified: true },
  { id: 'u-c3', name: 'Akash Shetty', phoneNumber: '+919900360003', role: 'customer', language: 'en', createdAt: '2026-08-11T09:30:00Z', verified: true },
  // providers
  { id: 'u-p1', name: 'Ravi', phoneNumber: '+919845360001', role: 'provider', language: 'kn', createdAt: '2026-08-01T07:00:00Z', verified: true },
  { id: 'u-p2', name: 'Mahesh', phoneNumber: '+919845360002', role: 'provider', language: 'kn', createdAt: '2026-08-01T08:00:00Z', verified: true },
  { id: 'u-p3', name: 'Sathish Poojary', phoneNumber: '+919845360003', role: 'provider', language: 'kn', createdAt: '2026-08-03T09:00:00Z', verified: true },
  { id: 'u-p4', name: 'Ganesh Acharya', phoneNumber: '+919845360004', role: 'provider', language: 'kn', createdAt: '2026-08-03T10:00:00Z', verified: true },
  { id: 'u-p5', name: 'Prakash Shetty', phoneNumber: '+919845360005', role: 'provider', language: 'en', createdAt: '2026-08-04T11:00:00Z', verified: true },
  { id: 'u-p6', name: 'Suresh Devadiga', phoneNumber: '+919845360006', role: 'provider', language: 'kn', createdAt: '2026-08-06T07:00:00Z', verified: true },
  { id: 'u-p7', name: 'Naveen Kulal', phoneNumber: '+919845360007', role: 'provider', language: 'kn', createdAt: '2026-08-20T07:00:00Z', verified: true },
  { id: 'u-p8', name: 'Ramesh Poojary', phoneNumber: '+919845360008', role: 'provider', language: 'kn', createdAt: '2026-08-07T07:00:00Z', verified: true },
  { id: 'u-p9', name: 'Krishna Naik', phoneNumber: '+919845360009', role: 'provider', language: 'kn', createdAt: '2026-08-08T07:00:00Z', verified: true },
  { id: 'u-p10', name: 'Shankar Marakala', phoneNumber: '+919845360010', role: 'provider', language: 'kn', createdAt: '2026-08-09T07:00:00Z', verified: true },
  { id: 'u-p11', name: 'Lakshmi Shedthi', phoneNumber: '+919845360011', role: 'provider', language: 'kn', createdAt: '2026-08-10T07:00:00Z', verified: true },
  { id: 'u-p12', name: 'Sujatha Hegde', phoneNumber: '+919845360012', role: 'provider', language: 'en', createdAt: '2026-08-12T07:00:00Z', verified: true },
  { id: 'u-p13', name: 'Deepak Salian', phoneNumber: '+919845360013', role: 'provider', language: 'kn', createdAt: '2026-08-13T07:00:00Z', verified: true },
  { id: 'u-p14', name: 'Vasanthi Poojarthi', phoneNumber: '+919845360014', role: 'provider', language: 'kn', createdAt: '2026-08-14T07:00:00Z', verified: true },
  { id: 'u-p15', name: 'Mohan Shenoy', phoneNumber: '+919845360015', role: 'provider', language: 'kn', createdAt: '2026-08-15T07:00:00Z', verified: true },
  { id: 'u-p16', name: "Anitha D'Souza", phoneNumber: '+919845360016', role: 'provider', language: 'en', createdAt: '2026-08-16T07:00:00Z', verified: true },
  { id: 'u-p17', name: 'Harish Kamath', phoneNumber: '+919845360017', role: 'provider', language: 'kn', createdAt: '2026-09-01T07:00:00Z', verified: true },
  { id: 'u-p18', name: 'Raghu Bangera', phoneNumber: '+919845360018', role: 'provider', language: 'kn', createdAt: '2026-09-10T07:00:00Z', verified: true },
  // admin / operator
  { id: 'u-adm', name: 'Grama360 Operator', phoneNumber: '+919000360360', role: 'admin', language: 'en', createdAt: '2026-07-01T00:00:00Z', verified: true },
];

const at = (d: string) => `${d}T07:00:00Z`;

export const SEED_PROVIDERS: ProviderProfile[] = [
  {
    id: 'pr-1', userId: 'u-p1', name: 'Ravi', phoneNumber: '+919845360001', categoryId: 'auto',
    village: 'Brahmavara', district: PILOT_DISTRICT, serviceArea: ['Brahmavara', 'Mandarthi', 'Kota', 'Barkur'],
    experienceYears: 12, workingHours: '6 AM – 10 PM', hasWhatsApp: true, photoUrl: null,
    description: 'Auto near Brahmavara bus stand. Temple trips to Mandarthi, hospital drops, Udupi railway station.',
    availabilityStatus: 'AVAILABLE_NOW', verificationStatus: 'GRAMA360_VERIFIED', rating: 4.8, reviewCount: 3,
    createdAt: at('2026-08-01'), updatedAt: at('2026-09-20'),
  },
  {
    id: 'pr-2', userId: 'u-p2', name: 'Mahesh', phoneNumber: '+919845360002', categoryId: 'auto',
    village: 'Mandarthi', district: PILOT_DISTRICT, serviceArea: ['Mandarthi', 'Brahmavara', 'Cherkady', 'Neelavara'],
    experienceYears: 7, workingHours: '5 AM – 9 PM', hasWhatsApp: true, photoUrl: null,
    description: 'Auto stand near Mandarthi temple. Early morning trips available for devotees.',
    availabilityStatus: 'AVAILABLE_NOW', verificationStatus: 'PHONE_VERIFIED', rating: 4.5, reviewCount: 1,
    createdAt: at('2026-08-01'), updatedAt: at('2026-09-21'),
  },
  {
    id: 'pr-3', userId: 'u-p3', name: 'Sathish Poojary', phoneNumber: '+919845360003', categoryId: 'auto',
    village: 'Kota', district: PILOT_DISTRICT, serviceArea: ['Kota', 'Saligrama', 'Brahmavara'],
    experienceYears: 15, workingHours: '6 AM – 8 PM', hasWhatsApp: false, photoUrl: null,
    description: 'Kota auto stand. Also does small goods drops.',
    availabilityStatus: 'BUSY', verificationStatus: 'GRAMA360_VERIFIED', rating: 4.2, reviewCount: 1,
    createdAt: at('2026-08-03'), updatedAt: at('2026-09-21'),
  },
  {
    id: 'pr-4', userId: 'u-p4', name: 'Ganesh Acharya', phoneNumber: '+919845360004', categoryId: 'electrician',
    village: 'Brahmavara', district: PILOT_DISTRICT, serviceArea: ['Brahmavara', 'Mandarthi', 'Handadi', 'Kokkarne'],
    experienceYears: 18, workingHours: '8 AM – 7 PM', hasWhatsApp: true, photoUrl: null,
    description: 'House wiring, fan and light repair, pump-set connections, inverter setup. MESCOM approved.',
    availabilityStatus: 'AVAILABLE_NOW', verificationStatus: 'GRAMA360_VERIFIED', rating: 4.9, reviewCount: 2,
    createdAt: at('2026-08-03'), updatedAt: at('2026-09-20'),
  },
  {
    id: 'pr-5', userId: 'u-p5', name: 'Prakash Shetty', phoneNumber: '+919845360005', categoryId: 'electrician',
    village: 'Mandarthi', district: PILOT_DISTRICT, serviceArea: ['Mandarthi', 'Cherkady', 'Neelavara'],
    experienceYears: 6, workingHours: '9 AM – 6 PM', hasWhatsApp: true, photoUrl: null,
    description: 'Electrical repairs and new connections. Solar water heater installation.',
    availabilityStatus: 'BUSY', verificationStatus: 'PHONE_VERIFIED', rating: 4.3, reviewCount: 1,
    createdAt: at('2026-08-04'), updatedAt: at('2026-09-21'),
  },
  {
    id: 'pr-6', userId: 'u-p6', name: 'Suresh Devadiga', phoneNumber: '+919845360006', categoryId: 'plumber',
    village: 'Barkur', district: PILOT_DISTRICT, serviceArea: ['Barkur', 'Brahmavara', 'Kota', 'Hosala'],
    experienceYears: 10, workingHours: '7 AM – 6 PM', hasWhatsApp: true, photoUrl: null,
    description: 'Pipeline, tap and tank work. Borewell connection and leak repair. Quick response.',
    availabilityStatus: 'AVAILABLE_NOW', verificationStatus: 'GRAMA360_VERIFIED', rating: 4.6, reviewCount: 1,
    createdAt: at('2026-08-06'), updatedAt: at('2026-09-19'),
  },
  {
    id: 'pr-7', userId: 'u-p7', name: 'Naveen Kulal', phoneNumber: '+919845360007', categoryId: 'plumber',
    village: 'Saligrama', district: PILOT_DISTRICT, serviceArea: ['Saligrama', 'Kota'],
    experienceYears: 3, workingHours: '8 AM – 6 PM', hasWhatsApp: true, photoUrl: null,
    description: 'Bathroom fittings and pipe repair.',
    availabilityStatus: 'OFFLINE', verificationStatus: 'PENDING', rating: 0, reviewCount: 0,
    createdAt: at('2026-08-20'), updatedAt: at('2026-09-18'),
  },
  {
    id: 'pr-8', userId: 'u-p8', name: 'Ramesh Poojary', phoneNumber: '+919845360008', categoryId: 'tractor',
    village: 'Mandarthi', district: PILOT_DISTRICT, serviceArea: ['Mandarthi', 'Cherkady', 'Neelavara', 'Brahmavara', 'Handadi'],
    experienceYears: 14, workingHours: '5 AM – 7 PM', hasWhatsApp: true, photoUrl: null,
    description: 'Tractor with rotavator and power tiller. Paddy field ploughing, per-hour rates.',
    availabilityStatus: 'AVAILABLE_NOW', verificationStatus: 'GRAMA360_VERIFIED', rating: 4.9, reviewCount: 2,
    createdAt: at('2026-08-07'), updatedAt: at('2026-09-21'),
  },
  {
    id: 'pr-9', userId: 'u-p9', name: 'Krishna Naik', phoneNumber: '+919845360009', categoryId: 'climber',
    village: 'Kokkarne', district: PILOT_DISTRICT, serviceArea: ['Kokkarne', 'Handadi', 'Brahmavara', 'Mandarthi'],
    experienceYears: 20, workingHours: '6 AM – 5 PM', hasWhatsApp: false, photoUrl: null,
    description: 'Coconut and arecanut harvesting, tree cleaning. Uses climbing machine.',
    availabilityStatus: 'AVAILABLE_NOW', verificationStatus: 'GRAMA360_VERIFIED', rating: 4.7, reviewCount: 1,
    createdAt: at('2026-08-08'), updatedAt: at('2026-09-20'),
  },
  {
    id: 'pr-10', userId: 'u-p10', name: 'Shankar Marakala', phoneNumber: '+919845360010', categoryId: 'carpenter',
    village: 'Handadi', district: PILOT_DISTRICT, serviceArea: ['Handadi', 'Brahmavara', 'Kokkarne'],
    experienceYears: 9, workingHours: '9 AM – 6 PM', hasWhatsApp: true, photoUrl: null,
    description: 'Doors, windows, cots and furniture repair. Own workshop in Handadi.',
    availabilityStatus: 'BUSY', verificationStatus: 'PHONE_VERIFIED', rating: 4.1, reviewCount: 1,
    createdAt: at('2026-08-09'), updatedAt: at('2026-09-21'),
  },
  {
    id: 'pr-11', userId: 'u-p11', name: 'Lakshmi Shedthi', phoneNumber: '+919845360011', categoryId: 'tailor',
    village: 'Brahmavara', district: PILOT_DISTRICT, serviceArea: ['Brahmavara'],
    experienceYears: 11, workingHours: '10 AM – 7 PM', hasWhatsApp: true, photoUrl: null,
    description: 'Blouse, churidar and school uniform stitching. Alterations same day.',
    availabilityStatus: 'AVAILABLE_NOW', verificationStatus: 'PHONE_VERIFIED', rating: 4.4, reviewCount: 1,
    createdAt: at('2026-08-10'), updatedAt: at('2026-09-20'),
  },
  {
    id: 'pr-12', userId: 'u-p12', name: 'Sujatha Hegde', phoneNumber: '+919845360012', categoryId: 'tutor',
    village: 'Kota', district: PILOT_DISTRICT, serviceArea: ['Kota', 'Saligrama', 'Brahmavara'],
    experienceYears: 8, workingHours: '4 PM – 8 PM', hasWhatsApp: true, photoUrl: null,
    description: 'Maths and Science tuition for classes 6–10 (SSLC). Home tuition or small batches.',
    availabilityStatus: 'AVAILABLE_NOW', verificationStatus: 'GRAMA360_VERIFIED', rating: 4.8, reviewCount: 1,
    createdAt: at('2026-08-12'), updatedAt: at('2026-09-19'),
  },
  {
    id: 'pr-13', userId: 'u-p13', name: 'Deepak Salian', phoneNumber: '+919845360013', categoryId: 'mechanic',
    village: 'Brahmavara', district: PILOT_DISTRICT, serviceArea: ['Brahmavara', 'Mandarthi', 'Barkur'],
    experienceYears: 12, workingHours: '9 AM – 8 PM', hasWhatsApp: true, photoUrl: null,
    description: 'Two-wheeler service and repair. Roadside puncture help near Brahmavara.',
    availabilityStatus: 'AVAILABLE_NOW', verificationStatus: 'PHONE_VERIFIED', rating: 4.3, reviewCount: 0,
    createdAt: at('2026-08-13'), updatedAt: at('2026-09-21'),
  },
  {
    id: 'pr-14', userId: 'u-p14', name: 'Vasanthi Poojarthi', phoneNumber: '+919845360014', categoryId: 'labour',
    village: 'Cherkady', district: PILOT_DISTRICT, serviceArea: ['Cherkady', 'Mandarthi', 'Neelavara'],
    experienceYears: 15, workingHours: '7 AM – 4 PM', hasWhatsApp: false, photoUrl: null,
    description: 'Team of 6 for paddy planting, weeding and harvesting. Book one day in advance.',
    availabilityStatus: 'AVAILABLE_NOW', verificationStatus: 'GRAMA360_VERIFIED', rating: 4.6, reviewCount: 1,
    createdAt: at('2026-08-14'), updatedAt: at('2026-09-20'),
  },
  {
    id: 'pr-15', userId: 'u-p15', name: 'Sri Durga Stores (Mohan Shenoy)', phoneNumber: '+919845360015', categoryId: 'shop',
    village: 'Mandarthi', district: PILOT_DISTRICT, serviceArea: ['Mandarthi', 'Cherkady'],
    experienceYears: 22, workingHours: '7 AM – 9 PM', hasWhatsApp: true, photoUrl: null,
    description: 'Provisions, vegetables, pooja items. Free home delivery within Mandarthi on WhatsApp order.',
    availabilityStatus: 'AVAILABLE_NOW', verificationStatus: 'GRAMA360_VERIFIED', rating: 4.5, reviewCount: 0,
    createdAt: at('2026-08-15'), updatedAt: at('2026-09-21'),
  },
  {
    id: 'pr-16', userId: 'u-p16', name: "Anitha D'Souza", phoneNumber: '+919845360016', categoryId: 'eldercare',
    village: 'Brahmavara', district: PILOT_DISTRICT, serviceArea: ['Brahmavara', 'Barkur', 'Kota'],
    experienceYears: 6, workingHours: '8 AM – 8 PM', hasWhatsApp: true, photoUrl: null,
    description: 'Trained home nurse. Elderly care visits, medicine reminders, hospital accompaniment.',
    availabilityStatus: 'BUSY', verificationStatus: 'GRAMA360_VERIFIED', rating: 5, reviewCount: 1,
    createdAt: at('2026-08-16'), updatedAt: at('2026-09-21'),
  },
  {
    id: 'pr-17', userId: 'u-p17', name: 'Harish Kamath', phoneNumber: '+919845360017', categoryId: 'appliance',
    village: 'Brahmavara', district: PILOT_DISTRICT, serviceArea: ['Brahmavara', 'Mandarthi', 'Kota', 'Saligrama'],
    experienceYears: 9, workingHours: '10 AM – 7 PM', hasWhatsApp: true, photoUrl: null,
    description: 'Fridge, washing machine, mixer and TV repair at your home.',
    availabilityStatus: 'OFFLINE', verificationStatus: 'PHONE_VERIFIED', rating: 0, reviewCount: 0,
    createdAt: at('2026-09-01'), updatedAt: at('2026-09-21'),
  },
  {
    id: 'pr-18', userId: 'u-p18', name: 'Raghu Bangera', phoneNumber: '+919845360018', categoryId: 'pump',
    village: 'Neelavara', district: PILOT_DISTRICT, serviceArea: ['Neelavara', 'Mandarthi', 'Cherkady', 'Kokkarne'],
    experienceYears: 5, workingHours: '8 AM – 6 PM', hasWhatsApp: true, photoUrl: null,
    description: 'Pump-set and submersible motor repair, borewell motor rewinding.',
    availabilityStatus: 'AVAILABLE_NOW', verificationStatus: 'PENDING', rating: 0, reviewCount: 0,
    createdAt: at('2026-09-10'), updatedAt: at('2026-09-21'),
  },
];

export const SEED_REVIEWS: Review[] = [
  { id: 'r1', customerId: 'u-c1', providerId: 'pr-1', customerName: 'Ganapathi Bhat', rating: 5, comment: 'ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿ ಬಂದರು. ಮಂದಾರ್ತಿ ದೇವಸ್ಥಾನಕ್ಕೆ ಒಳ್ಳೆಯ ಪ್ರಯಾಣ.', createdAt: '2026-09-02T10:00:00Z' },
  { id: 'r2', customerId: 'u-c3', providerId: 'pr-1', customerName: 'Akash Shetty', rating: 5, comment: 'Reliable auto for early morning railway station drop.', createdAt: '2026-09-08T05:30:00Z' },
  { id: 'r3', customerId: 'u-c2', providerId: 'pr-1', customerName: 'Sumithra', rating: 4, comment: 'ಒಳ್ಳೆಯ ಚಾಲಕ, ಸರಿಯಾದ ದರ.', createdAt: '2026-09-15T11:30:00Z' },
  { id: 'r4', customerId: 'u-c2', providerId: 'pr-2', customerName: 'Sumithra', rating: 4, comment: 'ದೇವಸ್ಥಾನದ ಹತ್ತಿರ ಬೇಗ ಸಿಕ್ಕರು.', createdAt: '2026-09-10T08:00:00Z' },
  { id: 'r5', customerId: 'u-c1', providerId: 'pr-3', customerName: 'Ganapathi Bhat', rating: 4, comment: 'Good for Kota to Brahmavara trips.', createdAt: '2026-09-11T09:00:00Z' },
  { id: 'r6', customerId: 'u-c1', providerId: 'pr-4', customerName: 'Ganapathi Bhat', rating: 5, comment: 'ಪಂಪ್‌ಸೆಟ್ ವೈರಿಂಗ್ ಒಂದೇ ಗಂಟೆಯಲ್ಲಿ ಸರಿಪಡಿಸಿದರು.', createdAt: '2026-09-05T14:00:00Z' },
  { id: 'r7', customerId: 'u-c3', providerId: 'pr-4', customerName: 'Akash Shetty', rating: 5, comment: 'Neat wiring work, fair price.', createdAt: '2026-09-12T14:00:00Z' },
  { id: 'r8', customerId: 'u-c2', providerId: 'pr-5', customerName: 'Sumithra', rating: 4, comment: 'Fixed the fan the same day.', createdAt: '2026-09-13T14:00:00Z' },
  { id: 'r9', customerId: 'u-c3', providerId: 'pr-6', customerName: 'Akash Shetty', rating: 5, comment: 'Came within an hour for a burst pipe.', createdAt: '2026-09-09T12:00:00Z' },
  { id: 'r10', customerId: 'u-c1', providerId: 'pr-8', customerName: 'Ganapathi Bhat', rating: 5, comment: 'ಗದ್ದೆ ಉಳುಮೆ ಚೆನ್ನಾಗಿ ಮಾಡಿದರು. ದರ ನ್ಯಾಯಯುತ.', createdAt: '2026-09-01T09:00:00Z' },
  { id: 'r11', customerId: 'u-c2', providerId: 'pr-8', customerName: 'Sumithra', rating: 5, comment: 'Tractor arrived on time for planting season.', createdAt: '2026-09-14T09:00:00Z' },
  { id: 'r12', customerId: 'u-c1', providerId: 'pr-9', customerName: 'Ganapathi Bhat', rating: 5, comment: 'ತೆಂಗಿನ ಮರ ಎಲ್ಲಾ ಒಂದೇ ದಿನದಲ್ಲಿ ಕೊಯ್ಲು ಮಾಡಿದರು.', createdAt: '2026-09-06T09:00:00Z' },
  { id: 'r13', customerId: 'u-c3', providerId: 'pr-10', customerName: 'Akash Shetty', rating: 4, comment: 'Good door repair, slightly late.', createdAt: '2026-09-07T09:00:00Z' },
  { id: 'r14', customerId: 'u-c2', providerId: 'pr-11', customerName: 'Sumithra', rating: 4, comment: 'ರವಿಕೆ ಹೊಲಿಗೆ ಚೆನ್ನಾಗಿದೆ.', createdAt: '2026-09-16T09:00:00Z' },
  { id: 'r15', customerId: 'u-c3', providerId: 'pr-12', customerName: 'Akash Shetty', rating: 5, comment: 'My brother improved a lot in Maths.', createdAt: '2026-09-17T09:00:00Z' },
  { id: 'r16', customerId: 'u-c1', providerId: 'pr-14', customerName: 'Ganapathi Bhat', rating: 5, comment: 'ನಾಟಿ ಕೆಲಸಕ್ಕೆ ಉತ್ತಮ ತಂಡ.', createdAt: '2026-09-03T09:00:00Z' },
  { id: 'r17', customerId: 'u-c2', providerId: 'pr-16', customerName: 'Sumithra', rating: 5, comment: 'Took great care of my mother during hospital visit.', createdAt: '2026-09-18T09:00:00Z' },
];

export const SEED_REPORTS: Report[] = [
  { id: 'rep-1', reporterId: 'u-c3', reporterName: 'Akash Shetty', providerId: 'pr-7', reason: 'Number was switched off for three days.', status: 'OPEN', createdAt: '2026-09-18T08:00:00Z' },
];

export const SEED_REQUESTS: ServiceRequest[] = [
  { id: 'req-1', channel: 'call', callerName: 'Sheena Shetty', callerPhone: '+919900360101', village: 'Mandarthi', categoryId: 'tractor', note: 'ನನಗೆ ಟ್ರ್ಯಾಕ್ಟರ್ ಬೇಕು – ನಾಳೆ ಬೆಳಗ್ಗೆ', providerId: 'pr-8', status: 'COMPLETED', createdAt: '2026-09-14T06:40:00Z' },
  { id: 'req-2', channel: 'whatsapp', callerName: 'Sumithra', callerPhone: '+919900360002', village: 'Brahmavara', categoryId: 'plumber', note: 'ನನ್ನ ಮನೆಗೆ ಪ್ಲಂಬರ್ ಬೇಕು', providerId: 'pr-6', status: 'COMPLETED', createdAt: '2026-09-15T09:10:00Z' },
  { id: 'req-3', channel: 'walk_in', callerName: 'Padmavathi', callerPhone: '', village: 'Kota', categoryId: 'eldercare', note: 'Elderly mother needs help for hospital visit on Monday', providerId: 'pr-16', status: 'CONNECTED', createdAt: '2026-09-18T11:00:00Z' },
  { id: 'req-4', channel: 'app', callerName: 'Akash Shetty', callerPhone: '+919900360003', village: 'Brahmavara', categoryId: 'auto', note: 'Auto to Udupi station 5 AM', providerId: 'pr-1', status: 'COMPLETED', createdAt: '2026-09-19T17:30:00Z' },
  { id: 'req-5', channel: 'call', callerName: 'Devaki', callerPhone: '+919900360105', village: 'Handadi', categoryId: 'climber', note: 'ತೆಂಗಿನಕಾಯಿ ಕೀಳಲು ಜನ ಬೇಕು', providerId: 'pr-9', status: 'CONNECTED', createdAt: '2026-09-20T08:15:00Z' },
  { id: 'req-6', channel: 'call', callerName: 'Unknown caller', callerPhone: '+919900360106', village: 'Saligrama', categoryId: 'appliance', note: 'Fridge not cooling', providerId: null, status: 'OPEN', createdAt: '2026-09-21T07:50:00Z' },
];
