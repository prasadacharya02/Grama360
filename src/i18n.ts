import type { AvailabilityStatus, Language, RequestChannel, VerificationStatus } from './types';

/**
 * UI strings in English and Kannada.
 * Kannada copy is written for rural users: short, plain, spoken-style words.
 */
const STRINGS = {
  // ── Brand ────────────────────────────────────────────────
  appName: { en: 'Grama360', kn: 'ಗ್ರಾಮ360' },
  tagline: { en: 'Your village services, one contact.', kn: 'ನಿಮ್ಮ ಊರಿನ ಸೇವೆಗಳು ಒಂದೇ ಸಂಪರ್ಕದಲ್ಲಿ.' },
  helplineLine: { en: 'Any service you need — call Grama360.', kn: 'ಯಾವುದೇ ಸೇವೆ ಬೇಕಾದರೆ ಗ್ರಾಮ360ಗೆ ಕರೆ ಮಾಡಿ.' },
  getStarted: { en: 'Get started', kn: 'ಆರಂಭಿಸಿ' },
  pilotRegion: { en: 'Pilot: Brahmavara – Mandarthi, Udupi', kn: 'ಪ್ರಾಯೋಗಿಕ: ಬ್ರಹ್ಮಾವರ – ಮಂದಾರ್ತಿ, ಉಡುಪಿ' },

  // ── Language ─────────────────────────────────────────────
  selectLanguage: { en: 'Select language', kn: 'ಭಾಷೆ ಆಯ್ಕೆ ಮಾಡಿ' },
  continue: { en: 'Continue', kn: 'ಮುಂದುವರಿಸಿ' },
  changeAnytime: { en: 'You can change this anytime from the top bar.', kn: 'ಮೇಲಿನ ಪಟ್ಟಿಯಿಂದ ಯಾವಾಗ ಬೇಕಾದರೂ ಬದಲಾಯಿಸಬಹುದು.' },

  // ── Auth ─────────────────────────────────────────────────
  phoneLogin: { en: 'Login with phone', kn: 'ಫೋನ್ ನಂಬರ್‌ನಿಂದ ಲಾಗಿನ್' },
  noEmail: { en: 'No email needed. Just your mobile number.', kn: 'ಇಮೇಲ್ ಬೇಡ. ನಿಮ್ಮ ಮೊಬೈಲ್ ನಂಬರ್ ಸಾಕು.' },
  phoneNumber: { en: 'Mobile number', kn: 'ಮೊಬೈಲ್ ನಂಬರ್' },
  sendOtp: { en: 'Send OTP', kn: 'OTP ಕಳುಹಿಸಿ' },
  enterOtp: { en: 'Enter OTP', kn: 'OTP ನಮೂದಿಸಿ' },
  otpSentTo: { en: 'We sent a 6-digit code to {phone}', kn: '{phone} ಗೆ 6 ಅಂಕಿಯ ಕೋಡ್ ಕಳುಹಿಸಿದ್ದೇವೆ' },
  verifyContinue: { en: 'Verify & continue', kn: 'ಪರಿಶೀಲಿಸಿ ಮುಂದುವರಿಸಿ' },
  changeNumber: { en: 'Change number', kn: 'ನಂಬರ್ ಬದಲಾಯಿಸಿ' },
  invalidPhone: { en: 'Please enter a valid 10-digit mobile number.', kn: 'ಸರಿಯಾದ 10 ಅಂಕಿಯ ಮೊಬೈಲ್ ನಂಬರ್ ನಮೂದಿಸಿ.' },
  invalidOtp: { en: 'Wrong OTP. For the demo use 123456.', kn: 'OTP ತಪ್ಪಾಗಿದೆ. ಡೆಮೊಗೆ 123456 ಬಳಸಿ.' },
  otpDemoSent: { en: 'OTP sent (demo code: 123456)', kn: 'OTP ಕಳುಹಿಸಲಾಗಿದೆ (ಡೆಮೊ ಕೋಡ್: 123456)' },
  iAmA: { en: 'I am a…', kn: 'ನಾನು…' },
  chooseRole: { en: 'Choose how you want to use Grama360', kn: 'ಗ್ರಾಮ360 ಅನ್ನು ಹೇಗೆ ಬಳಸಬೇಕು ಆಯ್ಕೆ ಮಾಡಿ' },
  roleCustomer: { en: 'Customer', kn: 'ಗ್ರಾಹಕ' },
  roleCustomerDesc: { en: 'I need a service near me', kn: 'ನನಗೆ ಸೇವೆ ಬೇಕು' },
  roleProvider: { en: 'Service Provider', kn: 'ಸೇವೆ ನೀಡುವವರು' },
  roleProviderDesc: { en: 'I offer a service (auto, electrician, tractor…)', kn: 'ನಾನು ಸೇವೆ ನೀಡುತ್ತೇನೆ (ಆಟೋ, ಎಲೆಕ್ಟ್ರಿಷಿಯನ್, ಟ್ರ್ಯಾಕ್ಟರ್…)' },
  demoHint: { en: 'Demo: any number works, OTP is 123456', kn: 'ಡೆಮೊ: ಯಾವುದೇ ನಂಬರ್ ಬಳಸಿ, OTP 123456' },
  quickDemo: { en: 'Quick demo logins', kn: 'ತ್ವರಿತ ಡೆಮೊ ಲಾಗಿನ್' },
  demoCustomer: { en: 'Customer', kn: 'ಗ್ರಾಹಕ' },
  demoProvider: { en: 'Provider (Ravi, auto)', kn: 'ಸೇವಾದಾರ (ರವಿ, ಆಟೋ)' },
  demoAdmin: { en: 'Operator / Admin', kn: 'ಆಪರೇಟರ್ / ಅಡ್ಮಿನ್' },
  yourName: { en: 'Your name', kn: 'ನಿಮ್ಮ ಹೆಸರು' },
  yourNameOptional: { en: 'Your name (optional)', kn: 'ನಿಮ್ಮ ಹೆಸರು (ಐಚ್ಛಿಕ)' },

  // ── Navigation ───────────────────────────────────────────
  back: { en: 'Back', kn: 'ಹಿಂದೆ' },
  home: { en: 'Home', kn: 'ಮುಖಪುಟ' },
  search: { en: 'Search', kn: 'ಹುಡುಕಿ' },
  myService: { en: 'My Service', kn: 'ನನ್ನ ಸೇವೆ' },
  becomeProvider: { en: 'Register my service', kn: 'ನನ್ನ ಸೇವೆ ನೋಂದಾಯಿಸಿ' },
  admin: { en: 'Admin', kn: 'ಅಡ್ಮಿನ್' },
  logout: { en: 'Log out', kn: 'ಲಾಗ್ ಔಟ್' },

  // ── Customer home ────────────────────────────────────────
  findHelp: { en: 'Find local help near you', kn: 'ನಿಮ್ಮ ಹತ್ತಿರದ ಸೇವೆಗಳನ್ನು ಹುಡುಕಿ' },
  searchPlaceholder: { en: 'Auto driver, plumber, tractor, village…', kn: 'ಆಟೋ, ಪ್ಲಂಬರ್, ಟ್ರ್ಯಾಕ್ಟರ್, ಊರು…' },
  speak: { en: 'Speak', kn: 'ಮಾತನಾಡಿ' },
  listening: { en: 'Listening… say what you need', kn: 'ಕೇಳುತ್ತಿದ್ದೇವೆ… ನಿಮಗೆ ಏನು ಬೇಕು ಹೇಳಿ' },
  voiceUnsupported: { en: 'Voice search needs Chrome on Android. Please type instead.', kn: 'ಧ್ವನಿ ಹುಡುಕಾಟಕ್ಕೆ ಆಂಡ್ರಾಯ್ಡ್ Chrome ಬೇಕು. ದಯವಿಟ್ಟು ಟೈಪ್ ಮಾಡಿ.' },
  voiceHint: { en: 'Try saying: "ನನಗೆ ಆಟೋ ಬೇಕು"', kn: 'ಹೀಗೆ ಹೇಳಿ: "ನನಗೆ ಆಟೋ ಬೇಕು"' },
  services: { en: 'Services', kn: 'ಸೇವೆಗಳು' },
  availableNear: { en: 'Available right now', kn: 'ಈಗ ಲಭ್ಯವಿರುವವರು' },
  viewAll: { en: 'View all', kn: 'ಎಲ್ಲಾ ನೋಡಿ' },
  noSmartphone: { en: 'No smartphone? Just call Grama360', kn: 'ಸ್ಮಾರ್ಟ್‌ಫೋನ್ ಇಲ್ಲವೇ? ಗ್ರಾಮ360ಗೆ ಕರೆ ಮಾಡಿ' },
  noSmartphoneDesc: { en: 'Our operator finds the nearest available person and connects you.', kn: 'ನಮ್ಮ ಆಪರೇಟರ್ ಹತ್ತಿರದ ಲಭ್ಯ ವ್ಯಕ್ತಿಯನ್ನು ಹುಡುಕಿ ಸಂಪರ್ಕಿಸುತ್ತಾರೆ.' },
  emergency: { en: 'Emergency numbers', kn: 'ತುರ್ತು ಸಂಪರ್ಕ' },
  yourVillage: { en: 'Your village', kn: 'ನಿಮ್ಮ ಊರು' },
  allVillages: { en: 'All villages', kn: 'ಎಲ್ಲಾ ಊರುಗಳು' },

  // ── Search results ───────────────────────────────────────
  results: { en: 'Results', kn: 'ಫಲಿತಾಂಶಗಳು' },
  allServices: { en: 'All services', kn: 'ಎಲ್ಲಾ ಸೇವೆಗಳು' },
  availableOnly: { en: 'Available now only', kn: 'ಈಗ ಲಭ್ಯ ಇರುವವರು ಮಾತ್ರ' },
  peopleFound: { en: '{n} people found', kn: '{n} ಜನ ಸಿಕ್ಕಿದ್ದಾರೆ' },
  noResults: { en: 'Nobody found for this yet.', kn: 'ಇದಕ್ಕೆ ಇನ್ನೂ ಯಾರೂ ಸಿಕ್ಕಿಲ್ಲ.' },
  noResultsHelp: { en: 'Call the Grama360 helpline — our operator will find someone for you.', kn: 'ಗ್ರಾಮ360 ಸಹಾಯವಾಣಿಗೆ ಕರೆ ಮಾಡಿ — ನಮ್ಮ ಆಪರೇಟರ್ ನಿಮಗೆ ಯಾರನ್ನಾದರೂ ಹುಡುಕಿಕೊಡುತ್ತಾರೆ.' },
  clearFilters: { en: 'Clear filters', kn: 'ಫಿಲ್ಟರ್ ತೆಗೆಯಿರಿ' },
  understood: { en: 'Understood: {what}', kn: 'ಅರ್ಥವಾಯಿತು: {what}' },

  // ── Provider card / profile ──────────────────────────────
  call: { en: 'Call', kn: 'ಕರೆ ಮಾಡಿ' },
  callName: { en: 'Call {name}', kn: '{name} ಗೆ ಕರೆ ಮಾಡಿ' },
  whatsapp: { en: 'WhatsApp', kn: 'ವಾಟ್ಸಾಪ್' },
  share: { en: 'Share', kn: 'ಹಂಚಿಕೊಳ್ಳಿ' },
  copied: { en: 'Copied to clipboard', kn: 'ನಕಲಿಸಲಾಗಿದೆ' },
  yearsExp: { en: '{n} yrs experience', kn: '{n} ವರ್ಷ ಅನುಭವ' },
  worksIn: { en: 'Goes to', kn: 'ಹೋಗುವ ಊರುಗಳು' },
  workingHours: { en: 'Working hours', kn: 'ಕೆಲಸದ ಸಮಯ' },
  about: { en: 'About', kn: 'ವಿವರ' },
  reviews: { en: 'Reviews', kn: 'ಅಭಿಪ್ರಾಯಗಳು' },
  noReviews: { en: 'No reviews yet. Be the first!', kn: 'ಇನ್ನೂ ಅಭಿಪ್ರಾಯಗಳಿಲ್ಲ. ನೀವೇ ಮೊದಲಿಗರಾಗಿ!' },
  writeReview: { en: 'Write a review', kn: 'ಅಭಿಪ್ರಾಯ ಬರೆಯಿರಿ' },
  yourRating: { en: 'Your rating', kn: 'ನಿಮ್ಮ ರೇಟಿಂಗ್' },
  yourComment: { en: 'How was the service?', kn: 'ಸೇವೆ ಹೇಗಿತ್ತು?' },
  submit: { en: 'Submit', kn: 'ಸಲ್ಲಿಸಿ' },
  cancel: { en: 'Cancel', kn: 'ರದ್ದು' },
  reviewThanks: { en: 'Thank you! Your review helps the village.', kn: 'ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ಅಭಿಪ್ರಾಯ ಊರಿಗೆ ಸಹಾಯ ಮಾಡುತ್ತದೆ.' },
  report: { en: 'Report', kn: 'ದೂರು' },
  reportTitle: { en: 'Report this profile', kn: 'ಈ ಪ್ರೊಫೈಲ್ ಬಗ್ಗೆ ದೂರು' },
  reportReason: { en: 'What went wrong?', kn: 'ಏನು ತಪ್ಪಾಯಿತು?' },
  reportSent: { en: 'Report sent. Our team will check.', kn: 'ದೂರು ಕಳುಹಿಸಲಾಗಿದೆ. ನಮ್ಮ ತಂಡ ಪರಿಶೀಲಿಸುತ್ತದೆ.' },
  verification: { en: 'Verification', kn: 'ಪರಿಶೀಲನೆ' },
  phoneVerified: { en: 'Phone verified', kn: 'ಫೋನ್ ಪರಿಶೀಲಿಸಲಾಗಿದೆ' },
  grama360Verified: { en: 'Grama360 verified', kn: 'ಗ್ರಾಮ360 ಪರಿಶೀಲಿಸಿದೆ' },
  highlyRated: { en: 'Highly rated', kn: 'ಉತ್ತಮ ರೇಟಿಂಗ್' },
  pendingVerification: { en: 'Verification pending', kn: 'ಪರಿಶೀಲನೆ ಬಾಕಿ' },
  verifiedDesc: { en: 'Identity and work checked by a Grama360 representative.', kn: 'ಗ್ರಾಮ360 ಪ್ರತಿನಿಧಿ ಗುರುತು ಮತ್ತು ಕೆಲಸ ಪರಿಶೀಲಿಸಿದ್ದಾರೆ.' },
  phoneVerifiedDesc: { en: 'Mobile number confirmed by OTP.', kn: 'OTP ಮೂಲಕ ಮೊಬೈಲ್ ನಂಬರ್ ದೃಢಪಡಿಸಲಾಗಿದೆ.' },
  newOnGrama: { en: 'New', kn: 'ಹೊಸ' },

  // ── Availability ─────────────────────────────────────────
  statusAvailable: { en: 'Available now', kn: 'ಈಗ ಲಭ್ಯ' },
  statusBusy: { en: 'Busy', kn: 'ಕೆಲಸದಲ್ಲಿ' },
  statusOffline: { en: 'Offline', kn: 'ಲಭ್ಯವಿಲ್ಲ' },
  meAvailable: { en: 'I am available for work', kn: 'ನಾನು ಕೆಲಸಕ್ಕೆ ಲಭ್ಯ ಇದ್ದೇನೆ' },
  meAvailableDesc: { en: 'Customers see you first and can call now.', kn: 'ಗ್ರಾಹಕರಿಗೆ ನೀವು ಮೊದಲು ಕಾಣಿಸುತ್ತೀರಿ, ಈಗಲೇ ಕರೆ ಮಾಡಬಹುದು.' },
  meBusy: { en: 'Busy right now', kn: 'ಈಗ ಕೆಲಸದಲ್ಲಿದ್ದೇನೆ' },
  meBusyDesc: { en: 'Still listed, customers know you may answer later.', kn: 'ಪಟ್ಟಿಯಲ್ಲಿ ಇರುತ್ತೀರಿ, ಆದರೆ ತಡವಾಗಿ ಉತ್ತರಿಸಬಹುದು ಎಂದು ತಿಳಿಯುತ್ತದೆ.' },
  meOffline: { en: 'Not working today', kn: 'ಇಂದು ಕೆಲಸ ಇಲ್ಲ' },
  meOfflineDesc: { en: 'Shown at the bottom. No calls expected.', kn: 'ಪಟ್ಟಿಯ ಕೊನೆಯಲ್ಲಿ ಕಾಣಿಸುತ್ತೀರಿ. ಕರೆ ಬರುವುದಿಲ್ಲ.' },
  statusUpdated: { en: 'Status updated: {status}', kn: 'ಸ್ಥಿತಿ ಬದಲಾಯಿತು: {status}' },

  // ── Provider registration / edit ─────────────────────────
  registerTitle: { en: 'Register your service', kn: 'ನಿಮ್ಮ ಸೇವೆ ನೋಂದಾಯಿಸಿ' },
  registerSubtitle: { en: 'Free listing. Takes 2 minutes. Customers in your area will find you.', kn: 'ಉಚಿತ ನೋಂದಣಿ. 2 ನಿಮಿಷ ಸಾಕು. ನಿಮ್ಮ ಪ್ರದೇಶದ ಗ್ರಾಹಕರು ನಿಮ್ಮನ್ನು ಹುಡುಕುತ್ತಾರೆ.' },
  editTitle: { en: 'Edit my profile', kn: 'ನನ್ನ ಪ್ರೊಫೈಲ್ ಬದಲಾಯಿಸಿ' },
  stepOf: { en: 'Step {a} of {b}', kn: 'ಹಂತ {a} / {b}' },
  whatDoYouDo: { en: 'What work do you do?', kn: 'ನೀವು ಯಾವ ಕೆಲಸ ಮಾಡುತ್ತೀರಿ?' },
  aboutYou: { en: 'About you', kn: 'ನಿಮ್ಮ ಬಗ್ಗೆ' },
  whereYouWork: { en: 'Where do you work?', kn: 'ನೀವು ಎಲ್ಲಿ ಕೆಲಸ ಮಾಡುತ್ತೀರಿ?' },
  fullName: { en: 'Your name', kn: 'ನಿಮ್ಮ ಹೆಸರು' },
  namePlaceholder: { en: 'e.g. Ravi', kn: 'ಉದಾ: ರವಿ' },
  phoneForCustomers: { en: 'Number customers should call', kn: 'ಗ್ರಾಹಕರು ಕರೆ ಮಾಡಬೇಕಾದ ನಂಬರ್' },
  hasWhatsApp: { en: 'This number has WhatsApp', kn: 'ಈ ನಂಬರ್‌ನಲ್ಲಿ ವಾಟ್ಸಾಪ್ ಇದೆ' },
  village: { en: 'Your village', kn: 'ನಿಮ್ಮ ಊರು' },
  otherVillage: { en: 'Other village…', kn: 'ಬೇರೆ ಊರು…' },
  typeVillage: { en: 'Type your village name', kn: 'ನಿಮ್ಮ ಊರಿನ ಹೆಸರು ಬರೆಯಿರಿ' },
  district: { en: 'District', kn: 'ಜಿಲ್ಲೆ' },
  serviceArea: { en: 'Villages you will go to', kn: 'ನೀವು ಹೋಗುವ ಊರುಗಳು' },
  serviceAreaHint: { en: 'Tap all that apply', kn: 'ಎಲ್ಲಾ ಆಯ್ಕೆ ಮಾಡಿ' },
  experience: { en: 'Experience (years)', kn: 'ಅನುಭವ (ವರ್ಷ)' },
  hours: { en: 'Working hours', kn: 'ಕೆಲಸದ ಸಮಯ' },
  description: { en: 'Tell customers about your work', kn: 'ನಿಮ್ಮ ಕೆಲಸದ ಬಗ್ಗೆ ಗ್ರಾಹಕರಿಗೆ ಹೇಳಿ' },
  descriptionPlaceholder: { en: 'e.g. House wiring, fan and pump-set repair. Available for emergencies.', kn: 'ಉದಾ: ಮನೆ ವೈರಿಂಗ್, ಫ್ಯಾನ್ ಮತ್ತು ಪಂಪ್‌ಸೆಟ್ ರಿಪೇರಿ. ತುರ್ತು ಕೆಲಸಕ್ಕೂ ಬರುತ್ತೇನೆ.' },
  next: { en: 'Next', kn: 'ಮುಂದೆ' },
  registerNow: { en: 'Register & go live', kn: 'ನೋಂದಾಯಿಸಿ' },
  saveChanges: { en: 'Save changes', kn: 'ಬದಲಾವಣೆ ಉಳಿಸಿ' },
  saved: { en: 'Saved', kn: 'ಉಳಿಸಲಾಗಿದೆ' },
  required: { en: 'Please fill this in', kn: 'ದಯವಿಟ್ಟು ಇದನ್ನು ಭರ್ತಿ ಮಾಡಿ' },
  chooseCategory: { en: 'Please choose your work', kn: 'ನಿಮ್ಮ ಕೆಲಸ ಆಯ್ಕೆ ಮಾಡಿ' },
  registered: { en: 'You are live! Customers can now find you.', kn: 'ನೀವು ಈಗ ಪಟ್ಟಿಯಲ್ಲಿದ್ದೀರಿ! ಗ್ರಾಹಕರು ನಿಮ್ಮನ್ನು ಹುಡುಕಬಹುದು.' },
  freeForever: { en: 'Basic listing is free. Verified & premium badges come later.', kn: 'ಮೂಲ ನೋಂದಣಿ ಉಚಿತ. ಪರಿಶೀಲಿತ ಮತ್ತು ಪ್ರೀಮಿಯಂ ಬ್ಯಾಡ್ಜ್ ನಂತರ.' },
  addAnotherService: { en: 'Add another service', kn: 'ಇನ್ನೊಂದು ಸೇವೆ ಸೇರಿಸಿ' },

  // ── Provider dashboard ───────────────────────────────────
  myStatus: { en: 'My status today', kn: 'ಇಂದು ನನ್ನ ಸ್ಥಿತಿ' },
  howCustomersSee: { en: 'How customers see you', kn: 'ಗ್ರಾಹಕರಿಗೆ ನೀವು ಹೀಗೆ ಕಾಣಿಸುತ್ತೀರಿ' },
  editProfile: { en: 'Edit profile', kn: 'ಪ್ರೊಫೈಲ್ ಬದಲಾಯಿಸಿ' },
  viewPublic: { en: 'View my page', kn: 'ನನ್ನ ಪುಟ ನೋಡಿ' },
  shareCard: { en: 'Share my Grama360 card', kn: 'ನನ್ನ ಗ್ರಾಮ360 ಕಾರ್ಡ್ ಹಂಚಿಕೊಳ್ಳಿ' },
  myReviews: { en: 'My reviews', kn: 'ನನ್ನ ಅಭಿಪ್ರಾಯಗಳು' },
  requestsForMe: { en: 'Customers connected to me', kn: 'ನನಗೆ ಸಂಪರ್ಕವಾದ ಗ್ರಾಹಕರು' },
  verificationPendingDesc: { en: 'A Grama360 representative will call you to verify. You are already visible to customers.', kn: 'ಗ್ರಾಮ360 ಪ್ರತಿನಿಧಿ ಪರಿಶೀಲನೆಗೆ ಕರೆ ಮಾಡುತ್ತಾರೆ. ಈಗಲೇ ಗ್ರಾಹಕರಿಗೆ ಕಾಣಿಸುತ್ತೀರಿ.' },
  myServices: { en: 'My services', kn: 'ನನ್ನ ಸೇವೆಗಳು' },

  // ── Operator desk ────────────────────────────────────────
  operatorDesk: { en: 'Operator desk', kn: 'ಆಪರೇಟರ್ ಡೆಸ್ಕ್' },
  operatorDeskDesc: { en: 'For calls, WhatsApp and walk-ins from people without the app.', kn: 'ಆ್ಯಪ್ ಇಲ್ಲದವರ ಕರೆ, ವಾಟ್ಸಾಪ್ ಮತ್ತು ನೇರ ಭೇಟಿಗಾಗಿ.' },
  callerSaid: { en: 'What did the caller say?', kn: 'ಕರೆ ಮಾಡಿದವರು ಏನು ಹೇಳಿದರು?' },
  callerSaidPlaceholder: { en: 'e.g. ನನಗೆ ಟ್ರ್ಯಾಕ್ಟರ್ ಬೇಕು', kn: 'ಉದಾ: ನನಗೆ ಟ್ರ್ಯಾಕ್ಟರ್ ಬೇಕು' },
  callerName: { en: 'Caller name', kn: 'ಕರೆ ಮಾಡಿದವರ ಹೆಸರು' },
  callerPhone: { en: 'Caller phone', kn: 'ಕರೆ ಮಾಡಿದವರ ನಂಬರ್' },
  callerVillage: { en: 'Caller village', kn: 'ಕರೆ ಮಾಡಿದವರ ಊರು' },
  channel: { en: 'Channel', kn: 'ಮಾಧ್ಯಮ' },
  readOut: { en: 'Read out to caller', kn: 'ಕರೆ ಮಾಡಿದವರಿಗೆ ಓದಿ ಹೇಳಿ' },
  connect: { en: 'Connect', kn: 'ಸಂಪರ್ಕಿಸಿ' },
  logWithoutProvider: { en: 'Log request (no one available)', kn: 'ವಿನಂತಿ ದಾಖಲಿಸಿ (ಯಾರೂ ಲಭ್ಯವಿಲ್ಲ)' },
  requestLogged: { en: 'Request logged', kn: 'ವಿನಂತಿ ದಾಖಲಾಯಿತು' },
  connectedTo: { en: 'Connected to {name}', kn: '{name} ಗೆ ಸಂಪರ್ಕಿಸಲಾಯಿತು' },
  matchedCategory: { en: 'Detected service', kn: 'ಗುರುತಿಸಿದ ಸೇವೆ' },
  nothingDetected: { en: 'Could not detect a service — pick one below.', kn: 'ಸೇವೆ ಗುರುತಿಸಲಾಗಲಿಲ್ಲ — ಕೆಳಗೆ ಆಯ್ಕೆ ಮಾಡಿ.' },

  // ── Requests log ─────────────────────────────────────────
  requestsLog: { en: 'Service requests', kn: 'ಸೇವಾ ವಿನಂತಿಗಳು' },
  requestsLogDesc: { en: 'Every request Grama360 handled — the pilot\'s most important number.', kn: 'ಗ್ರಾಮ360 ನಿರ್ವಹಿಸಿದ ಪ್ರತಿ ವಿನಂತಿ — ಪ್ರಾಯೋಗಿಕ ಹಂತದ ಪ್ರಮುಖ ಅಂಕಿ.' },
  thisMonth: { en: 'This month', kn: 'ಈ ತಿಂಗಳು' },
  markCompleted: { en: 'Completed', kn: 'ಪೂರ್ಣ' },
  markCancelled: { en: 'Cancelled', kn: 'ರದ್ದು' },
  noRequests: { en: 'No requests yet.', kn: 'ಇನ್ನೂ ವಿನಂತಿಗಳಿಲ್ಲ.' },
  estCommission: { en: 'Potential commission @ ₹100', kn: 'ಸಂಭಾವ್ಯ ಕಮಿಷನ್ @ ₹100' },

  // ── Admin ────────────────────────────────────────────────
  adminDashboard: { en: 'Admin dashboard', kn: 'ಅಡ್ಮಿನ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್' },
  customers: { en: 'Customers', kn: 'ಗ್ರಾಹಕರು' },
  providers: { en: 'Providers', kn: 'ಸೇವಾದಾರರು' },
  availableNowCount: { en: 'Available now', kn: 'ಈಗ ಲಭ್ಯ' },
  requestsMonth: { en: 'Requests this month', kn: 'ಈ ತಿಂಗಳ ವಿನಂತಿಗಳು' },
  pendingVerifications: { en: 'Pending verifications', kn: 'ಬಾಕಿ ಪರಿಶೀಲನೆಗಳು' },
  verify: { en: 'Verify', kn: 'ಪರಿಶೀಲಿಸಿ' },
  keepPending: { en: 'Later', kn: 'ನಂತರ' },
  noPending: { en: 'No pending verifications.', kn: 'ಬಾಕಿ ಪರಿಶೀಲನೆಗಳಿಲ್ಲ.' },
  reports: { en: 'Reports', kn: 'ದೂರುಗಳು' },
  noReports: { en: 'No open reports.', kn: 'ತೆರೆದ ದೂರುಗಳಿಲ್ಲ.' },
  resolve: { en: 'Resolve', kn: 'ಪರಿಹರಿಸಿ' },
  reject: { en: 'Reject', kn: 'ತಿರಸ್ಕರಿಸಿ' },
  byPerson: { en: 'by {name}', kn: '{name} ಅವರಿಂದ' },
  demandByService: { en: 'Demand by service', kn: 'ಸೇವೆವಾರು ಬೇಡಿಕೆ' },
  resetDemo: { en: 'Reset demo data', kn: 'ಡೆಮೊ ಡೇಟಾ ಮರುಹೊಂದಿಸಿ' },
  resetConfirm: { en: 'This clears everything you registered in this browser. Continue?', kn: 'ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ನೋಂದಾಯಿಸಿದ ಎಲ್ಲವನ್ನೂ ಅಳಿಸುತ್ತದೆ. ಮುಂದುವರಿಸುವುದೇ?' },
  adminOnly: { en: 'Admin access only', kn: 'ಅಡ್ಮಿನ್ ಮಾತ್ರ' },
  loginAsProviderFirst: { en: 'Log in as a service provider to use this.', kn: 'ಇದಕ್ಕಾಗಿ ಸೇವಾದಾರರಾಗಿ ಲಾಗಿನ್ ಮಾಡಿ.' },
} as const;

