import { AppProvider, useAppStore, type Screen } from './store';
import { Splash } from './components/Splash';
import { LanguageSelect } from './components/LanguageSelect';
import { Auth } from './components/Auth';
import { CustomerHome } from './components/Customer/Home';
import { CustomerSearch } from './components/Customer/Search';
import { ProviderPublicProfile } from './components/Provider/PublicProfile';
import { ProviderForm } from './components/Provider/ProviderForm';
import { ProviderDashboard } from './components/Provider/Dashboard';
import { AdminDashboard } from './components/Admin/Dashboard';
import { OperatorDesk } from './components/Admin/OperatorDesk';
import { RequestsLog } from './components/Admin/RequestsLog';
import { AppHeader, BottomNav } from './components/Shell';
import { Toast } from './components/ui';

const FULLSCREEN: Screen[] = ['splash', 'language', 'auth'];

function ScreenRouter({ screen }: { screen: Screen }) {
  switch (screen) {
    case 'splash': return <Splash />;
    case 'language': return <LanguageSelect />;
    case 'auth': return <Auth />;
    case 'customer_home': return <CustomerHome />;
    case 'customer_search': return <CustomerSearch />;
    case 'provider_profile': return <ProviderPublicProfile />;
    case 'provider_register': return <ProviderForm mode="register" />;
    case 'provider_edit': return <ProviderForm mode="edit" />;
    case 'provider_dashboard': return <ProviderDashboard />;
    case 'admin_dashboard': return <AdminDashboard />;
    case 'operator_desk': return <OperatorDesk />;
    case 'requests_log': return <RequestsLog />;
    default: return <Splash />;
  }
}

function Frame() {
  const { screen, toast } = useAppStore();
  const chrome = !FULLSCREEN.includes(screen);
  return (
    <div className="max-w-md mx-auto min-h-[100dvh] relative bg-paper shadow-2xl">
      {chrome && <AppHeader />}
      <div className={chrome ? 'pt-14 pb-24' : ''}>
        <ScreenRouter screen={screen} />
      </div>
      {chrome && <BottomNav />}
      <Toast message={toast} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Frame />
    </AppProvider>
  );
}
