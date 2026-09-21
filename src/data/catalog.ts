import type { CategoryGroup, ServiceCategory, Village } from '../types';

/**
 * Service categories for the pilot.
 *
 * Start small: these map to the three launch pillars
 * (Agriculture, Home & Repair, Essential help) plus Transport.
 * Keywords are what people actually say — in English AND Kannada —
 * so "auto driver", "rickshaw", "ಆಟೋ" and "ನನಗೆ ರಿಕ್ಷಾ ಬೇಕು" all resolve to `auto`.
 */
export const CATEGORIES: ServiceCategory[] = [
  // ── Transport ──────────────────────────────────────────────
  {
    id: 'auto',
    name: 'Auto Driver',
    kannadaName: 'ಆಟೋ ಚಾಲಕ',
    icon: 'Car',
    group: 'transport',
    keywords: ['auto', 'autorickshaw', 'rickshaw', 'auto driver', 'ride', 'drop', 'ಆಟೋ', 'ರಿಕ್ಷಾ', 'ಆಟೋ ಚಾಲಕ'],
  },
  {
    id: 'goods',
    name: 'Goods Vehicle',
    kannadaName: 'ಸರಕು ವಾಹನ',
    icon: 'Truck',
    group: 'transport',
    keywords: ['goods', 'tempo', 'pickup', 'truck', 'lorry', 'transport', 'load', 'ಟೆಂಪೋ', 'ಪಿಕಪ್', 'ಲಾರಿ', 'ಸರಕು', 'ಲೋಡ್'],
  },

  // ── Agriculture ────────────────────────────────────────────
  {
    id: 'tractor',
    name: 'Tractor / Tiller',
    kannadaName: 'ಟ್ರ್ಯಾಕ್ಟರ್ / ಟಿಲ್ಲರ್',
    icon: 'Tractor',
    group: 'agriculture',
    keywords: ['tractor', 'tiller', 'plough', 'ploughing', 'rotavator', 'field', 'ಟ್ರ್ಯಾಕ್ಟರ್', 'ಟ್ರಾಕ್ಟರ್', 'ಟಿಲ್ಲರ್', 'ಉಳುಮೆ', 'ಗದ್ದೆ'],
  },
  {
    id: 'labour',
    name: 'Farm Labour',
    kannadaName: 'ಕೃಷಿ ಕೂಲಿ ಕೆಲಸ',
    icon: 'Users',
    group: 'agriculture',
    keywords: ['labour', 'labor', 'coolie', 'workers', 'planting', 'harvest', 'ಕೂಲಿ', 'ಆಳು', 'ಆಳುಗಳು', 'ನಾಟಿ', 'ಕೊಯ್ಲು', 'ಕೆಲಸದವರು'],
  },
  {
    id: 'climber',
    name: 'Coconut / Arecanut Climber',
    kannadaName: 'ತೆಂಗು / ಅಡಿಕೆ ಕೊಯ್ಲು',
    icon: 'TreePalm',
    group: 'agriculture',
    keywords: ['coconut', 'arecanut', 'areca', 'climber', 'tree climber', 'ತೆಂಗು', 'ತೆಂಗಿನಕಾಯಿ', 'ಅಡಿಕೆ', 'ಮರ ಹತ್ತುವವರು', 'ಕಾಯಿ ಕೀಳುವವರು'],
  },
  {
    id: 'pump',
    name: 'Motor / Pump Repair',
    kannadaName: 'ಮೋಟಾರ್ / ಪಂಪ್ ರಿಪೇರಿ',
    icon: 'Cog',
    group: 'agriculture',
    keywords: ['motor', 'pump', 'pumpset', 'pump set', 'borewell', 'submersible', 'ಮೋಟಾರ್', 'ಪಂಪ್', 'ಪಂಪ್‌ಸೆಟ್', 'ಬೋರ್‌ವೆಲ್', 'ಬೋರ್'],
  },

  // ── Home & Repair ──────────────────────────────────────────
  {
    id: 'electrician',
    name: 'Electrician',
    kannadaName: 'ಎಲೆಕ್ಟ್ರಿಷಿಯನ್',
    icon: 'Zap',
    group: 'home',
    keywords: ['electrician', 'electric', 'wiring', 'current', 'fan', 'light', 'switch', 'ಎಲೆಕ್ಟ್ರಿಷಿಯನ್', 'ವಿದ್ಯುತ್', 'ಕರೆಂಟ್', 'ವೈರಿಂಗ್', 'ಫ್ಯಾನ್', 'ಲೈಟ್'],
  },
  {
    id: 'plumber',
    name: 'Plumber',
    kannadaName: 'ಪ್ಲಂಬರ್',
    icon: 'Droplets',
    group: 'home',
    keywords: ['plumber', 'plumbing', 'pipe', 'tap', 'leak', 'water tank', 'ಪ್ಲಂಬರ್', 'ಪೈಪ್', 'ನಲ್ಲಿ', 'ಟ್ಯಾಪ್', 'ನೀರಿನ ಟ್ಯಾಂಕ್'],
  },
  {
    id: 'appliance',
    name: 'Appliance Repair',
    kannadaName: 'ಉಪಕರಣ ರಿಪೇರಿ',
    icon: 'Refrigerator',
    group: 'home',
    keywords: ['appliance', 'fridge', 'refrigerator', 'tv', 'television', 'washing machine', 'mixer', 'grinder', 'ಫ್ರಿಡ್ಜ್', 'ಟಿವಿ', 'ವಾಷಿಂಗ್ ಮಷಿನ್', 'ಮಿಕ್ಸರ್', 'ಗ್ರೈಂಡರ್'],
  },
  {
    id: 'carpenter',
    name: 'Carpenter',
    kannadaName: 'ಬಡಗಿ / ಮರಗೆಲಸ',
    icon: 'Hammer',
    group: 'home',
    keywords: ['carpenter', 'wood', 'furniture', 'door', 'window', 'ಬಡಗಿ', 'ಮರಗೆಲಸ', 'ಮರದ ಕೆಲಸ', 'ಬಾಗಿಲು', 'ಕಿಟಕಿ'],
  },
  {
    id: 'mechanic',
    name: 'Mechanic',
    kannadaName: 'ಮೆಕಾನಿಕ್',
    icon: 'Wrench',
    group: 'home',
    keywords: ['mechanic', 'bike', 'scooter', 'two wheeler', 'puncture', 'garage', 'ಮೆಕಾನಿಕ್', 'ಬೈಕ್', 'ಸ್ಕೂಟರ್', 'ಪಂಕ್ಚರ್', 'ಗ್ಯಾರೇಜ್'],
  },
  {
    id: 'tailor',
    name: 'Tailor',
    kannadaName: 'ಟೈಲರ್ / ಹೊಲಿಗೆ',
    icon: 'Scissors',
    group: 'home',
    keywords: ['tailor', 'stitching', 'blouse', 'alteration', 'ಟೈಲರ್', 'ಹೊಲಿಗೆ', 'ರವಿಕೆ', 'ಬ್ಲೌಸ್'],
  },

  // ── Essential help ─────────────────────────────────────────
  {
    id: 'eldercare',
    name: 'Elderly Assistance',
    kannadaName: 'ಹಿರಿಯರ ಸಹಾಯ',
    icon: 'HeartHandshake',
    group: 'essential',
    keywords: ['elder', 'elderly', 'old age', 'home nurse', 'caretaker', 'medicine', 'hospital visit', 'ಹಿರಿಯರು', 'ವೃದ್ಧರು', 'ಆರೈಕೆ', 'ಹೋಂ ನರ್ಸ್', 'ಔಷಧಿ', 'ಆಸ್ಪತ್ರೆ'],
  },
  {
    id: 'tutor',
    name: 'Tutor',
    kannadaName: 'ಟ್ಯೂಷನ್ / ಶಿಕ್ಷಕ',
    icon: 'BookOpen',
    group: 'essential',
    keywords: ['tutor', 'tuition', 'teacher', 'classes', 'sslc', 'puc', 'ಟ್ಯೂಷನ್', 'ಶಿಕ್ಷಕ', 'ಪಾಠ', 'ಮೇಷ್ಟ್ರು'],
  },
  {
    id: 'shop',
    name: 'Local Shop',
    kannadaName: 'ಅಂಗಡಿ',
    icon: 'Store',
    group: 'essential',
    keywords: ['shop', 'store', 'kirana', 'provisions', 'grocery', 'home delivery', 'ಅಂಗಡಿ', 'ಕಿರಾಣಿ', 'ದಿನಸಿ', 'ಹೋಂ ಡೆಲಿವರಿ'],
  },
];

