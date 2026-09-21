import { useMemo, useState } from 'react';
import { Headset, MapPin, Phone, Star } from 'lucide-react';
import { useAppStore } from '../../store';
import { CATEGORIES, CATEGORY_BY_ID, VILLAGES } from '../../data/catalog';
import { parseIntent } from '../../utils/match';
import { formatPhone, telHref, toE164, villageLabel } from '../../utils/format';
import { statusLabel } from '../../i18n';
import type { RequestChannel } from '../../types';
import { Avatar, CategoryIcon, Chip, Field, StatusPill, VerifiedBadge, inputClass } from '../ui';
import { SearchBar } from '../Customer/SearchBar';
import { cn } from '../../utils/cn';

const CHANNELS: { id: RequestChannel; emoji: string }[] = [
  { id: 'call', emoji: '📞' },
  { id: 'whatsapp', emoji: '💬' },
  { id: 'walk_in', emoji: '🏪' },
];

/**
 * Operator desk — the "human IVR".
 * A keypad-phone user calls the Grama360 number and says "ನನಗೆ ಆಟೋ ಬೇಕು".
 * The operator types (or dictates) that sentence, the intent parser picks the
 * service + village, and the desk shows who is available with a Kannada
 * read-out script. One tap logs the request and marks it connected.
 */
