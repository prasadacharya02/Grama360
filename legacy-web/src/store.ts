import { useState, useCallback } from 'react';
import {
  User, ServiceCategory, ProviderProfile, Review, Report, AnalyticsSnapshot
} from './types';
import {
  MOCK_USERS, MOCK_PROVIDERS, MOCK_REVIEWS, MOCK_REPORTS, MOCK_ANALYTICS
} from './data/store';

export type Screen =
  | 'splash'
  | 'language'
  | 'auth'
  | 'role'
  | 'customer_home'
  | 'customer_search'
  | 'provider_profile'
  | 'provider_register'
  | 'provider_edit'
  | 'provider_availability'
  | 'admin_dashboard'
  | 'admin_users'
  | 'admin_reports';

export interface AppState {
  screen: Screen;
  language: 'en' | 'kn';
  currentUser: User | null;
  selectedCategory: ServiceCategory | null;
  selectedProvider: ProviderProfile | null;
  searchQuery: string;
  selectedVillage: string;
  reviews: Review[];
  reports: Report[];
  providers: ProviderProfile[];
  analytics: AnalyticsSnapshot;
  editProfileData: Partial<ProviderProfile> | null;
  reviewForm: { rating: number; comment: string };
}

export const initialState: AppState = {
  screen: 'splash',
  language: 'en',
  currentUser: null,
  selectedCategory: null,
  selectedProvider: null,
  searchQuery: '',
  selectedVillage: '',
  reviews: MOCK_REVIEWS,
  reports: MOCK_REPORTS,
  providers: MOCK_PROVIDERS,
  analytics: MOCK_ANALYTICS,
  editProfileData: null,
  reviewForm: { rating: 5, comment: '' },
};