export const CATEGORY_BY_ID: Record<string, ServiceCategory> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
);

export const GROUPS: { id: CategoryGroup; name: string; kannadaName: string; emoji: string }[] = [
  { id: 'transport', name: 'Transport', kannadaName: 'ಸಾರಿಗೆ', emoji: '🚕' },
  { id: 'agriculture', name: 'Agriculture', kannadaName: 'ಕೃಷಿ', emoji: '🌾' },
  { id: 'home', name: 'Home & Repair', kannadaName: 'ಮನೆ ಮತ್ತು ರಿಪೇರಿ', emoji: '🔧' },
  { id: 'essential', name: 'Essential Help', kannadaName: 'ಅಗತ್ಯ ಸಹಾಯ', emoji: '🤝' },
];

/** Pilot region: Brahmavara taluk, Udupi district. */
export const PILOT_DISTRICT = 'Udupi';
export const PILOT_DISTRICT_KN = 'ಉಡುಪಿ';

export const VILLAGES: Village[] = [
  { id: 'brahmavara', name: 'Brahmavara', kannadaName: 'ಬ್ರಹ್ಮಾವರ' },
  { id: 'mandarthi', name: 'Mandarthi', kannadaName: 'ಮಂದಾರ್ತಿ' },
  { id: 'kota', name: 'Kota', kannadaName: 'ಕೋಟ' },
  { id: 'saligrama', name: 'Saligrama', kannadaName: 'ಸಾಲಿಗ್ರಾಮ' },
  { id: 'barkur', name: 'Barkur', kannadaName: 'ಬಾರಕೂರು' },
  { id: 'kokkarne', name: 'Kokkarne', kannadaName: 'ಕೊಕ್ಕರ್ಣೆ' },
  { id: 'cherkady', name: 'Cherkady', kannadaName: 'ಚೇರ್ಕಾಡಿ' },
  { id: 'handadi', name: 'Handadi', kannadaName: 'ಹಂದಾಡಿ' },
  { id: 'neelavara', name: 'Neelavara', kannadaName: 'ನೀಲಾವರ' },
  { id: 'hosala', name: 'Hosala', kannadaName: 'ಹೊಸಾಳ' },
  { id: 'uppoor', name: 'Uppoor', kannadaName: 'ಉಪ್ಪೂರು' },
  { id: 'kolalgiri', name: 'Kolalgiri', kannadaName: 'ಕೊಳಲಗಿರಿ' },
  { id: 'chanthar', name: 'Chanthar', kannadaName: 'ಚಾಂತಾರು' },
  { id: 'heggunje', name: 'Heggunje', kannadaName: 'ಹೆಗ್ಗುಂಜೆ' },
  { id: 'airody', name: 'Airody', kannadaName: 'ಐರೋಡಿ' },
  { id: 'sastan', name: 'Sastan', kannadaName: 'ಸಾಸ್ತಾನ' },
];

