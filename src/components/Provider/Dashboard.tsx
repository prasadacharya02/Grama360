import { useEffect, useState } from 'react';
import { BadgeCheck, CheckCircle2, Eye, Pencil, Phone, Plus, Share2, Star } from 'lucide-react';
import { useAppStore } from '../../store';
import { CATEGORY_BY_ID } from '../../data/catalog';
import { statusLabel } from '../../i18n';
import type { AvailabilityStatus, ProviderProfile } from '../../types';
import { formatPhone, timeAgo, villageLabel } from '../../utils/format';
import { cn } from '../../utils/cn';
import { CategoryIcon, VerifiedBadge } from '../ui';
import { ProviderCard } from '../ProviderCard';

const OPTIONS: { key: AvailabilityStatus; emoji: string; label: 'meAvailable' | 'meBusy' | 'meOffline'; desc: 'meAvailableDesc' | 'meBusyDesc' | 'meOfflineDesc'; cls: string; active: string }[] = [
  { key: 'AVAILABLE_NOW', emoji: '🟢', label: 'meAvailable', desc: 'meAvailableDesc', cls: 'border-leaf-500/30', active: 'bg-leaf-600 text-white border-leaf-600' },
  { key: 'BUSY', emoji: '🟡', label: 'meBusy', desc: 'meBusyDesc', cls: 'border-amber-warm/30', active: 'bg-amber-warm text-white border-amber-warm' },
  { key: 'OFFLINE', emoji: '⚪', label: 'meOffline', desc: 'meOfflineDesc', cls: 'border-stone-300', active: 'bg-stone-600 text-white border-stone-600' },
];

