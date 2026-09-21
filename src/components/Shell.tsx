import { ArrowLeft, Briefcase, ClipboardList, Headset, Home, LogOut, Search, ShieldCheck } from 'lucide-react';
import { useAppStore, type Screen } from '../store';
import { cn } from '../utils/cn';

/** Top bar: back, title, language toggle, logout. */
export function AppHeader({ title }: { title?: string }) {
  const { language, setLanguage, goBack, logout, currentUser, t } = useAppStore();
  return (
    <div className="fixed top-0 left-0 right-0 z-40 max-w-md mx-auto bg-paper/90 backdrop-blur-xl border-b border-ink/5">
      <div className="h-14 px-2 flex items-center justify-between">
        <button onClick={goBack} className="min-h-0 h-10 w-10 rounded-full hover:bg-ink/5 flex items-center justify-center" aria-label={t('back')}>
          <ArrowLeft size={22} className="text-ink" />
        </button>
        <h1 className="text-base font-extrabold text-ink truncate px-2">{title ?? t('appName')}</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setLanguage(language === 'kn' ? 'en' : 'kn')}
            className="min-h-0 h-9 px-3 rounded-full bg-leaf-50 text-leaf-700 text-xs font-extrabold border border-leaf-500/20"
            aria-label="Toggle language"
          >
            {language === 'kn' ? 'English' : 'ಕನ್ನಡ'}
          </button>
          {currentUser && (
            <button onClick={logout} className="min-h-0 h-10 w-10 rounded-full hover:bg-ink/5 flex items-center justify-center" aria-label={t('logout')}>
              <LogOut size={18} className="text-ink/60" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface NavItem { screen: Screen; label: string; icon: typeof Home; match: Screen[] }

/** Bottom navigation — role aware. */
export function BottomNav() {
  const { screen, navigate, currentUser, t, myProfiles, resetSearch } = useAppStore();
  const role = currentUser?.role ?? 'customer';

  const items: NavItem[] = [
    { screen: 'customer_home', label: t('home'), icon: Home, match: ['customer_home'] },
    { screen: 'customer_search', label: t('search'), icon: Search, match: ['customer_search', 'provider_profile'] },
  ];
  if (role === 'admin') {
    items.push({ screen: 'operator_desk', label: t('operatorDesk'), icon: Headset, match: ['operator_desk'] });
    items.push({ screen: 'requests_log', label: t('requestsLog'), icon: ClipboardList, match: ['requests_log'] });
    items.push({ screen: 'admin_dashboard', label: t('admin'), icon: ShieldCheck, match: ['admin_dashboard'] });
  } else if (role === 'provider' || myProfiles.length > 0) {
    items.push({ screen: 'provider_dashboard', label: t('myService'), icon: Briefcase, match: ['provider_dashboard', 'provider_edit', 'provider_register'] });
  } else {
    items.push({ screen: 'provider_register', label: t('becomeProvider'), icon: Briefcase, match: ['provider_register'] });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto bg-white/95 backdrop-blur-xl border-t border-ink/5 shadow-[0_-10px_40px_rgba(0,0,0,0.06)]">
      <div className="flex justify-around px-2 pt-2 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
        {items.map((item) => {
          const active = item.match.includes(screen);
          const Icon = item.icon;
          return (
            <button
              key={item.screen}
              onClick={() => { if (item.screen === 'customer_search') resetSearch(); navigate(item.screen); }}
              className={cn('min-h-0 flex-1 flex flex-col items-center gap-1 py-1 text-[11px] font-extrabold', active ? 'text-leaf-700' : 'text-ink/40')}
            >
              <span className={cn('w-10 h-8 rounded-full flex items-center justify-center', active && 'bg-leaf-50')}>
                <Icon size={20} strokeWidth={active ? 2.6 : 2} />
              </span>
              <span className="truncate max-w-[5.5rem]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
