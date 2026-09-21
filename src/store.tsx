import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react';
import type {
  AnalyticsSnapshot, AvailabilityStatus, Language, ProviderProfile, Report, Review, Role,
  ServiceRequest, User, VerificationStatus,
} from './types';
import { SEED_PROVIDERS, SEED_REPORTS, SEED_REQUESTS, SEED_REVIEWS, SEED_USERS } from './data/seed';
import { CATEGORIES } from './data/catalog';
import { translate, type StringKey } from './i18n';
import { isThisMonth, uid } from './utils/format';
import { searchProviders, type SearchFilters } from './utils/match';

/* ────────────────────────────────────────────────────────────────
 * Screens & navigation
 * ──────────────────────────────────────────────────────────────── */

export type Screen =
  | 'splash'
  | 'language'
  | 'auth'
  | 'customer_home'
  | 'customer_search'
  | 'provider_profile'
  | 'provider_register'
  | 'provider_edit'
  | 'provider_dashboard'
  | 'admin_dashboard'
  | 'operator_desk'
  | 'requests_log';

const ENTRY_SCREENS: Screen[] = ['splash', 'language', 'auth'];

export interface SearchState {
  query: string;
  categoryId: string | null;
  village: string | null;
  availableOnly: boolean;
}

/* ────────────────────────────────────────────────────────────────
 * Persistence (localStorage) — swapped for a REST API later.
 * ──────────────────────────────────────────────────────────────── */

const STORAGE_KEY = 'grama360:v2';

interface Persisted {
  users: User[];
  providers: ProviderProfile[];
  reviews: Review[];
  reports: Report[];
  requests: ServiceRequest[];
  language: Language;
  currentUserId: string | null;
}

const seedData = (): Persisted => ({
  users: SEED_USERS,
  providers: SEED_PROVIDERS,
  reviews: SEED_REVIEWS,
  reports: SEED_REPORTS,
  requests: SEED_REQUESTS,
  language: 'kn',
  currentUserId: null,
});

function loadPersisted(): Persisted {
  if (typeof window === 'undefined') return seedData();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedData();
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return { ...seedData(), ...parsed };
  } catch {
    return seedData();
  }
}

/* ────────────────────────────────────────────────────────────────
 * Store
 * ──────────────────────────────────────────────────────────────── */

interface StoreValue {
  // data
  language: Language;
  currentUser: User | null;
  users: User[];
  providers: ProviderProfile[];
  reviews: Review[];
  reports: Report[];
  requests: ServiceRequest[];
  analytics: AnalyticsSnapshot;
  // ui
  screen: Screen;
  search: SearchState;
  selectedProvider: ProviderProfile | null;
  toast: string | null;
  // helpers
  t: (key: StringKey, vars?: Record<string, string | number>) => string;
  navigate: (screen: Screen) => void;
  goBack: () => void;
  goHome: () => void;
  setLanguage: (lang: Language) => void;
  showToast: (msg: string) => void;
  // auth
  otpSentTo: string | null;
  sendOtp: (phoneE164: string) => void;
  verifyOtp: (code: string) => boolean;
  chooseRole: (role: Role, name?: string) => void;
  demoLogin: (role: Role) => void;
  logout: () => void;
  // search
  setSearch: (patch: Partial<SearchState>) => void;
  resetSearch: () => void;
  runSearch: (filters: SearchFilters) => ProviderProfile[];
  openProvider: (id: string) => void;
  selectProvider: (id: string | null) => void;
  // providers
  myProfiles: ProviderProfile[];
  registerProvider: (data: ProviderDraft) => ProviderProfile;
  updateProvider: (id: string, patch: Partial<ProviderProfile>) => void;
  setAvailability: (id: string, status: AvailabilityStatus) => void;
  setVerification: (id: string, status: VerificationStatus) => void;
  // trust
  addReview: (providerId: string, rating: number, comment: string) => void;
  submitReport: (providerId: string, reason: string) => void;
  resolveReport: (reportId: string, status: Report['status']) => void;
  // requests
  logRequest: (req: Omit<ServiceRequest, 'id' | 'createdAt'>) => ServiceRequest;
  updateRequest: (id: string, patch: Partial<ServiceRequest>) => void;
  // admin
  resetDemo: () => void;
}

export type ProviderDraft = Pick<
  ProviderProfile,
  'name' | 'phoneNumber' | 'categoryId' | 'village' | 'district' | 'serviceArea' |
  'experienceYears' | 'description' | 'workingHours' | 'hasWhatsApp'
>;

const StoreContext = createContext<StoreValue | null>(null);

export const DEMO_OTP = '123456';

