import { ArrowLeft, Phone, MapPin, Clock, ShieldCheck, Star, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../store';
import { CATEGORY_MAP } from '../data/store';

export function ProviderProfile() {
  const { state, setScreen, addReview, submitReport } = useAppStore();
  const p = state.selectedProvider || state.providers[0];
  const cat = CATEGORY_MAP.find((c: any) => c.id === p?.categoryId);
  const reviews = state.reviews.filter((r) => r.providerId === p?.id);

  return (
    <div className="min-h-screen bg-sand">
      <header className="bg-gradient-to-r from-leaf-700 to-leaf-500 text-white px-5 pt-10 pb-8 rounded-b-[3rem] shadow-xl">
        <button onClick={() => setScreen('customer_home')} className="flex items-center gap-2 text-white/90 hover:text-white mb-4 font-bold text-sm">
          <ArrowLeft size={20} /> Back
        </button>
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-3xl bg-white/15 backdrop-blur flex items-center justify-center text-3xl font-extrabold shadow-inner border border-white/20">
            {p?.village?.[0] || '?'}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">{p?.village}</h1>
            <p className="text-white/80 font-medium">{cat?.kannadaName || cat?.name}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-extrabold">{p?.district}</span>
              <span className={`w-2.5 h-2.5 rounded-full ${p?.availabilityStatus === 'AVAILABLE_NOW' ? 'bg-green-300 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="text-xs font-bold">{p?.availabilityStatus === 'AVAILABLE_NOW' ? 'Available Now' : p?.availabilityStatus}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="px-5 -mt-8 space-y-6 pb-24">
        {/* Quick actions */}
        <div className="bg-white rounded-3xl p-5 shadow-xl border border-ink/5">
          <div className="grid grid-cols-2 gap-3">
            <a href={`tel:${p?.phoneNumber}`} className="bg-leaf-600 text-white rounded-2xl py-5 text-center shadow-lg active:scale-[0.97] flex flex-col items-center gap-2">
              <Phone size={24} strokeWidth={2.5} />
              <span className="font-extrabold">Call Now</span>
            </a>
            <button onClick={() => { const reason = prompt('Report reason:'); if (reason) submitReport(p?.id || '', reason); }} className="bg-red-50 text-red-600 rounded-2xl py-5 text-center shadow-inner border border-red-100 active:scale-[0.97] flex flex-col items-center gap-2">
              <ShieldCheck size={24} />
              <span className="font-extrabold text-sm">Report</span>
            </button>
          </div>
        </div>

        {/* Details */}
        <section className="bg-white rounded-3xl p-6 shadow-md border border-ink/5 space-y-4">
          <h3 className="text-xl font-extrabold text-ink">Details</h3>
          <div className="flex items-center gap-3 text-ink/70">
            <MapPin size={20} className="text-leaf-600" />
            <span className="font-medium">{p?.village}, {p?.district}</span>
          </div>
          <div className="flex items-center gap-3 text-ink/70">
            <Clock size={20} className="text-leaf-600" />
            <span className="font-medium">Working hours: {p?.workingHours}</span>
          </div>
          <div className="flex items-center gap-3 text-ink/70">
            <Star size={20} className="text-amber-warm" />
            <span className="font-medium">Rating: {p?.rating} ({p?.reviewCount} reviews)</span>
          </div>
          <p className="text-ink/70 leading-relaxed bg-ink/[0.02] rounded-2xl p-4 text-sm font-medium">{p?.description}</p>
        </section>

        {/* Verification */}
        <section className="bg-white rounded-3xl p-6 shadow-md border border-ink/5">
          <h3 className="text-xl font-extrabold text-ink mb-3">Verification</h3>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={20} className="text-leaf-600" />
            <span className="font-bold text-leaf-700">Phone Verified</span>
          </div>
          {p?.verificationStatus === 'GRAMA360_VERIFIED' && (
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle2 size={20} className="text-amber-warm" />
              <span className="font-bold text-amber-deep">Grama360 Verified</span>
            </div>
          )}
        </section>

        {/* Reviews */}
        <section className="bg-white rounded-3xl p-6 shadow-md border border-ink/5">
          <h3 className="text-xl font-extrabold text-ink mb-3">Reviews</h3>
          {reviews.length === 0 ? (
            <p className="text-ink/40 text-sm">No reviews yet.</p>
          ) : (
            reviews.map((r: any) => (
              <div key={r.id} className="border-b border-ink/5 last:border-0 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-extrabold text-sm">{r.customerName}</span>
                  <span className="text-amber-warm text-xs">★ {r.rating}</span>
                </div>
                <p className="text-sm text-ink/60">{r.comment}</p>
              </div>
            ))
          )}
          <button
            onClick={() => {
              const rating = parseInt(prompt('Rating (1-5):') || '5');
              const comment = prompt('Comment:') || 'Great service!';
              addReview(p?.id || '', rating, comment);
            }}
            className="mt-4 w-full bg-leaf-50 text-leaf-700 rounded-2xl py-3 font-extrabold hover:bg-leaf-100 transition-colors"
          >
            Write a Review
          </button>
        </section>
      </main>
    </div>
  );
}
