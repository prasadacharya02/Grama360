import { useMemo } from 'react';
import { AlertTriangle, BadgeCheck, ChevronRight, ClipboardList, Headset, RefreshCw, ShieldCheck, TrendingUp, UserCheck, Users } from 'lucide-react';
import { useAppStore } from '../../store';
import { CATEGORIES, CATEGORY_BY_ID } from '../../data/catalog';
import { formatPhone, villageLabel } from '../../utils/format';
import { Avatar, CategoryIcon, StatusDot } from '../ui';

export function AdminDashboard() {
  const { t, language: lang, analytics, providers, reports, requests, setVerification, resolveReport, navigate, openProvider, resetDemo, showToast } = useAppStore();

  const pending = providers.filter((p) => p.verificationStatus === 'PENDING');
  const openReports = reports.filter((r) => r.status === 'OPEN' || r.status === 'INVESTIGATING');

  const demand = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of requests) if (r.categoryId) counts.set(r.categoryId, (counts.get(r.categoryId) ?? 0) + 1);
    const max = Math.max(1, ...counts.values());
    return CATEGORIES
      .map((c) => ({ c, n: counts.get(c.id) ?? 0, supply: providers.filter((p) => p.categoryId === c.id).length }))
      .filter((x) => x.n > 0 || x.supply > 0)
      .sort((a, b) => b.n - a.n)
      .slice(0, 8)
      .map((x) => ({ ...x, pct: Math.round((x.n / max) * 100) }));
  }, [requests, providers]);

  const stat = (label: string, value: string | number, Icon: typeof Users, tone: string) => (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-ink/5 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tone}`}><Icon size={22} /></div>
      <div className="min-w-0">
        <p className="text-[11px] font-extrabold text-ink/50 uppercase tracking-wide truncate">{label}</p>
        <p className="text-2xl font-extrabold text-ink leading-tight">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-sand">
      <header className="bg-gradient-to-br from-ink to-earth-800 text-white px-5 pt-5 pb-8 rounded-b-[2.5rem] shadow-xl">
        <h2 className="text-2xl font-extrabold">{t('adminDashboard')}</h2>
        <p className="text-white/70 text-sm font-medium">{t('pilotRegion')}</p>
      </header>

      <main className="px-4 -mt-4 space-y-5">
        <section className="grid grid-cols-2 gap-3">
          {stat(t('providers'), analytics.totalProviders, Users, 'bg-leaf-50 text-leaf-700')}
          {stat(t('availableNowCount'), analytics.availableNow, UserCheck, 'bg-leaf-600 text-white')}
          {stat(t('requestsMonth'), analytics.requestsThisMonth, TrendingUp, 'bg-amber-warm/15 text-amber-deep')}
          {stat(t('customers'), analytics.totalCustomers, ShieldCheck, 'bg-sky-deep/10 text-sky-deep')}
        </section>

        {/* Quick links */}
        <section className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate('operator_desk')} className="bg-gradient-to-br from-leaf-600 to-leaf-700 text-white rounded-3xl p-4 text-left shadow-lg min-h-[96px] flex flex-col justify-between">
            <Headset size={26} />
            <span className="font-extrabold flex items-center gap-1">{t('operatorDesk')} <ChevronRight size={16} /></span>
          </button>
          <button onClick={() => navigate('requests_log')} className="bg-gradient-to-br from-amber-warm to-amber-deep text-white rounded-3xl p-4 text-left shadow-lg min-h-[96px] flex flex-col justify-between">
            <ClipboardList size={26} />
            <span className="font-extrabold flex items-center gap-1">{t('requestsLog')} <ChevronRight size={16} /></span>
          </button>
        </section>

        {/* Pending verifications */}
        <section className="bg-white rounded-3xl p-5 shadow-md border border-ink/5">
          <h3 className="text-lg font-extrabold text-ink mb-3 flex items-center gap-2"><BadgeCheck size={22} className="text-amber-warm" /> {t('pendingVerifications')} <span className="ml-auto text-sm bg-amber-warm/15 text-amber-deep px-2.5 py-0.5 rounded-full">{pending.length}</span></h3>
          {pending.length === 0 && <p className="text-sm text-ink/50 font-medium">{t('noPending')}</p>}
          {pending.map((p) => {
            const c = CATEGORY_BY_ID[p.categoryId];
            return (
              <div key={p.id} className="flex items-center gap-3 py-3 border-b border-ink/5 last:border-0">
                <button onClick={() => openProvider(p.id)} className="min-h-0 flex items-center gap-3 flex-1 text-left">
                  <Avatar name={p.name} size="sm" />
                  <div className="min-w-0">
                    <p className="font-extrabold text-ink truncate">{p.name}</p>
                    <p className="text-xs text-ink/50 font-bold truncate">{lang === 'kn' ? c?.kannadaName : c?.name} · {villageLabel(p.village, lang)} · {formatPhone(p.phoneNumber)}</p>
                  </div>
                </button>
                <button onClick={() => { setVerification(p.id, 'GRAMA360_VERIFIED'); showToast(`✅ ${p.name}`); }} className="min-h-0 h-10 px-3 rounded-xl bg-leaf-600 text-white text-xs font-extrabold">{t('verify')}</button>
                <button onClick={() => setVerification(p.id, 'PHONE_VERIFIED')} className="min-h-0 h-10 px-3 rounded-xl bg-ink/5 text-ink/60 text-xs font-extrabold">{t('keepPending')}</button>
              </div>
            );
          })}
        </section>

        {/* Reports */}
        <section className="bg-white rounded-3xl p-5 shadow-md border border-ink/5">
          <h3 className="text-lg font-extrabold text-ink mb-3 flex items-center gap-2"><AlertTriangle size={22} className="text-red-500" /> {t('reports')} <span className="ml-auto text-sm bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full">{openReports.length}</span></h3>
          {openReports.length === 0 && <p className="text-sm text-ink/50 font-medium">{t('noReports')}</p>}
          {openReports.map((r) => {
            const p = providers.find((x) => x.id === r.providerId);
            return (
              <div key={r.id} className="py-3 border-b border-ink/5 last:border-0">
                <button onClick={() => p && openProvider(p.id)} className="min-h-0 text-left w-full">
                  <p className="font-extrabold text-ink">{p?.name ?? r.providerId} <span className="text-ink/40 font-bold text-xs">· {p && villageLabel(p.village, lang)}</span></p>
                  <p className="text-sm text-ink/70 font-medium mt-0.5">“{r.reason}”</p>
                  <p className="text-xs text-ink/40 font-bold mt-0.5">{t('byPerson', { name: r.reporterName })}</p>
                </button>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => resolveReport(r.id, 'RESOLVED')} className="min-h-0 h-10 px-4 rounded-xl bg-leaf-600 text-white text-xs font-extrabold">{t('resolve')}</button>
                  <button onClick={() => resolveReport(r.id, 'REJECTED')} className="min-h-0 h-10 px-4 rounded-xl bg-red-50 text-red-600 text-xs font-extrabold">{t('reject')}</button>
                </div>
              </div>
            );
          })}
        </section>

        {/* Demand vs supply */}
        <section className="bg-white rounded-3xl p-5 shadow-md border border-ink/5">
          <h3 className="text-lg font-extrabold text-ink mb-1 flex items-center gap-2"><TrendingUp size={22} className="text-leaf-700" /> {t('demandByService')}</h3>
          <p className="text-xs text-ink/50 font-medium mb-3">{lang === 'kn' ? 'ವಿನಂತಿಗಳು vs ನೋಂದಾಯಿತ ಸೇವಾದಾರರು' : 'Requests vs registered providers'}</p>
          <div className="space-y-2.5">
            {demand.map(({ c, n, supply, pct }) => (
              <div key={c.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-extrabold text-ink flex items-center gap-1.5"><CategoryIcon icon={c.icon} size={14} className="text-leaf-700" /> {lang === 'kn' ? c.kannadaName : c.name}</span>
                  <span className="text-xs font-bold text-ink/50">{n} req · {supply} prov</span>
                </div>
                <div className="h-2 bg-earth-100 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-leaf-600 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* All providers */}
        <section className="bg-white rounded-3xl p-5 shadow-md border border-ink/5">
          <h3 className="text-lg font-extrabold text-ink mb-3 flex items-center gap-2"><Users size={22} className="text-leaf-700" /> {t('providers')} <span className="ml-auto text-sm bg-leaf-50 text-leaf-700 px-2.5 py-0.5 rounded-full">{providers.length}</span></h3>
          <div className="divide-y divide-ink/5">
            {providers.map((p) => {
              const c = CATEGORY_BY_ID[p.categoryId];
              return (
                <button key={p.id} onClick={() => openProvider(p.id)} className="min-h-0 w-full flex items-center gap-3 py-2.5 text-left">
                  <StatusDot status={p.availabilityStatus} />
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-ink text-sm truncate">{p.name}</p>
                    <p className="text-xs text-ink/50 font-bold truncate">{lang === 'kn' ? c?.kannadaName : c?.name} · {villageLabel(p.village, lang)}</p>
                  </div>
                  <span className="text-xs font-bold text-ink/40">{formatPhone(p.phoneNumber)}</span>
                </button>
              );
            })}
          </div>
        </section>

        <button onClick={() => { if (window.confirm(t('resetConfirm'))) { resetDemo(); showToast('↺'); } }} className="w-full min-h-0 py-3 text-xs font-bold text-ink/40 flex items-center justify-center gap-2">
          <RefreshCw size={14} /> {t('resetDemo')}
        </button>
      </main>
    </div>
  );
}
