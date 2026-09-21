import { useMemo } from 'react';
import { ClipboardList, IndianRupee } from 'lucide-react';
import { useAppStore } from '../../store';
import { CATEGORY_BY_ID } from '../../data/catalog';
import { channelLabel } from '../../i18n';
import { formatPhone, isThisMonth, timeAgo, villageLabel } from '../../utils/format';
import type { ServiceRequest } from '../../types';
import { cn } from '../../utils/cn';

const STATUS_STYLE: Record<ServiceRequest['status'], string> = {
  OPEN: 'bg-amber-warm/15 text-amber-deep',
  CONNECTED: 'bg-sky-deep/10 text-sky-deep',
  COMPLETED: 'bg-leaf-50 text-leaf-700',
  CANCELLED: 'bg-stone-100 text-stone-500',
};

const STATUS_KN: Record<ServiceRequest['status'], string> = {
  OPEN: 'ಬಾಕಿ', CONNECTED: 'ಸಂಪರ್ಕವಾಗಿದೆ', COMPLETED: 'ಪೂರ್ಣ', CANCELLED: 'ರದ್ದು',
};

/** The pilot's spreadsheet: every request, where it came from, who handled it. */
export function RequestsLog() {
  const { t, language: lang, requests, providers, updateRequest } = useAppStore();

  const monthly = useMemo(() => requests.filter((r) => isThisMonth(r.createdAt)), [requests]);
  const completed = monthly.filter((r) => r.status === 'COMPLETED' || r.status === 'CONNECTED').length;

  const byChannel = useMemo(() => {
    const m = new Map<ServiceRequest['channel'], number>();
    for (const r of monthly) m.set(r.channel, (m.get(r.channel) ?? 0) + 1);
    return m;
  }, [monthly]);

  return (
    <div className="min-h-screen bg-sand">
      <header className="bg-gradient-to-br from-ink to-earth-800 text-white px-5 pt-5 pb-8 rounded-b-[2.5rem] shadow-xl">
        <h2 className="text-2xl font-extrabold flex items-center gap-2"><ClipboardList size={26} /> {t('requestsLog')}</h2>
        <p className="text-white/70 text-sm font-medium mt-1">{t('requestsLogDesc')}</p>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-white/10 rounded-2xl p-3">
            <p className="text-[10px] font-extrabold text-white/60 uppercase">{t('thisMonth')}</p>
            <p className="text-2xl font-extrabold">{monthly.length}</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3">
            <p className="text-[10px] font-extrabold text-white/60 uppercase">{t('connect')}</p>
            <p className="text-2xl font-extrabold">{completed}</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3">
            <p className="text-[10px] font-extrabold text-white/60 uppercase flex items-center gap-0.5"><IndianRupee size={10} /> @100</p>
            <p className="text-2xl font-extrabold">₹{(completed * 100).toLocaleString('en-IN')}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          {(['call', 'whatsapp', 'walk_in', 'app'] as const).map((c) => (
            <span key={c} className="text-xs font-bold bg-white/10 rounded-full px-3 py-1">{channelLabel(c, lang)}: {byChannel.get(c) ?? 0}</span>
          ))}
        </div>
      </header>

      <main className="px-4 -mt-4 space-y-3">
        {requests.length === 0 && <p className="text-center text-ink/50 font-medium py-10">{t('noRequests')}</p>}
        {requests.map((r) => {
          const cat = r.categoryId ? CATEGORY_BY_ID[r.categoryId] : null;
          const provider = r.providerId ? providers.find((p) => p.id === r.providerId) : null;
          return (
            <article key={r.id} className="bg-white rounded-3xl p-4 shadow-md border border-ink/5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-extrabold text-ink truncate">
                    {cat ? (lang === 'kn' ? cat.kannadaName : cat.name) : '—'}
                    {r.village && <span className="text-ink/50 font-bold"> · 📍 {villageLabel(r.village, lang)}</span>}
                  </p>
                  <p className="text-sm text-ink/70 font-medium mt-0.5 break-words">“{r.note || '—'}”</p>
                </div>
                <span className={cn('text-[11px] font-extrabold px-2.5 py-1 rounded-full flex-shrink-0', STATUS_STYLE[r.status])}>
                  {lang === 'kn' ? STATUS_KN[r.status] : r.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/50 font-bold mt-2">
                <span>{channelLabel(r.channel, lang)}</span>
                {r.callerName && <span>👤 {r.callerName}</span>}
                {r.callerPhone && <span>📞 {formatPhone(r.callerPhone)}</span>}
                <span>{timeAgo(r.createdAt, lang)}</span>
              </div>
              {provider && (
                <p className="text-sm font-bold text-leaf-700 mt-2">→ {provider.name} · {formatPhone(provider.phoneNumber)}</p>
              )}
              {(r.status === 'OPEN' || r.status === 'CONNECTED') && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => updateRequest(r.id, { status: 'COMPLETED' })} className="min-h-0 h-10 px-4 rounded-xl bg-leaf-600 text-white text-xs font-extrabold">✅ {t('markCompleted')}</button>
                  <button onClick={() => updateRequest(r.id, { status: 'CANCELLED' })} className="min-h-0 h-10 px-4 rounded-xl bg-ink/5 text-ink/60 text-xs font-extrabold">{t('markCancelled')}</button>
                </div>
              )}
            </article>
          );
        })}
      </main>
    </div>
  );
}
