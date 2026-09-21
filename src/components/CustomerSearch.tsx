import { ArrowLeft } from 'lucide-react';
import { useAppStore } from '../store';
import { CATEGORY_MAP } from '../data/store';

export function CustomerSearch() {
  const { state, setScreen } = useAppStore();
  const list = state.providers.filter((p) => {
    let ok = true;
    if (state.selectedCategory) ok = ok && p.categoryId === state.selectedCategory.id;
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      ok = ok && (p.village.toLowerCase().includes(q) || p.district.toLowerCase().includes(q) || p.serviceArea.toLowerCase().includes(q));
    }
    return ok;
  });

  return (
    <div className="min-h-screen bg-sand">
      <header className="bg-gradient-to-r from-leaf-700 to-leaf-500 text-white px-5 pt-10 pb-6 shadow-xl">
        <button onClick={() => setScreen('customer_home')} className="text-white/90 hover:text-white mb-4 font-bold text-sm flex items-center gap-2"><ArrowLeft size={20}/> Back</button>
        <h2 className="text-2xl font-extrabold">Search Results</h2>
        <p className="text-white/80 text-sm">{state.selectedCategory ? (state.language === 'kn' ? state.selectedCategory.kannadaName : state.selectedCategory.name) : 'All Services'}</p>
      </header>
      <main className="px-4 -mt-4 space-y-3 pb-20">
        {list.map(p => {
          const cat = CATEGORY_MAP.find(c => c.id === p.categoryId);
          return (
            <button key={p.id} onClick={() => { setScreen('provider_profile'); }} className="w-full bg-white rounded-3xl p-5 shadow-md border border-ink/5 text-left hover:shadow-xl transition-all">
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-leaf-500 to-leaf-700 text-white flex items-center justify-center text-xl font-extrabold shadow-lg flex-shrink-0">{p.village[0]}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-extrabold text-ink truncate">{p.village}</h4>
                  <p className="text-xs text-ink/50 font-medium">{cat?.name} • {p.district}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-amber-warm text-xs font-extrabold">★ {p.rating}</span>
                    <span className="text-xs text-ink/30">{p.reviewCount} reviews</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${p.availabilityStatus === 'AVAILABLE_NOW' ? 'bg-green-500 animate-pulse' : 'bg-amber-400'}`} />
                  <span className="text-[10px] font-extrabold text-ink/40">{p.availabilityStatus.replace('_', ' ')}</span>
                </div>
              </div>
            </button>
          );
        })}
        {list.length === 0 && <p className="text-center text-ink/40 py-10 text-sm">No results found. Try another search.</p>}
      </main>
    </div>
  );
}
