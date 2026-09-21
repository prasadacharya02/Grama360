import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../store';

export function ProviderAvailability() {
  const { state, setScreen, updateAvailability } = useAppStore();
  const profile = state.providers.find((p) => p.userId === state.currentUser?.id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-leaf-700 to-leaf-500 px-6 pt-12 pb-10">
      <button onClick={() => setScreen('customer_home')} className="text-white/90 hover:text-white mb-4 font-bold text-sm flex items-center gap-2"><ArrowLeft size={20}/> Back</button>
      <h2 className="text-3xl font-extrabold text-white mb-2">Availability</h2>
      <p className="text-white/80 mb-8">Let customers know when you're ready.</p>

      <div className="bg-white rounded-3xl p-6 shadow-2xl space-y-4">
        {[
          { key: 'AVAILABLE_NOW', label: 'Available Now', desc: 'Customers can call you immediately.' },
          { key: 'BUSY', label: 'Busy', desc: 'You are working but may respond later.' },
          { key: 'OFFLINE', label: 'Offline', desc: 'Not taking calls today.' },
        ].map((opt) => (
          <button
            key={opt.key}
            onClick={() => { updateAvailability(opt.key as any); alert('Status updated to ' + opt.label); }}
            className={`w-full rounded-2xl p-5 text-left border-2 transition-all shadow-md ${profile?.availabilityStatus === opt.key ? 'bg-leaf-50 border-leaf-600' : 'bg-white border-ink/5 hover:border-leaf-300'}`}
          >
            <div className="flex items-center gap-3">
              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${profile?.availabilityStatus === opt.key ? 'bg-leaf-600 border-leaf-600' : 'border-ink/20'}`}>
                {profile?.availabilityStatus === opt.key && <CheckCircle2 size={14} className="text-white" />}
              </span>
              <div>
                <h4 className="font-extrabold text-lg text-ink">{opt.label}</h4>
                <p className="text-sm text-ink/50">{opt.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