export function OperatorDesk() {
  const { t, language: lang, runSearch, logRequest, showToast } = useAppStore();
  const [said, setSaid] = useState('');
  const [channel, setChannel] = useState<RequestChannel>('call');
  const [callerName, setCallerName] = useState('');
  const [callerPhone, setCallerPhone] = useState('');
  const [village, setVillage] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [availableOnly, setAvailableOnly] = useState(true);

  const intent = useMemo(() => parseIntent(said), [said]);
  const effectiveCategory = categoryId ?? intent.categoryIds[0] ?? null;
  const effectiveVillage = village ?? intent.village;

  const results = useMemo(
    () => runSearch({ categoryId: effectiveCategory, village: effectiveVillage, availableOnly }),
    [runSearch, effectiveCategory, effectiveVillage, availableOnly]
  );

  const cat = effectiveCategory ? CATEGORY_BY_ID[effectiveCategory] : null;

  const reset = () => { setSaid(''); setCallerName(''); setCallerPhone(''); setVillage(null); setCategoryId(null); };

  const connect = (providerId: string | null) => {
    const provider = providerId ? results.find((p) => p.id === providerId) : null;
    logRequest({
      channel,
      callerName: callerName.trim(),
      callerPhone: toE164(callerPhone) ?? callerPhone.trim(),
      village: effectiveVillage ?? '',
      categoryId: effectiveCategory,
      note: said.trim(),
      providerId,
      status: providerId ? 'CONNECTED' : 'OPEN',
    });
    showToast(provider ? t('connectedTo', { name: provider.name }) : t('requestLogged'));
    reset();
  };

  // Kannada script the operator reads out, e.g.
  // "ಬ್ರಹ್ಮಾವರದಲ್ಲಿ ರವಿ, ಆಟೋ ಚಾಲಕ, ಈಗ ಲಭ್ಯ. ಫೋನ್: 98453 60001"
  const readOut = (p: (typeof results)[number]) => {
    const c = CATEGORY_BY_ID[p.categoryId];
    return lang === 'kn'
      ? `${villageLabel(p.village, 'kn')}ದಲ್ಲಿ ${p.name}, ${c?.kannadaName}, ${statusLabel(p.availabilityStatus, 'kn')}. ಫೋನ್: ${formatPhone(p.phoneNumber)}`
      : `${p.name}, ${c?.name} in ${p.village}, ${statusLabel(p.availabilityStatus, 'en').toLowerCase()}. Phone: ${formatPhone(p.phoneNumber)}`;
  };

  return (
    <div className="min-h-screen bg-sand">
      <header className="bg-gradient-to-br from-ink to-earth-800 text-white px-5 pt-5 pb-8 rounded-b-[2.5rem] shadow-xl">
        <h2 className="text-2xl font-extrabold flex items-center gap-2"><Headset size={26} /> {t('operatorDesk')}</h2>
        <p className="text-white/70 text-sm font-medium mt-1">{t('operatorDeskDesc')}</p>
        <div className="flex gap-2 mt-4">
          {CHANNELS.map((c) => (
            <button key={c.id} onClick={() => setChannel(c.id)} className={cn('min-h-0 h-10 px-4 rounded-full text-sm font-extrabold border', channel === c.id ? 'bg-white text-ink border-white' : 'bg-white/10 text-white border-white/20')}>
              {c.emoji} {c.id === 'call' ? (lang === 'kn' ? 'ಕರೆ' : 'Call') : c.id === 'whatsapp' ? (lang === 'kn' ? 'ವಾಟ್ಸಾಪ್' : 'WhatsApp') : (lang === 'kn' ? 'ನೇರ ಭೇಟಿ' : 'Walk-in')}
            </button>
          ))}
        </div>
      </header>

      <main className="px-4 -mt-4 space-y-4">
        {/* 1. What did they say */}
        <section className="bg-white rounded-3xl p-4 shadow-xl border border-ink/5 space-y-4">
          <div>
            <p className="text-sm font-extrabold text-ink mb-2">1. {t('callerSaid')}</p>
            <SearchBar value={said} onChange={setSaid} />
          </div>

          <div className="bg-earth-50 rounded-2xl p-3">
            <p className="text-xs font-extrabold text-ink/50 uppercase tracking-wide mb-2">{t('matchedCategory')}</p>
            {cat ? (
              <div className="flex items-center gap-2 text-leaf-700 font-extrabold">
                <CategoryIcon icon={cat.icon} size={20} /> {lang === 'kn' ? cat.kannadaName : cat.name}
                {effectiveVillage && <span className="text-ink/60 font-bold">· 📍 {villageLabel(effectiveVillage, lang)}</span>}
                {(categoryId || village) && <button onClick={() => { setCategoryId(null); setVillage(null); }} className="min-h-0 ml-auto text-xs text-ink/50 font-bold">{t('clearFilters')}</button>}
              </div>
            ) : (
              <p className="text-sm text-ink/60 font-medium">{t('nothingDetected')}</p>
            )}
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-3 px-3 mt-2">
              {CATEGORIES.map((c) => (
                <Chip key={c.id} active={effectiveCategory === c.id} onClick={() => setCategoryId(c.id)} className="h-9 text-xs">
                  {lang === 'kn' ? c.kannadaName : c.name}
                </Chip>
              ))}
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-3 px-3 mt-2">
              <Chip active={!effectiveVillage} onClick={() => setVillage(null)} className="h-9 text-xs">{t('allVillages')}</Chip>
              {VILLAGES.map((v) => (
                <Chip key={v.id} active={effectiveVillage === v.name} onClick={() => setVillage(v.name)} className="h-9 text-xs">📍 {lang === 'kn' ? v.kannadaName : v.name}</Chip>
              ))}
            </div>
          </div>

          {/* 2. Caller details */}
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('callerName')}>
              <input value={callerName} onChange={(e) => setCallerName(e.target.value)} className={inputClass} />
            </Field>
            <Field label={t('callerPhone')}>
              <input type="tel" inputMode="numeric" value={callerPhone} onChange={(e) => setCallerPhone(e.target.value)} placeholder="98450 00000" className={inputClass} />
            </Field>
          </div>
        </section>

        {/* 3. Results */}
        <section>
          <div className="flex items-center justify-between px-1 mb-2">
            <h3 className="text-lg font-extrabold text-ink">{t('peopleFound', { n: results.length })}</h3>
            <Chip active={availableOnly} onClick={() => setAvailableOnly(!availableOnly)} className="h-9 text-xs">🟢 {t('availableOnly')}</Chip>
          </div>
          <div className="space-y-3">
            {results.map((p) => {
              const c = CATEGORY_BY_ID[p.categoryId];
              return (
                <article key={p.id} className="bg-white rounded-3xl p-4 shadow-md border border-ink/5">
                  <div className="flex gap-3 items-start">
                    <Avatar name={p.name} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-lg font-extrabold text-ink truncate">{p.name}</h4>
                        <StatusPill status={p.availabilityStatus} lang={lang} />
                      </div>
                      <p className="text-sm font-bold text-leaf-700">{lang === 'kn' ? c?.kannadaName : c?.name}</p>
                      <p className="text-sm text-ink/60 font-medium flex items-center gap-1"><MapPin size={13} /> {villageLabel(p.village, lang)} · {p.serviceArea.map((v) => villageLabel(v, lang)).join(', ')}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <VerifiedBadge status={p.verificationStatus} lang={lang} />
                        {p.reviewCount > 0 && <span className="text-xs font-extrabold text-amber-deep flex items-center gap-0.5"><Star size={11} fill="currentColor" /> {p.rating.toFixed(1)}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 bg-leaf-50 border border-leaf-500/20 rounded-2xl p-3">
                    <p className="text-[10px] font-extrabold text-leaf-700 uppercase tracking-wide mb-1">🗣️ {t('readOut')}</p>
                    <p className="text-[15px] font-bold text-ink leading-snug font-kannada">{readOut(p)}</p>
                  </div>

                  <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                    <button onClick={() => connect(p.id)} className="bg-leaf-600 text-white rounded-2xl min-h-[52px] font-extrabold flex items-center justify-center gap-2 shadow-lg">
                      ✅ {t('connect')} · {p.name.split(' ')[0]}
                    </button>
                    <a href={telHref(p.phoneNumber)} className="w-[52px] min-h-[52px] rounded-2xl bg-ink/5 text-ink flex items-center justify-center" aria-label={t('call')}>
                      <Phone size={22} />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>

          <button onClick={() => connect(null)} disabled={!said.trim() && !effectiveCategory} className="mt-4 w-full bg-white rounded-2xl py-4 border-2 border-dashed border-ink/15 font-extrabold text-ink/60 disabled:opacity-40">
            📝 {t('logWithoutProvider')}
          </button>
        </section>
      </main>
    </div>
  );
}
