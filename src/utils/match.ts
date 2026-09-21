import { CATEGORIES, VILLAGES } from '../data/catalog';
import type { AvailabilityStatus, ProviderProfile, ServiceCategory, Village } from '../types';

/**
 * Tiny "intent parser" shared by text search, voice search and the operator desk.
 *
 * It turns a natural phrase — typed or spoken, English or Kannada — into
 *   { categoryIds, village }
 * e.g. "ನನಗೆ ಬ್ರಹ್ಮಾವರದಿಂದ ಮಂದಾರ್ತಿಗೆ ಹೋಗಲು ಆಟೋ ಬೇಕು" → { categoryIds: ['auto'], village: 'Brahmavara' }
 *      "plumber kota"                                    → { categoryIds: ['plumber'], village: 'Kota' }
 *
 * The same function will later sit behind the IVR / WhatsApp bot, which is why it
 * lives in a plain module with no React imports.
 */

export function normalize(text: string): string {
  return text.toLowerCase().replace(/[.,!?;:()"'\-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function termMatches(query: string, term: string): boolean {
  const t = normalize(term);
  if (!t) return false;
  // whole phrase contains the term ("ನನಗೆ ಆಟೋ ಬೇಕು" ⊃ "ಆಟೋ", "ಬ್ರಹ್ಮಾವರದಿಂದ" ⊃ "ಬ್ರಹ್ಮಾವರ")
  if (query.includes(t)) return true;
  // partial typing: "elect" is a prefix of "electrician"
  const tokens = query.split(' ');
  return tokens.some((tok) => tok.length >= 3 && t.startsWith(tok));
}

export function matchCategories(text: string, categories: ServiceCategory[] = CATEGORIES): ServiceCategory[] {
  const q = normalize(text);
  if (!q) return [];
  return categories.filter((c) => [c.name, c.kannadaName, ...c.keywords].some((term) => termMatches(q, term)));
}

export function matchVillage(text: string, villages: Village[] = VILLAGES): Village | null {
  const q = normalize(text);
  if (!q) return null;
  // Prefer the earliest mention in the sentence (the "from" place is usually where the caller is).
  let best: { v: Village; idx: number } | null = null;
  for (const v of villages) {
    for (const term of [v.name, v.kannadaName]) {
      const idx = q.indexOf(normalize(term));
      if (idx >= 0 && (!best || idx < best.idx)) best = { v, idx };
    }
  }
  if (best) return best.v;
  // partial typing of a village name
  const tok = q.split(' ').find((t) => t.length >= 3 && villages.some((v) => normalize(v.name).startsWith(t)));
  return tok ? villages.find((v) => normalize(v.name).startsWith(tok)) ?? null : null;
}

export interface Intent {
  categoryIds: string[];
  village: string | null;
}

export function parseIntent(text: string): Intent {
  return {
    categoryIds: matchCategories(text).map((c) => c.id),
    village: matchVillage(text)?.name ?? null,
  };
}

export interface SearchFilters {
  query?: string;
  categoryId?: string | null;
  village?: string | null;
  availableOnly?: boolean;
}

const STATUS_ORDER: Record<AvailabilityStatus, number> = { AVAILABLE_NOW: 0, BUSY: 1, OFFLINE: 2 };
const VERIFY_ORDER = { GRAMA360_VERIFIED: 0, PHONE_VERIFIED: 1, PENDING: 2 } as const;

function servesVillage(p: ProviderProfile, village: string): boolean {
  const v = normalize(village);
  return normalize(p.village) === v || p.serviceArea.some((a) => normalize(a) === v);
}

/**
 * The one search function used by the customer app AND the operator desk.
 * Ranking: available first → verified first → higher rating first.
 */
export function searchProviders(providers: ProviderProfile[], filters: SearchFilters): ProviderProfile[] {
  let list = providers;

  if (filters.categoryId) list = list.filter((p) => p.categoryId === filters.categoryId);

  const q = normalize(filters.query ?? '');
  if (q) {
    const intent = parseIntent(q);
    if (intent.categoryIds.length > 0) list = list.filter((p) => intent.categoryIds.includes(p.categoryId));
    if (intent.village) list = list.filter((p) => servesVillage(p, intent.village!));
    if (intent.categoryIds.length === 0 && !intent.village) {
      // Free text: name / village / description
      list = list.filter((p) =>
        normalize(p.name).includes(q) ||
        normalize(p.village).includes(q) ||
        p.serviceArea.some((a) => normalize(a).includes(q)) ||
        normalize(p.description).includes(q)
      );
    }
  }

  if (filters.village) list = list.filter((p) => servesVillage(p, filters.village!));
  if (filters.availableOnly) list = list.filter((p) => p.availabilityStatus === 'AVAILABLE_NOW');

  return [...list].sort((a, b) => {
    const s = STATUS_ORDER[a.availabilityStatus] - STATUS_ORDER[b.availabilityStatus];
    if (s !== 0) return s;
    // Own village before neighbouring villages when a village filter is set
    if (filters.village) {
      const av = normalize(a.village) === normalize(filters.village) ? 0 : 1;
      const bv = normalize(b.village) === normalize(filters.village) ? 0 : 1;
      if (av !== bv) return av - bv;
    }
    const v = VERIFY_ORDER[a.verificationStatus] - VERIFY_ORDER[b.verificationStatus];
    if (v !== 0) return v;
    return b.rating - a.rating;
  });
}