const emptySearch: SearchState = { query: '', categoryId: null, village: null, availableOnly: false };

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Persisted>(loadPersisted);
  const [screen, setScreen] = useState<Screen>('splash');
  const historyRef = useRef<Screen[]>([]);
  const [search, setSearchState] = useState<SearchState>(emptySearch);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [otpSentTo, setOtpSentTo] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  // Persist every change.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* storage full or unavailable — demo keeps working in memory */
    }
  }, [data]);

  const currentUser = useMemo(
    () => data.users.find((u) => u.id === data.currentUserId) ?? null,
    [data.users, data.currentUserId]
  );

  const t = useCallback(
    (key: StringKey, vars?: Record<string, string | number>) => translate(key, data.language, vars),
    [data.language]
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2800);
  }, []);

  /* ── navigation ─────────────────────────────────────────── */

  const homeScreen = useCallback((): Screen => {
    if (!currentUser) return 'auth';
    if (currentUser.role === 'admin') return 'admin_dashboard';
    if (currentUser.role === 'provider') return 'provider_dashboard';
    return 'customer_home';
  }, [currentUser]);

  const navigate = useCallback((next: Screen) => {
    setScreen((prev) => {
      if (prev !== next && !ENTRY_SCREENS.includes(prev)) historyRef.current = [...historyRef.current.slice(-19), prev];
      return next;
    });
    window.scrollTo({ top: 0 });
  }, []);

  const goBack = useCallback(() => {
    const prev = historyRef.current.pop();
    setScreen(prev ?? homeScreen());
    window.scrollTo({ top: 0 });
  }, [homeScreen]);

  const goHome = useCallback(() => {
    historyRef.current = [];
    setScreen(homeScreen());
    window.scrollTo({ top: 0 });
  }, [homeScreen]);

  const setLanguage = useCallback((language: Language) => setData((d) => ({ ...d, language })), []);

  /* ── auth ───────────────────────────────────────────────── */

  const sendOtp = useCallback((phoneE164: string) => {
    setOtpSentTo(phoneE164);
    showToast(translate('otpDemoSent', data.language));
  }, [data.language, showToast]);

  const verifyOtp = useCallback((code: string): boolean => {
    if (code.trim() !== DEMO_OTP || !otpSentTo) return false;
    setData((d) => {
      const existing = d.users.find((u) => u.phoneNumber === otpSentTo);
      if (existing) return { ...d, currentUserId: existing.id, users: d.users.map((u) => u.id === existing.id ? { ...u, verified: true } : u) };
      const fresh: User = {
        id: uid('u'), name: '', phoneNumber: otpSentTo, role: 'customer', language: d.language,
        createdAt: new Date().toISOString(), verified: true,
      };
      return { ...d, users: [...d.users, fresh], currentUserId: fresh.id };
    });
    return true;
  }, [otpSentTo]);

  const chooseRole = useCallback((role: Role, name?: string) => {
    setData((d) => ({
      ...d,
      users: d.users.map((u) => u.id === d.currentUserId ? { ...u, role, name: name?.trim() || u.name, language: d.language } : u),
    }));
    historyRef.current = [];
    if (role === 'provider') {
      const has = data.providers.some((p) => p.userId === data.currentUserId);
      setScreen(has ? 'provider_dashboard' : 'provider_register');
    } else if (role === 'admin') setScreen('admin_dashboard');
    else setScreen('customer_home');
  }, [data.providers, data.currentUserId]);

  const demoLogin = useCallback((role: Role) => {
    const id = role === 'admin' ? 'u-adm' : role === 'provider' ? 'u-p1' : 'u-c1';
    setData((d) => ({ ...d, currentUserId: id }));
    historyRef.current = [];
    setScreen(role === 'admin' ? 'admin_dashboard' : role === 'provider' ? 'provider_dashboard' : 'customer_home');
  }, []);

  const logout = useCallback(() => {
    setData((d) => ({ ...d, currentUserId: null }));
    setOtpSentTo(null);
    historyRef.current = [];
    setSearchState(emptySearch);
    setScreen('auth');
  }, []);

  /* ── search ─────────────────────────────────────────────── */

  const setSearch = useCallback((patch: Partial<SearchState>) => setSearchState((s) => ({ ...s, ...patch })), []);
  const resetSearch = useCallback(() => setSearchState(emptySearch), []);
  const runSearch = useCallback((filters: SearchFilters) => searchProviders(data.providers, filters), [data.providers]);

  const openProvider = useCallback((id: string) => {
    setSelectedProviderId(id);
    navigate('provider_profile');
  }, [navigate]);

  const selectProvider = useCallback((id: string | null) => setSelectedProviderId(id), []);

  /* ── providers ──────────────────────────────────────────── */

  const registerProvider = useCallback((draft: ProviderDraft): ProviderProfile => {
    const now = new Date().toISOString();
    const profile: ProviderProfile = {
      id: uid('pr'),
      userId: data.currentUserId ?? 'anon',
      ...draft,
      photoUrl: null,
      availabilityStatus: 'AVAILABLE_NOW',
      verificationStatus: 'PHONE_VERIFIED', // OTP already done; Grama360 rep verifies later
      rating: 0,
      reviewCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    setData((d) => ({
      ...d,
      providers: [...d.providers, profile],
      users: d.users.map((u) => u.id === d.currentUserId ? { ...u, role: 'provider', name: u.name || draft.name } : u),
    }));
    return profile;
  }, [data.currentUserId]);

  const updateProvider = useCallback((id: string, patch: Partial<ProviderProfile>) => {
    setData((d) => ({
      ...d,
      providers: d.providers.map((p) => p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p),
    }));
  }, []);

  const setAvailability = useCallback((id: string, status: AvailabilityStatus) => {
    updateProvider(id, { availabilityStatus: status });
  }, [updateProvider]);

  const setVerification = useCallback((id: string, status: VerificationStatus) => {
    updateProvider(id, { verificationStatus: status });
  }, [updateProvider]);

  /* ── trust ──────────────────────────────────────────────── */

  const addReview = useCallback((providerId: string, rating: number, comment: string) => {
    setData((d) => {
      const me = d.users.find((u) => u.id === d.currentUserId);
      const review: Review = {
        id: uid('r'), customerId: me?.id ?? 'anon', providerId,
        customerName: me?.name || (d.language === 'kn' ? 'ಗ್ರಾಹಕ' : 'Customer'),
        rating, comment, createdAt: new Date().toISOString(),
      };
      const reviews = [...d.reviews, review];
      const mine = reviews.filter((r) => r.providerId === providerId);
      const avg = mine.reduce((s, r) => s + r.rating, 0) / mine.length;
      return {
        ...d,
        reviews,
        providers: d.providers.map((p) => p.id === providerId
          ? { ...p, rating: Math.round(avg * 10) / 10, reviewCount: mine.length, updatedAt: review.createdAt }
          : p),
      };
    });
  }, []);

  const submitReport = useCallback((providerId: string, reason: string) => {
    setData((d) => {
      const me = d.users.find((u) => u.id === d.currentUserId);
      const report: Report = {
        id: uid('rep'), reporterId: me?.id ?? 'anon', reporterName: me?.name || 'Anonymous',
        providerId, reason, status: 'OPEN', createdAt: new Date().toISOString(),
      };
      return { ...d, reports: [...d.reports, report] };
    });
  }, []);

  const resolveReport = useCallback((reportId: string, status: Report['status']) => {
    setData((d) => ({ ...d, reports: d.reports.map((r) => r.id === reportId ? { ...r, status } : r) }));
  }, []);

  /* ── requests ───────────────────────────────────────────── */

  const logRequest = useCallback((req: Omit<ServiceRequest, 'id' | 'createdAt'>): ServiceRequest => {
    const full: ServiceRequest = { ...req, id: uid('req'), createdAt: new Date().toISOString() };
    setData((d) => ({ ...d, requests: [full, ...d.requests] }));
    return full;
  }, []);

  const updateRequest = useCallback((id: string, patch: Partial<ServiceRequest>) => {
    setData((d) => ({ ...d, requests: d.requests.map((r) => r.id === id ? { ...r, ...patch } : r) }));
  }, []);

  /* ── admin ──────────────────────────────────────────────── */

  const resetDemo = useCallback(() => {
    const fresh = seedData();
    setData({ ...fresh, language: data.language, currentUserId: data.currentUserId && fresh.users.some((u) => u.id === data.currentUserId) ? data.currentUserId : null });
  }, [data.language, data.currentUserId]);

  /* ── derived ────────────────────────────────────────────── */

  const analytics = useMemo<AnalyticsSnapshot>(() => {
    const byVillage = new Map<string, number>();
    for (const p of data.providers) byVillage.set(p.village, (byVillage.get(p.village) ?? 0) + 1);
    const topVillage = [...byVillage.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
    return {
      totalCustomers: data.users.filter((u) => u.role === 'customer').length,
      totalProviders: data.providers.length,
      availableNow: data.providers.filter((p) => p.availabilityStatus === 'AVAILABLE_NOW').length,
      totalCategories: CATEGORIES.length,
      pendingVerifications: data.providers.filter((p) => p.verificationStatus === 'PENDING').length,
      openReports: data.reports.filter((r) => r.status === 'OPEN' || r.status === 'INVESTIGATING').length,
      requestsThisMonth: data.requests.filter((r) => isThisMonth(r.createdAt)).length,
      topVillage,
    };
  }, [data]);

  const selectedProvider = useMemo(
    () => data.providers.find((p) => p.id === selectedProviderId) ?? null,
    [data.providers, selectedProviderId]
  );

  const myProfiles = useMemo(
    () => (currentUser ? data.providers.filter((p) => p.userId === currentUser.id) : []),
    [data.providers, currentUser]
  );

  const value: StoreValue = {
    language: data.language,
    currentUser,
    users: data.users,
    providers: data.providers,
    reviews: data.reviews,
    reports: data.reports,
    requests: data.requests,
    analytics,
    screen,
    search,
    selectedProvider,
    toast,
    t,
    navigate,
    goBack,
    goHome,
    setLanguage,
    showToast,
    otpSentTo,
    sendOtp,
    verifyOtp,
    chooseRole,
    demoLogin,
    logout,
    setSearch,
    resetSearch,
    runSearch,
    openProvider,
    selectProvider,
    myProfiles,
    registerProvider,
    updateProvider,
    setAvailability,
    setVerification,
    addReview,
    submitReport,
    resolveReport,
    logRequest,
    updateRequest,
    resetDemo,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useAppStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useAppStore must be used inside <AppProvider>');
  return ctx;
}