export function ProviderDashboard() {
  const { t, language: lang, myProfiles, currentUser, setAvailability, navigate, openProvider, selectProvider, reviews, requests, showToast } = useAppStore();
  const [activeId, setActiveId] = useState<string | null>(myProfiles[0]?.id ?? null);

  useEffect(() => {
    if (!activeId || !myProfiles.some((p) => p.id === activeId)) setActiveId(myProfiles[0]?.id ?? null);
  }, [myProfiles, activeId]);

  const profile: ProviderProfile | undefined = myProfiles.find((p) => p.id === activeId) ?? myProfiles[0];

  if (!currentUser || !profile) {
    return (
      <div className="px-5 pt-8 text-center">
        <p className="text-5xl mb-3">🧑‍🔧</p>
        <h2 className="text-xl font-extrabold text-ink">{t('registerTitle')}</h2>
        <p className="text-ink/60 text-sm font-medium mt-1">{t('registerSubtitle')}</p>
        <button onClick={() => navigate('provider_register')} className="mt-5 w-full bg-amber-warm text-white text-lg font-extrabold rounded-2xl py-4 shadow-xl">{t('becomeProvider')}</button>
      </div>
    );
  }

  const cat = CATEGORY_BY_ID[profile.categoryId];
  const myReviews = reviews.filter((r) => r.providerId === profile.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const myRequests = requests.filter((r) => r.providerId === profile.id).slice(0, 5);

  const change = (status: AvailabilityStatus) => {
    setAvailability(profile.id, status);
    showToast(t('statusUpdated', { status: statusLabel(status, lang) }));
  };

  const share = async () => {
    const text = lang === 'kn'
      ? `ನಾನು ${profile.name}, ${cat?.kannadaName} – ${villageLabel(profile.village, 'kn')}.\n📞 ${formatPhone(profile.phoneNumber)}\nಗ್ರಾಮ360 ನಲ್ಲಿ ನನ್ನನ್ನು ಹುಡುಕಿ.`
      : `I am ${profile.name}, ${cat?.name} – ${profile.village}.\n📞 ${formatPhone(profile.phoneNumber)}\nFind me on Grama360.`;
    try {
      if (navigator.share) await navigator.share({ title: `${profile.name} · Grama360`, text });
      else { await navigator.clipboard.writeText(text); showToast(t('copied')); }
    } catch { /* cancelled */ }
  };

  return (
    <div className="min-h-screen bg-sand">
      <header className="bg-gradient-to-br from-leaf-700 to-leaf-600 text-white px-5 pt-5 pb-8 rounded-b-[2.5rem] shadow-xl">
        <p className="text-white/80 text-sm font-bold">{lang === 'kn' ? 'ನಮಸ್ಕಾರ' : 'Namaskara'}, {profile.name.split(' ')[0]} 🙏</p>
        <h1 className="text-2xl font-extrabold mt-0.5 flex items-center gap-2">
          <CategoryIcon icon={cat?.icon ?? 'Wrench'} size={24} /> {lang === 'kn' ? cat?.kannadaName : cat?.name}
        </h1>
        <p className="text-white/80 text-sm font-medium">📍 {villageLabel(profile.village, lang)} · 📞 {formatPhone(profile.phoneNumber)}</p>

        {myProfiles.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar -mx-5 px-5">
            {myProfiles.map((p) => {
              const c = CATEGORY_BY_ID[p.categoryId];
              return (
                <button key={p.id} onClick={() => setActiveId(p.id)} className={cn('min-h-0 h-9 px-3.5 rounded-full text-xs font-extrabold whitespace-nowrap border', p.id === profile.id ? 'bg-white text-leaf-700 border-white' : 'bg-white/10 text-white border-white/20')}>
                  {lang === 'kn' ? c?.kannadaName : c?.name}
                </button>
              );
            })}
          </div>
        )}
      </header>

      <main className="px-4 -mt-4 space-y-4">
        {/* THE key feature: one-tap availability */}
        <section className="bg-white rounded-3xl p-4 shadow-xl border border-ink/5">
          <h3 className="text-lg font-extrabold text-ink mb-3 px-1">{t('myStatus')}</h3>
          <div className="space-y-2.5">
            {OPTIONS.map((o) => {
              const active = profile.availabilityStatus === o.key;
              return (
                <button
                  key={o.key}
                  onClick={() => change(o.key)}
                  className={cn('w-full rounded-2xl p-4 text-left border-2 transition-all flex items-center gap-3 min-h-[72px]', active ? o.active + ' shadow-lg scale-[1.01]' : 'bg-white ' + o.cls)}
                >
                  <span className="text-2xl">{o.emoji}</span>
                  <div className="flex-1">
                    <p className="text-lg font-extrabold leading-tight">{t(o.label)}</p>
                    <p className={cn('text-xs font-medium mt-0.5', active ? 'text-white/85' : 'text-ink/50')}>{t(o.desc)}</p>
                  </div>
                  {active && <CheckCircle2 size={26} strokeWidth={2.5} />}
                </button>
              );
            })}
          </div>
        </section>

        {/* Verification status */}
        <section className={cn('rounded-3xl p-4 border flex items-start gap-3', profile.verificationStatus === 'GRAMA360_VERIFIED' ? 'bg-amber-warm/10 border-amber-warm/30' : 'bg-white border-ink/5 shadow-md')}>
          <BadgeCheck size={26} className={profile.verificationStatus === 'GRAMA360_VERIFIED' ? 'text-amber-warm' : 'text-ink/30'} />
          <div className="flex-1">
            <VerifiedBadge status={profile.verificationStatus} lang={lang} size="md" />
            <p className="text-xs text-ink/60 font-medium mt-2">
              {profile.verificationStatus === 'GRAMA360_VERIFIED' ? t('verifiedDesc') : t('verificationPendingDesc')}
            </p>
          </div>
        </section>

        {/* Preview + actions */}
        <section>
          <h3 className="text-lg font-extrabold text-ink mb-3 px-1">{t('howCustomersSee')}</h3>
          <ProviderCard provider={profile} />
          <div className="grid grid-cols-3 gap-2 mt-3">
            <button onClick={() => { openProvider(profile.id); }} className="bg-white rounded-2xl py-3 shadow-sm border border-ink/5 flex flex-col items-center gap-1 text-xs font-extrabold text-ink">
              <Eye size={20} className="text-leaf-700" /> {t('viewPublic')}
            </button>
            <button onClick={() => { selectProvider(profile.id); navigate('provider_edit'); }} className="bg-white rounded-2xl py-3 shadow-sm border border-ink/5 flex flex-col items-center gap-1 text-xs font-extrabold text-ink">
              <Pencil size={20} className="text-leaf-700" /> {t('editProfile')}
            </button>
            <button onClick={share} className="bg-white rounded-2xl py-3 shadow-sm border border-ink/5 flex flex-col items-center gap-1 text-xs font-extrabold text-ink">
              <Share2 size={20} className="text-leaf-700" /> {t('share')}
            </button>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-ink/5">
            <p className="text-xs font-bold text-ink/50 flex items-center gap-1"><Star size={12} /> {t('reviews')}</p>
            <p className="text-2xl font-extrabold text-ink mt-1">{profile.reviewCount > 0 ? `★ ${profile.rating.toFixed(1)}` : '—'} <span className="text-sm text-ink/40">({profile.reviewCount})</span></p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-ink/5">
            <p className="text-xs font-bold text-ink/50 flex items-center gap-1"><Phone size={12} /> {t('requestsForMe')}</p>
            <p className="text-2xl font-extrabold text-ink mt-1">{requests.filter((r) => r.providerId === profile.id).length}</p>
          </div>
        </section>

        {(myReviews.length > 0 || myRequests.length > 0) && (
          <section className="bg-white rounded-3xl p-5 shadow-md border border-ink/5 space-y-4">
            {myReviews.length > 0 && (
              <div>
                <h3 className="text-base font-extrabold text-ink mb-2">{t('myReviews')}</h3>
                {myReviews.map((r) => (
                  <div key={r.id} className="border-b border-ink/5 last:border-0 py-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-ink">{r.customerName}</span>
                      <span className="text-amber-deep text-xs font-extrabold">{'★'.repeat(r.rating)}</span>
                    </div>
                    <p className="text-sm text-ink/70 font-medium">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
            {myRequests.length > 0 && (
              <div>
                <h3 className="text-base font-extrabold text-ink mb-2">{t('requestsForMe')}</h3>
                {myRequests.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b border-ink/5 last:border-0">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-ink truncate">{r.callerName || (lang === 'kn' ? 'ಗ್ರಾಹಕ' : 'Customer')}{r.village ? ` · ${villageLabel(r.village, lang)}` : ''}</p>
                      <p className="text-xs text-ink/50 truncate">{r.note}</p>
                    </div>
                    <span className="text-[11px] text-ink/40 font-bold flex-shrink-0 ml-2">{timeAgo(r.createdAt, lang)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <button onClick={() => navigate('provider_register')} className="w-full bg-white rounded-2xl py-4 shadow-sm border-2 border-dashed border-ink/15 flex items-center justify-center gap-2 font-extrabold text-ink/70">
          <Plus size={20} /> {t('addAnotherService')}
        </button>
      </main>
    </div>
  );
}
