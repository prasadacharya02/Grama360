import { useState } from 'react';
import { BadgeCheck, Clock, Flag, MapPin, MessageCircle, Phone, Share2, ShieldCheck, Star, Trophy } from 'lucide-react';
import { useAppStore } from '../../store';
import { CATEGORY_BY_ID } from '../../data/catalog';
import { formatPhone, telHref, timeAgo, villageLabel, whatsappHref } from '../../utils/format';
import { Avatar, CategoryIcon, StatusPill, isHighlyRated } from '../ui';

export function ProviderPublicProfile() {
  const { t, language: lang, selectedProvider: p, reviews, addReview, submitReport, showToast, logRequest, currentUser, goBack } = useAppStore();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState('');

  if (!p) {
    return (
      <div className="p-6 text-center">
        <p className="text-ink/60 font-medium">{t('noResults')}</p>
        <button onClick={goBack} className="mt-4 text-leaf-700 font-extrabold">{t('back')}</button>
      </div>
    );
  }

  const cat = CATEGORY_BY_ID[p.categoryId];
  const myReviews = reviews.filter((r) => r.providerId === p.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const isOwner = currentUser?.id === p.userId;

  const recordCall = () => logRequest({
    channel: 'app', callerName: currentUser?.name || '', callerPhone: currentUser?.phoneNumber || '', village: '',
    categoryId: p.categoryId, note: `Called ${p.name} from profile`, providerId: p.id, status: 'CONNECTED',
  });

  const share = async () => {
    const text = lang === 'kn'
      ? `${p.name} – ${cat?.kannadaName} – ${villageLabel(p.village, 'kn')}\n📞 ${formatPhone(p.phoneNumber)}\nಗ್ರಾಮ360 ಮೂಲಕ`
      : `${p.name} – ${cat?.name} – ${p.village}\n📞 ${formatPhone(p.phoneNumber)}\nvia Grama360`;
    try {
      if (navigator.share) await navigator.share({ title: `${p.name} · Grama360`, text });
      else { await navigator.clipboard.writeText(text); showToast(t('copied')); }
    } catch { /* user cancelled */ }
  };

  const sendReview = () => {
    addReview(p.id, rating, comment.trim() || (lang === 'kn' ? 'ಉತ್ತಮ ಸೇವೆ' : 'Good service'));
    setReviewOpen(false); setComment(''); setRating(5);
    showToast(t('reviewThanks'));
  };

  const sendReport = () => {
    if (!reason.trim()) return;
    submitReport(p.id, reason.trim());
    setReportOpen(false); setReason('');
    showToast(t('reportSent'));
  };

  return (
    <div className="min-h-screen bg-sand">
      <header className="bg-gradient-to-br from-leaf-700 to-leaf-600 text-white px-5 pt-5 pb-10 rounded-b-[2.5rem] shadow-xl">
        <div className="flex items-start gap-4">
          <Avatar name={p.name} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-extrabold leading-tight">{p.name}</h1>
            <p className="text-white/90 font-bold flex items-center gap-1.5 mt-1">
              <CategoryIcon icon={cat?.icon ?? 'Wrench'} size={16} /> {lang === 'kn' ? cat?.kannadaName : cat?.name}
            </p>
            <p className="text-white/80 text-sm font-medium flex items-center gap-1 mt-0.5">
              <MapPin size={14} /> {villageLabel(p.village, lang)}, {lang === 'kn' ? 'ಉಡುಪಿ' : p.district}
            </p>
            <div className="mt-2"><StatusPill status={p.availabilityStatus} lang={lang} /></div>
          </div>
        </div>
      </header>

      <main className="px-4 -mt-6 space-y-4">
        {/* Call / WhatsApp / Share */}
        <div className="bg-white rounded-3xl p-4 shadow-xl border border-ink/5">
          <a href={telHref(p.phoneNumber)} onClick={recordCall} className="bg-leaf-600 hover:bg-leaf-700 text-white rounded-2xl min-h-[60px] flex items-center justify-center gap-3 text-xl font-extrabold shadow-lg active:scale-[0.98] pulse-ring">
            <Phone size={24} strokeWidth={2.5} /> {t('callName', { name: p.name.split(' ')[0] })}
          </a>
          <p className="text-center text-2xl font-extrabold text-ink tracking-wider mt-3">{formatPhone(p.phoneNumber)}</p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {p.hasWhatsApp ? (
              <a href={whatsappHref(p.phoneNumber)} target="_blank" rel="noreferrer" onClick={recordCall} className="rounded-2xl min-h-[48px] flex items-center justify-center gap-2 font-extrabold bg-[#25D366]/15 text-[#128C7E] border border-[#25D366]/30">
                <MessageCircle size={20} /> {t('whatsapp')}
              </a>
            ) : <span />}
            <button onClick={share} className="min-h-[48px] rounded-2xl flex items-center justify-center gap-2 font-extrabold bg-ink/5 text-ink">
              <Share2 size={18} /> {t('share')}
            </button>
          </div>
        </div>

        {/* Details */}
        <section className="bg-white rounded-3xl p-5 shadow-md border border-ink/5 space-y-3">
          <h3 className="text-lg font-extrabold text-ink">{t('about')}</h3>
          {p.description && <p className="text-ink/80 leading-relaxed text-[15px] font-medium">{p.description}</p>}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-earth-50 rounded-2xl p-3">
              <p className="text-ink/50 text-xs font-bold flex items-center gap-1"><Clock size={12} /> {t('workingHours')}</p>
              <p className="font-extrabold text-ink mt-0.5">{p.workingHours}</p>
            </div>
            <div className="bg-earth-50 rounded-2xl p-3">
              <p className="text-ink/50 text-xs font-bold flex items-center gap-1"><Star size={12} /> {t('reviews')}</p>
              <p className="font-extrabold text-ink mt-0.5">
                {p.reviewCount > 0 ? `★ ${p.rating.toFixed(1)} (${p.reviewCount})` : t('newOnGrama')}
                <span className="text-ink/50 font-bold"> · {t('yearsExp', { n: p.experienceYears })}</span>
              </p>
            </div>
          </div>
          <div>
            <p className="text-ink/50 text-xs font-bold mb-1.5">{t('worksIn')}</p>
            <div className="flex flex-wrap gap-1.5">
              {p.serviceArea.map((v) => (
                <span key={v} className="bg-leaf-50 text-leaf-700 text-xs font-extrabold px-2.5 py-1 rounded-full">📍 {villageLabel(v, lang)}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Verification & trust */}
        <section className="bg-white rounded-3xl p-5 shadow-md border border-ink/5">
          <h3 className="text-lg font-extrabold text-ink mb-3">{t('verification')}</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <ShieldCheck size={22} className="text-leaf-600 flex-shrink-0" />
              <div>
                <p className="font-extrabold text-ink">{t('phoneVerified')}</p>
                <p className="text-xs text-ink/50 font-medium">{t('phoneVerifiedDesc')}</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <BadgeCheck size={22} className={p.verificationStatus === 'GRAMA360_VERIFIED' ? 'text-amber-warm flex-shrink-0' : 'text-ink/20 flex-shrink-0'} />
              <div>
                <p className={`font-extrabold ${p.verificationStatus === 'GRAMA360_VERIFIED' ? 'text-ink' : 'text-ink/40'}`}>
                  {p.verificationStatus === 'GRAMA360_VERIFIED' ? t('grama360Verified') : t('pendingVerification')}
                </p>
                <p className="text-xs text-ink/50 font-medium">{t('verifiedDesc')}</p>
              </div>
            </li>
            {isHighlyRated(p) && (
              <li className="flex items-start gap-3">
                <Trophy size={22} className="text-amber-warm flex-shrink-0" />
                <p className="font-extrabold text-ink">{t('highlyRated')}</p>
              </li>
            )}
          </ul>
        </section>

        {/* Reviews */}
        <section className="bg-white rounded-3xl p-5 shadow-md border border-ink/5">
          <h3 className="text-lg font-extrabold text-ink mb-3">{t('reviews')}</h3>
          {myReviews.length === 0 && <p className="text-ink/50 text-sm font-medium">{t('noReviews')}</p>}
          {myReviews.map((r) => (
            <div key={r.id} className="border-b border-ink/5 last:border-0 py-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-ink">{r.customerName}</span>
                <span className="text-amber-deep text-xs font-extrabold">{'★'.repeat(r.rating)}<span className="text-ink/20">{'★'.repeat(5 - r.rating)}</span></span>
              </div>
              <p className="text-sm text-ink/70 font-medium mt-0.5">{r.comment}</p>
              <p className="text-[11px] text-ink/40 mt-1">{timeAgo(r.createdAt, lang)}</p>
            </div>
          ))}

          {!isOwner && !reviewOpen && (
            <button onClick={() => setReviewOpen(true)} className="mt-3 w-full bg-leaf-50 text-leaf-700 rounded-2xl py-3 font-extrabold hover:bg-leaf-100">
              {t('writeReview')}
            </button>
          )}
          {reviewOpen && (
            <div className="mt-3 bg-earth-50 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-extrabold text-ink">{t('yourRating')}</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setRating(n)} className="min-h-0 w-11 h-11 text-3xl leading-none" aria-label={`${n} star`}>
                    <span className={n <= rating ? 'text-amber-warm' : 'text-ink/15'}>★</span>
                  </button>
                ))}
              </div>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder={t('yourComment')} className="w-full px-4 py-3 rounded-xl bg-white text-ink font-medium border-2 border-ink/10 focus:border-leaf-500 focus:outline-none resize-none" />
              <div className="flex gap-2">
                <button onClick={sendReview} className="flex-1 bg-leaf-600 text-white rounded-xl py-3 font-extrabold">{t('submit')}</button>
                <button onClick={() => setReviewOpen(false)} className="px-5 rounded-xl bg-white text-ink/60 font-extrabold border border-ink/10">{t('cancel')}</button>
              </div>
            </div>
          )}
        </section>

        {/* Report */}
        {!isOwner && (
          <section>
            {!reportOpen ? (
              <button onClick={() => setReportOpen(true)} className="w-full min-h-0 py-3 text-sm font-extrabold text-red-600/80 flex items-center justify-center gap-2">
                <Flag size={16} /> {t('reportTitle')}
              </button>
            ) : (
              <div className="bg-red-50 border border-red-100 rounded-3xl p-4 space-y-3">
                <p className="text-sm font-extrabold text-red-700">{t('reportReason')}</p>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="w-full px-4 py-3 rounded-xl bg-white text-ink font-medium border-2 border-red-100 focus:border-red-400 focus:outline-none resize-none" />
                <div className="flex gap-2">
                  <button onClick={sendReport} disabled={!reason.trim()} className="flex-1 bg-red-600 text-white rounded-xl py-3 font-extrabold disabled:opacity-40">{t('submit')}</button>
                  <button onClick={() => setReportOpen(false)} className="px-5 rounded-xl bg-white text-ink/60 font-extrabold border border-ink/10">{t('cancel')}</button>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
