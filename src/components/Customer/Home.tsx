import { ChevronRight, Phone } from 'lucide-react';
import { useAppStore } from '../../store';
import { CATEGORIES, EMERGENCY_CONTACTS, GRAMA360_HELPLINE, GROUPS, VILLAGES } from '../../data/catalog';
import { formatPhone, telHref, villageLabel } from '../../utils/format';
import { CategoryIcon, SectionTitle } from '../ui';
import { ProviderCard } from '../ProviderCard';
import { SearchBar } from './SearchBar';

export function CustomerHome() {
  const { t, language: lang, currentUser, search, setSearch, navigate, runSearch } = useAppStore();

  const goSearch = (patch: Parameters<typeof setSearch>[0]) => {
    setSearch({ query: '', categoryId: null, ...patch });
    navigate('customer_search');
  };

  const availableNow = runSearch({ village: search.village, availableOnly: true }).slice(0, 4);
  const greeting = currentUser?.name ? (lang === 'kn' ? `ನಮಸ್ಕಾರ, ${currentUser.name}` : `Namaskara, ${currentUser.name}`) : (lang === 'kn' ? 'ನಮಸ್ಕಾರ' : 'Namaskara');

  return (
    <div className="min-h-screen bg-sand">
      <header className="bg-gradient-to-br from-leaf-700 to-leaf-600 text-white px-5 pt-5 pb-8 rounded-b-[2.5rem] shadow-xl">
        <p className="text-white/80 text-sm font-bold">{greeting} 🙏</p>
        <h1 className="text-2xl font-extrabold mt-0.5">{t('findHelp')}</h1>

        <div className="mt-4">
          <SearchBar
            dark
            value={search.query}
            onChange={(q) => setSearch({ query: q })}
            onSubmit={(q) => goSearch({ query: q })}
          />
        </div>

        {/* Village picker — the pilot is hyper-local */}
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
          <button
            onClick={() => setSearch({ village: null })}
            className={`min-h-0 h-9 px-3.5 rounded-full text-xs font-extrabold whitespace-nowrap border ${!search.village ? 'bg-white text-leaf-700 border-white' : 'bg-white/10 text-white border-white/20'}`}
          >
            {t('allVillages')}
          </button>
          {VILLAGES.slice(0, 8).map((v) => (
            <button
              key={v.id}
              onClick={() => setSearch({ village: v.name })}
              className={`min-h-0 h-9 px-3.5 rounded-full text-xs font-extrabold whitespace-nowrap border ${search.village === v.name ? 'bg-white text-leaf-700 border-white' : 'bg-white/10 text-white border-white/20'}`}
            >
              📍 {lang === 'kn' ? v.kannadaName : v.name}
            </button>
          ))}
        </div>
      </header>

      <main className="px-4 -mt-4 space-y-7">
        {/* Services grouped by the launch pillars */}
        {GROUPS.map((g) => {
          const cats = CATEGORIES.filter((c) => c.group === g.id);
          return (
            <section key={g.id}>
              <SectionTitle>
                <span className="mr-1.5">{g.emoji}</span>{lang === 'kn' ? g.kannadaName : g.name}
              </SectionTitle>
              <div className="grid grid-cols-3 gap-2.5">
                {cats.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => goSearch({ categoryId: cat.id })}
                    className="bg-white rounded-2xl px-2 py-3.5 shadow-sm border border-ink/5 hover:border-leaf-400 hover:shadow-md transition-all active:scale-[0.97] flex flex-col items-center gap-2 min-h-[6.5rem]"
                  >
                    <div className="w-12 h-12 rounded-xl bg-leaf-50 text-leaf-700 flex items-center justify-center">
                      <CategoryIcon icon={cat.icon} size={26} />
                    </div>
                    <span className="text-[12px] font-extrabold text-ink leading-tight text-center">
                      {lang === 'kn' ? cat.kannadaName : cat.name}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          );
        })}

        {/* Available right now */}
        <section>
          <SectionTitle
            action={
              <button onClick={() => goSearch({ availableOnly: true })} className="min-h-0 text-sm font-extrabold text-leaf-700 flex items-center gap-1">
                {t('viewAll')} <ChevronRight size={16} />
              </button>
            }
          >
            🟢 {t('availableNear')}{search.village ? ` · ${villageLabel(search.village, lang)}` : ''}
          </SectionTitle>
          <div className="space-y-3">
            {availableNow.map((p) => <ProviderCard key={p.id} provider={p} compact />)}
            {availableNow.length === 0 && <p className="text-sm text-ink/50 font-medium px-1">{t('noResults')}</p>}
          </div>
        </section>

        {/* Keypad-phone path */}
        <section className="bg-gradient-to-br from-amber-warm to-amber-deep text-white rounded-3xl p-5 shadow-xl">
          <h3 className="text-lg font-extrabold leading-tight">{t('noSmartphone')}</h3>
          <p className="text-white/85 text-sm font-medium mt-1">{t('noSmartphoneDesc')}</p>
          <a href={telHref(GRAMA360_HELPLINE)} className="mt-4 bg-white text-amber-deep rounded-2xl min-h-[52px] flex items-center justify-center gap-2 font-extrabold text-lg shadow-lg active:scale-[0.98]">
            <Phone size={20} strokeWidth={2.5} /> {formatPhone(GRAMA360_HELPLINE)}
          </a>
        </section>

        {/* Emergency */}
        <section>
          <SectionTitle>🚨 {t('emergency')}</SectionTitle>
          <div className="grid grid-cols-5 gap-2">
            {EMERGENCY_CONTACTS.map((c) => (
              <a key={c.id} href={telHref(c.number)} className="bg-white rounded-2xl py-3 px-1 shadow-sm border border-red-100 flex flex-col items-center gap-1 active:scale-95">
                <CategoryIcon icon={c.icon} size={20} className="text-red-600" />
                <span className="text-sm font-extrabold text-ink">{c.number}</span>
                <span className="text-[9px] font-bold text-ink/50 text-center leading-tight">{lang === 'kn' ? c.kannadaName : c.name}</span>
              </a>
            ))}
          </div>
        </section>

        <p className="text-center text-xs text-ink/40 pb-2">{t('pilotRegion')}</p>
      </main>
    </div>
  );
}