export function useAppStore() {
  const [state, setState] = useState<AppState>(initialState);
  const [otpInput, setOtpInput] = useState('');
  const [otpSentTo, setOtpSentTo] = useState('');

  const t = useCallback(
    (en: string, kn: string) => (state.language === 'kn' ? kn : en),
    [state.language]
  );

  const setScreen = useCallback(
    (screen: Screen) => setState((s) => ({ ...s, screen })),
    []
  );

  const setLanguage = useCallback(
    (lang: 'en' | 'kn') => setState((s) => ({ ...s, language: lang })),
    []
  );

  const setSelectedCategory = useCallback(
    (cat: ServiceCategory | null) => setState((s) => ({ ...s, selectedCategory: cat })),
    []
  );

  const setSearchQuery = useCallback(
    (q: string) => setState((s) => ({ ...s, searchQuery: q })),
    []
  );

  const loginAs = useCallback(
    (user: User) => {
      setState((s) => ({ ...s, currentUser: user }));
      if (user.role === 'customer') setScreen('customer_home');
      else if (user.role === 'provider') {
        const p = MOCK_PROVIDERS.find((pr) => pr.userId === user.id);
        if (!p) setScreen('provider_register');
        else setScreen('customer_home'); // will navigate to provider control
      }
      else if (user.role === 'admin') setScreen('admin_dashboard');
    },
    [setScreen]
  );

  const sendOtp = useCallback((phone: string) => {
    setOtpSentTo(phone);
    setOtpInput('');
    // Simulate OTP sent
    setTimeout(() => {
      alert('OTP 123456 sent to ' + phone + ' (for demo purposes)');
    }, 300);
  }, []);

  const verifyOtp = useCallback(
    (code: string, skipScreen: boolean = false) => {
      if (code !== '123456') {
        alert('Invalid OTP. Try 123456');
        return false;
      }
      const user = MOCK_USERS.find((u) => u.phoneNumber === otpSentTo);
      if (user) {
        if (!skipScreen) loginAs(user);
        else {
          setState((s) => ({ ...s, currentUser: user }));
        }
        return true;
      }
      // New user
      const newUser: User = {
        id: 'new-' + Date.now(),
        name: 'New User',
        phoneNumber: otpSentTo,
        role: 'customer',
        language: state.language,
        createdAt: new Date().toISOString(),
        verified: true,
      };
      if (!skipScreen) loginAs(newUser);
      else {
        setState((s) => ({ ...s, currentUser: newUser }));
      }
      return true;
    },
    [otpSentTo, loginAs, state.language]
  );

  const registerProvider = useCallback(
    (data: Partial<ProviderProfile>) => {
      const newProfile: ProviderProfile = {
        id: 'pr-new-' + Date.now(),
        userId: state.currentUser?.id || 'unknown',
        categoryId: data.categoryId || 'auto',
        village: data.village || '',
        district: data.district || '',
        serviceArea: data.serviceArea || '',
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        experienceYears: data.experienceYears || 0,
        description: data.description || '',
        availabilityStatus: 'AVAILABLE_NOW',
        verificationStatus: 'PENDING',
        rating: 0,
        reviewCount: 0,
        phoneNumber: state.currentUser?.phoneNumber || '',
        photoUrl: null,
        workingHours: data.workingHours || '8 AM - 6 PM',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setState((s) => ({
        ...s,
        providers: [...s.providers, newProfile],
        selectedProvider: newProfile,
      }));
      setScreen('provider_availability');
    },
    [state.currentUser, setScreen]
  );

  const updateProviderProfile = useCallback(
    (profile: ProviderProfile) => {
      setState((s) => ({
        ...s,
        providers: s.providers.map((p) => (p.id === profile.id ? profile : p)),
        selectedProvider: profile,
      }));
    },
    []
  );

  const updateAvailability = useCallback(
    (status: ProviderProfile['availabilityStatus']) => {
      setState((s) => {
        const updatedProviders = s.providers.map((p) =>
          p.userId === s.currentUser?.id ? { ...p, availabilityStatus: status, updatedAt: new Date().toISOString() } : p
        );
        return { ...s, providers: updatedProviders };
      });
    },
    [state.currentUser?.id]
  );

  const addReview = useCallback(
    (providerId: string, rating: number, comment: string) => {
      const newReview: Review = {
        id: 'r-' + Date.now(),
        customerId: state.currentUser?.id || 'anon',
        providerId,
        customerName: state.currentUser?.name || 'Customer',
        rating,
        comment,
        createdAt: new Date().toISOString(),
      };
      setState((s) => ({
        ...s,
        reviews: [...s.reviews, newReview],
        providers: s.providers.map((p) => {
          if (p.id !== providerId) return p;
          const all = [...s.reviews.filter((r) => r.providerId === providerId), newReview];
          const avg = all.reduce((sum, r) => sum + r.rating, 0) / all.length;
          return { ...p, rating: Math.round(avg * 10) / 10, reviewCount: all.length, updatedAt: new Date().toISOString() };
        }),
      }));
    },
    [state.currentUser]
  );

  const submitReport = useCallback(
    (providerId: string, reason: string) => {
      const newReport: Report = {
        id: 'rep-' + Date.now(),
        reporterId: state.currentUser?.id || 'anon',
        reporterName: state.currentUser?.name || 'Anonymous',
        providerId,
        reason,
        status: 'OPEN',
        createdAt: new Date().toISOString(),
      };
      setState((s) => ({ ...s, reports: [...s.reports, newReport] }));
    },
    [state.currentUser]
  );

  const verifyProvider = useCallback(
    (providerId: string, status: ProviderProfile['verificationStatus']) => {
      setState((s) => ({
        ...s,
        providers: s.providers.map((p) => (p.id === providerId ? { ...p, verificationStatus: status } : p)),
      }));
    },
    []
  );

  const resolveReport = useCallback(
    (reportId: string, status: Report['status']) => {
      setState((s) => ({ ...s, reports: s.reports.map((r) => (r.id === reportId ? { ...r, status } : r)) }));
    },
    []
  );

  const filteredProviders = () => {
    let list = state.providers;
    if (state.selectedCategory) list = list.filter((p) => p.categoryId === state.selectedCategory!.id);
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.village.toLowerCase().includes(q) ||
          p.district.toLowerCase().includes(q) ||
          p.serviceArea.toLowerCase().includes(q)
      );
    }
    if (state.selectedVillage) {
      const v = state.selectedVillage.toLowerCase();
      list = list.filter(
        (p) =>
          p.village.toLowerCase().includes(v) || p.serviceArea.toLowerCase().includes(v)
      );
    }
    return list;
  };

  const providerForUser = () => state.providers.find((p) => p.userId === state.currentUser?.id);

  return {
    state,
    setScreen,
    setLanguage,
    t,
    otpInput,
    setOtpInput,
    otpSentTo,
    sendOtp,
    verifyOtp,
    loginAs,
    registerProvider,
    updateProviderProfile,
    updateAvailability,
    addReview,
    submitReport,
    verifyProvider,
    resolveReport,
    filteredProviders,
    setSelectedCategory,
    setSearchQuery,
    analytics: MOCK_ANALYTICS,
    providerForUser,
    initialState,
  };
}