export type StringKey = keyof typeof STRINGS;

export function translate(key: StringKey, lang: Language, vars?: Record<string, string | number>): string {
  let s: string = STRINGS[key][lang] ?? STRINGS[key].en;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }
  return s;
}

export function statusLabel(status: AvailabilityStatus, lang: Language): string {
  switch (status) {
    case 'AVAILABLE_NOW': return translate('statusAvailable', lang);
    case 'BUSY': return translate('statusBusy', lang);
    default: return translate('statusOffline', lang);
  }
}

export function verificationLabel(status: VerificationStatus, lang: Language): string {
  switch (status) {
    case 'GRAMA360_VERIFIED': return translate('grama360Verified', lang);
    case 'PHONE_VERIFIED': return translate('phoneVerified', lang);
    default: return translate('pendingVerification', lang);
  }
}

export function channelLabel(channel: RequestChannel, lang: Language): string {
  const map: Record<RequestChannel, { en: string; kn: string }> = {
    app: { en: 'App', kn: 'ಆ್ಯಪ್' },
    call: { en: 'Phone call', kn: 'ಫೋನ್ ಕರೆ' },
    whatsapp: { en: 'WhatsApp', kn: 'ವಾಟ್ಸಾಪ್' },
    walk_in: { en: 'Walk-in', kn: 'ನೇರ ಭೇಟಿ' },
  };
  return map[channel][lang];
}
