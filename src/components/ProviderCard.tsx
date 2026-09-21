import { MapPin, MessageCircle, Phone, Star } from 'lucide-react';
import { CATEGORY_BY_ID } from '../data/catalog';
import { useAppStore } from '../store';
import type { ProviderProfile } from '../types';
import { formatPhone, telHref, villageLabel, whatsappHref } from '../utils/format';
import { Avatar, CategoryIcon, StatusPill, VerifiedBadge, isHighlyRated } from './ui';

/**
 * The card a customer sees in a search result:
 *   👤 Ravi · 🚕 Auto Driver · 📍 Brahmavara · 🟢 Available now · 📞 Call Ravi
 * Calling is one tap — no booking flow.
 */
export function ProviderCard({ provider, compact = false }: { provider: ProviderProfile; compact?: boolean }) {
  const { language: lang, t, openProvider, logRequest, currentUser } = useAppStore();
  const cat = CATEGORY_BY_ID[provider.categoryId];
  const offline = provider.availabilityStatus === 'OFFLINE';

  const recordCall = () => {
    // Every tap on "Call" is a service request — that is the pilot's key metric.
    logRequest({
      channel: 'app',
      callerName: currentUser?.name || '',
      callerPhone: currentUser?.phoneNumber || '',
      village: '',
      categoryId: provider.categoryId,
      note: `Called ${provider.name} from app`,
      providerId: provider.id,
      status: 'CONNECTED',
    });
  };

  return (
    <article className={`bg-white rounded-3xl shadow-md border border-ink/5 overflow-hidden ${offline ? 'opacity-75' : ''}`}>
      <button type="button" onClick={() => openProvider(provider.id)} className="w-full text-left p-4 flex gap-3 items-start min-h-0 hover:bg-earth-50/60 transition-colors">
        <Avatar name={provider.name} size={compact ? 'sm' : 'md'} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-lg font-extrabold text-ink leading-tight truncate">{provider.name}</h4>
            <StatusPill status={provider.availabilityStatus} lang={lang} className="flex-shrink-0" />
          </div>
          <p className="text-sm font-bold text-leaf-700 flex items-center gap-1.5 mt-1">
            <CategoryIcon icon={cat?.icon ?? 'Wrench'} size={15} />
            {lang === 'kn' ? cat?.kannadaName : cat?.name}
          </p>
          <p className="text-sm text-ink/60 font-medium flex items-center gap-1 mt-0.5">
            <MapPin size={14} className="text-ink/40" /> {villageLabel(provider.village, lang)}
            {provider.serviceArea.length > 1 && (
              <span className="text-ink/40 text-xs">+{provider.serviceArea.length - 1}</span>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <VerifiedBadge status={provider.verificationStatus} lang={lang} />
            {provider.reviewCount > 0 ? (
              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-deep">
                <Star size={12} fill="currentColor" /> {provider.rating.toFixed(1)}
                <span className="text-ink/40 font-bold">({provider.reviewCount})</span>
              </span>
            ) : (
              <span className="text-[11px] font-bold text-ink/40">{t('newOnGrama')}</span>
            )}
            {isHighlyRated(provider) && (
              <span className="text-[11px] font-extrabold text-amber-deep">🏆 {t('highlyRated')}</span>
            )}
          </div>
        </div>
      </button>

      <div className="px-4 pb-4 flex gap-2">
        <a
          href={telHref(provider.phoneNumber)}
          onClick={recordCall}
          className="flex-1 bg-leaf-600 hover:bg-leaf-700 text-white rounded-2xl min-h-[52px] px-4 flex items-center justify-center gap-2 font-extrabold shadow-lg active:scale-[0.98] transition-transform"
        >
          <Phone size={20} strokeWidth={2.5} />
          <span className="truncate">{t('call')} · {formatPhone(provider.phoneNumber)}</span>
        </a>
        {provider.hasWhatsApp && (
          <a
            href={whatsappHref(provider.phoneNumber, lang === 'kn' ? 'ನಮಸ್ಕಾರ, ಗ್ರಾಮ360 ಮೂಲಕ ನಿಮ್ಮ ನಂಬರ್ ಸಿಕ್ಕಿತು.' : 'Hello, I found your number on Grama360.')}
            target="_blank"
            rel="noreferrer"
            onClick={recordCall}
            aria-label={t('whatsapp')}
            className="w-[52px] min-h-[52px] rounded-2xl bg-[#25D366]/15 text-[#128C7E] flex items-center justify-center border border-[#25D366]/30 active:scale-[0.96]"
          >
            <MessageCircle size={22} strokeWidth={2.5} />
          </a>
        )}
      </div>
    </article>
  );
}
