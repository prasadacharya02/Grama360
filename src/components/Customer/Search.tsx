import { useMemo } from 'react';
import { Phone, SlidersHorizontal } from 'lucide-react';
import { useAppStore } from '../../store';
import { CATEGORIES, CATEGORY_BY_ID, GRAMA360_HELPLINE, VILLAGES } from '../../data/catalog';
import { parseIntent } from '../../utils/match';
import { formatPhone, telHref, villageLabel } from '../../utils/format';
import { CategoryIcon, Chip } from '../ui';
import { ProviderCard } from '../ProviderCard';
import { SearchBar } from './SearchBar';

export function CustomerSearch() {
  const { t, language: lang, search, setSearch, resetSearch, runSearch } = useAppStore();

  const results = useMemo(() => runSearch(search), [runSearch, search]);
  const intent = useMemo(() => parseIntent(search.query), [search.query]);

  const activeCategory = search.categoryId ? CATEGORY_BY_ID[search.categoryId] : null;
  const understood: string[] = [];
  if (!activeCategory) {
    for (const id of intent.categoryIds) {
      const c = CATEGORY_BY_ID[id];
      if (c) understood.push(lang === 'kn' ? c.kannadaName : c.name);
    }
  }
  if (intent.village && !search.village) understood.push(`📍 ${villageLabel(intent.village, lang)}`);

  const title = activeCategory ? (lang === 'kn' ? activeCategory.kannadaName : activeCategory.name) : t('allServices');
  const hasFilters = search.query || search.categoryId || search.village || search.availableOnly;

  return (
    <div className="min-h-screen bg-sand">
      <header className="bg-gradient-to-br from-leaf-700 to-leaf-600 text-white px-5 pt-4 pb-5 shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          {activeCategory && (
            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <CategoryIcon icon={activeCategory.icon} size={24} />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-2xl font-extrabold truncate">{title}</h2>
            <p className="text-white/80 text-sm font-bold">{t('peopleFound', { n: results.length })}</p>
          </div>
        </div>
        <SearchBar dark value={search.query} onChange={(q) => setSearch({ query: q })} />
        {understood.length > 0 && (
          <p className="mt-2 text-xs font-bold text-white/90 bg-white/10 rounded-xl px-3 py-2 inline-block">
            ✅ {t('understood', { what: understood.join(' · ') })}
          </p>
        )}
      </header>

      {/* Filters */}
      <div className="px-4 py-3 space-y-2 bg-sand sticky top-14 z-30 border-b border-ink/5">
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
          <Chip active={search.availableOnly} onClick={() => setSearch({ availableOnly: !search.availableOnly })}>
            🟢 {t('availableOnly')}
          </Chip>
          <Chip active={!search.categoryId} onClick={() => setSearch({ categoryId: null })}>{t('allServices')}</Chip>
          {CATEGORIES.map((c) => (
            <Chip key={c.id} active={search.categoryId === c.id} onClick={() => setSearch({ categoryId: c.id })}>
              {lang === 'kn' ? c.kannadaName : c.name}
            </Chip>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 items-center">
          <SlidersHorizontal size={16} className="text-ink/40 flex-shrink-0" />
          <Chip active={!search.village} onClick={() => setSearch({ village: null })}>{t('allVillages')}</Chip>
          {VILLAGES.map((v) => (
            <Chip key={v.id} active={search.village === v.name} onClick={() => setSearch({ village: v.name })}>
              📍 {lang === 'kn' ? v.kannadaName : v.name}
            </Chip>
          ))}
        </div>
      </div>

      <main className="px-4 pt-4 space-y-3">
        {results.map((p) => <ProviderCard key={p.id} provider={p} />)}

        {results.length === 0 && (
          <div className="bg-white rounded-3xl p-6 text-center shadow-md border border-ink/5 mt-4">
            <p className="text-4xl mb-2">🤷</p>
            <h3 className="text-lg font-extrabold text-ink">{t('noResults')}</h3>
            <p className="text-sm text-ink/60 font-medium mt-1">{t('noResultsHelp')}</p>
            <a href={telHref(GRAMA360_HELPLINE)} className="mt-4 bg-amber-warm text-white rounded-2xl min-h-[52px] flex items-center justify-center gap-2 font-extrabold shadow-lg">
              <Phone size={20} /> {formatPhone(GRAMA360_HELPLINE)}
            </a>
            {hasFilters && (
              <button onClick={resetSearch} className="mt-3 min-h-0 py-2 text-sm font-extrabold text-leaf-700">{t('clearFilters')}</button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
