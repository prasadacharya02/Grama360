import { useAppStore } from './store';
import { Splash } from './components/Splash';
import { LanguageSelect } from './components/LanguageSelect';
import { Auth } from './components/Auth';
import { CustomerHome } from './components/Customer/Home';
import { CustomerSearch } from './components/CustomerSearch';
import { ProviderProfile } from './components/ProviderProfile';
import { ProviderRegister } from './components/ProviderRegister';
import { ProviderAvailability } from './components/ProviderAvailability';
import { AdminDashboard } from './components/AdminDashboard';
import { ArrowLeft, Menu } from 'lucide-react';

function ScreenRouter() {
  const { state } = useAppStore();

  switch (state.screen) {
    case 'splash': return <Splash />;
    case 'language': return <LanguageSelect />;
    case 'auth': return <Auth />;
    case 'customer_home': return <CustomerHome />;
    case 'customer_search': return <CustomerSearch />;
    case 'provider_profile': return <ProviderProfile />;
    case 'provider_register': return <ProviderRegister />;
    case 'provider_availability': return <ProviderAvailability />;
    case 'admin_dashboard': return <AdminDashboard />;
    default: return <Splash />;
  }
}

export default function App() {
  const { state, setScreen } = useAppStore();

  return (
    <div className="max-w-md mx-auto min-h-[100dvh] relative overflow-hidden bg-paper shadow-2xl">
      {/* Global header for navigation */}
      {state.screen !== 'splash' && state.screen !== 'language' && state.screen !== 'auth' && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-ink/5 px-4 py-3 flex items-center justify-between shadow-sm max-w-md mx-auto">
          <button onClick={() => setScreen('customer_home')} className="p-2 -ml-2 hover:bg-ink/5 rounded-full transition-colors" aria-label="Back">
            <ArrowLeft size={20} className="text-ink" />
          </button>
          <h1 className="text-base font-extrabold text-ink">Grama360</h1>
          <button onClick={() => { if (state.currentUser?.role === 'admin') setScreen('admin_dashboard'); else alert('Admin access only'); }} className="p-2 -mr-2 hover:bg-ink/5 rounded-full transition-colors" aria-label="Menu">
            <Menu size={20} className="text-ink" />
          </button>
        </div>
      )}

      {/* Main screen */}
      <div className={state.screen !== 'splash' && state.screen !== 'language' && state.screen !== 'auth' ? 'pt-14' : ''}>
        <ScreenRouter />
      </div>
    </div>
  );
}