export const VILLAGE_BY_NAME: Record<string, Village> = Object.fromEntries(
  VILLAGES.map((v) => [v.name.toLowerCase(), v])
);

/** Emergency numbers that work anywhere in India (no smartphone needed). */
export const EMERGENCY_CONTACTS: { id: string; name: string; kannadaName: string; number: string; icon: string }[] = [
  { id: 'all', name: 'Emergency (all)', kannadaName: 'ತುರ್ತು ಸಹಾಯ', number: '112', icon: 'Siren' },
  { id: 'ambulance', name: 'Ambulance', kannadaName: 'ಆಂಬುಲೆನ್ಸ್', number: '108', icon: 'Ambulance' },
  { id: 'police', name: 'Police', kannadaName: 'ಪೊಲೀಸ್', number: '100', icon: 'Shield' },
  { id: 'fire', name: 'Fire', kannadaName: 'ಅಗ್ನಿಶಾಮಕ', number: '101', icon: 'Flame' },
  { id: 'elder', name: 'Elder Line', kannadaName: 'ಹಿರಿಯರ ಸಹಾಯವಾಣಿ', number: '14567', icon: 'HeartHandshake' },
];

/**
 * The single Grama360 number that keypad-phone users call.
 * Placeholder until the pilot SIM / virtual number is set up (Day 5 of the plan).
 */
export const GRAMA360_HELPLINE = '+919000360360';
