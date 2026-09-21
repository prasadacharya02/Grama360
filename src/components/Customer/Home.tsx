import { Search, MapPin, Phone, ChevronRight, Star, Car, Zap, Droplets, Hammer, BookOpen, Store, Tractor, Wrench } from 'lucide-react';
import { useAppStore } from '../../store';
import { CATEGORY_MAP } from '../../data/store';

const iconMap: Record<string, any> = { Car, Zap, Droplets, Hammer, Wrench, Tractor, BookOpen, Store };

export function CustomerHome() {
  const { state, setScreen, setSelectedCategory, setSearchQuery } = useAppStore();
  const lang = state.language;

  return (
    <div className="min-h-screen bg-sand">
      {/* Header */}
      <header className="bg-gradient-to-r from-leaf-700 to-leaf-600 text-white px-5 pt-10 pb-8 rounded-b-[2.5rem] shadow-xl">
        <h1 className="text-3xl font-extrabold mb-1 font-[Noto_Serif_Kannada]">ಗ್ರಾಮ ಸೇವೆ</h1>
        <h2 className="text-lg font-medium opacity-90">Find local help near you</h2>
        <div className="mt-5 relative">
          <input
            value={state.searchQuery}
            onChange={(e) => setSearchQuery?.(e.target.value)}
            placeholder={lang === 'kn' ? 'ಹೆಸರು / ಗ್ರಾಮ ಹುಡುಕಿ' : 'Search service or village...'}
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/15 backdrop-blur border-2 border-white/20 text-white placeholder:text-white/60 text-lg font-semibold shadow-inner focus:outline-none focus:bg-white/20 focus:border-white/50"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70" size={22} />
        </div>
      </header>

      <main className="px-4 -mt-6 space-y-6 pb-24">
        {/* Quick categories */}
        <section>
          <h3 className="text-xl font-extrabold text-ink mb-4 px-1">Categories</h3>
          <div className="grid grid-cols-3 gap-3">
            {CATEGORY_MAP.map((cat) => {
              const Icon = iconMap[cat.icon] || Wrench;
              return (
                <button
                  key={cat.id}
                  onClick={() => { setScreen('customer_search'); setSelectedCategory(cat); }}
                  className="bg-white rounded-2xl p-4 shadow-md border border-ink/5 hover:border-leaf-400 hover:shadow-lg transition-all active:scale-[0.97] flex flex-col items-center gap-2"
                >
                  <div className="w-12 h-12 rounded-xl bg-leaf-50 text-leaf-600 flex items-center justify-center shadow-inner">
                    <Icon size={24} strokeWidth={2.5} />
                  </div>
                  <span className="text-xs font-bold text-ink leading-tight text-center">{lang === 'kn' ? cat.kannadaName : cat.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Nearby / Featured Providers */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-xl font-extrabold text-ink">Nearby Services</h3>
            <button
              onClick={() => { setScreen('customer_search'); setSelectedCategory(null); }}
              className="text-sm font-bold text-leaf-600 hover:text-leaf-800 flex items-center gap-1"
            >
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {state.providers.filter((p) => p.availabilityStatus === 'AVAILABLE_NOW').slice(0, 4).map((p) => {
              const cat = CATEGORY_MAP.find((c) => c.id === p.categoryId);
              return (
                <button
                  key={p.id}
                  onClick={() => { setScreen('provider_profile'); /* profile set in App router */ }}
                  className="w-full bg-white rounded-3xl p-5 shadow-md border border-ink/5 hover:border-leaf-300 hover:shadow-xl transition-all flex gap-4 items-start text-left active:scale-[0.99]"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-leaf-500 to-leaf-700 text-white flex items-center justify-center text-xl font-extrabold shadow-lg flex-shrink-0">
                    {p.village[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-lg font-extrabold text-ink truncate">{p.village}</h4>
                      <span className="bg-leaf-100 text-leaf-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide">Verified</span>
                    </div>
                    <p className="text-sm text-ink/60 font-medium">{cat?.name || 'Service'}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-sm font-bold text-amber-warm">
                        <Star size={14} fill="currentColor" /> {p.rating}
                      </span>
                      <span className="text-xs text-ink/40">• {p.reviewCount} reviews</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="w-3 h-3 rounded-full bg-leaf-500 animate-pulse" />
                    <span className="text-xs text-leaf-600 font-bold">Available</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-ink/5 px-5 py-3 flex justify-around shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50">
        <button onClick={() => setScreen('customer_home')} className="flex flex-col items-center gap-1 text-leaf-600 font-extrabold text-xs">
          <div className="w-9 h-9 rounded-full bg-leaf-50 flex items-center justify-center"><MapPin size={18} /></div>
          Home
        </button>
        <button onClick={() => setScreen('customer_search')} className="flex flex-col items-center gap-1 text-ink/40 font-bold text-xs hover:text-ink">
          <div className="w-9 h-9 rounded-full bg-ink/5 flex items-center justify-center"><Search size={18} /></div>
          Search
        </button>
        <button onClick={() => { const user = state.currentUser; if (user?.role === 'provider') setScreen('provider_availability'); else alert('Login as provider first'); }} className="flex flex-col items-center gap-1 text-ink/40 font-bold text-xs hover:text-ink">
          <div className="w-9 h-9 rounded-full bg-ink/5 flex items-center justify-center"><Phone size={18} /></div>
          Profile
        </button>
      </nav>
    </div>
  );
}
