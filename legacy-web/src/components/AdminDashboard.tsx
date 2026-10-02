import { ShieldCheck, UserCheck, AlertTriangle, TrendingUp } from 'lucide-react';
import { useAppStore } from '../store';

export function AdminDashboard() {
  const { state, setScreen, verifyProvider, resolveReport, analytics } = useAppStore();

  return (
    <div className="min-h-screen bg-sand">
      <header className="bg-gradient-to-r from-ink to-earth-800 text-white px-5 pt-10 pb-8 rounded-b-[2.5rem] shadow-xl">
        <h2 className="text-3xl font-extrabold">Admin Dashboard</h2>
        <p className="text-white/70">Grama360 Management</p>
      </header>

      <main className="px-5 -mt-6 space-y-6 pb-10">
        {/* Analytics */}
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-md border border-ink/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-leaf-50 text-leaf-600 flex items-center justify-center"><UserCheck size={20}/></div>
            <div><h4 className="text-xs font-bold text-ink/50">Customers</h4><p className="text-xl font-extrabold text-ink">{analytics.totalCustomers}</p></div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-md border border-ink/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-warm/20 text-amber-deep flex items-center justify-center"><TrendingUp size={20}/></div>
            <div><h4 className="text-xs font-bold text-ink/50">Providers</h4><p className="text-xl font-extrabold text-ink">{analytics.totalProviders}</p></div>
          </div>
        </section>

        {/* Pending Verifications */}
        <section className="bg-white rounded-3xl p-6 shadow-md border border-ink/5">
          <h3 className="text-xl font-extrabold text-ink mb-4 flex items-center gap-2"><ShieldCheck size={22} className="text-leaf-600"/> Verifications</h3>
          {state.providers.filter(p => p.verificationStatus === 'PENDING').map(p => (
            <div key={p.id} className="flex items-center justify-between py-3 border-b border-ink/5 last:border-0">
              <div>
                <h4 className="font-extrabold text-ink">{p.village}</h4>
                <p className="text-xs text-ink/50">{p.categoryId}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => verifyProvider(p.id, 'GRAMA360_VERIFIED')} className="bg-leaf-600 text-white text-xs font-extrabold px-3 py-2 rounded-xl">Verify</button>
                <button onClick={() => verifyProvider(p.id, 'PENDING')} className="bg-ink/5 text-ink text-xs font-extrabold px-3 py-2 rounded-xl">Keep Pending</button>
              </div>
            </div>
          ))}
          {state.providers.filter(p => p.verificationStatus === 'PENDING').length === 0 && <p className="text-sm text-ink/40">No pending verifications.</p>}
        </section>

        {/* Reports */}
        <section className="bg-white rounded-3xl p-6 shadow-md border border-ink/5">
          <h3 className="text-xl font-extrabold text-ink mb-4 flex items-center gap-2"><AlertTriangle size={22} className="text-red-500"/> Reports</h3>
          {state.reports.map(r => (
            <div key={r.id} className="flex items-center justify-between py-3 border-b border-ink/5 last:border-0">
              <div>
                <h4 className="font-extrabold text-ink">{r.providerId}</h4>
                <p className="text-xs text-ink/50">{r.reason} — by {r.reporterName}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => resolveReport(r.id, 'RESOLVED')} className="bg-leaf-600 text-white text-xs font-extrabold px-3 py-2 rounded-xl">Resolve</button>
                <button onClick={() => resolveReport(r.id, 'REJECTED')} className="bg-red-50 text-red-600 text-xs font-extrabold px-3 py-2 rounded-xl">Reject</button>
              </div>
            </div>
          ))}
          {state.reports.length === 0 && <p className="text-sm text-ink/40">No open reports.</p>}
        </section>

        <button onClick={() => setScreen('customer_home')} className="w-full bg-ink text-white rounded-2xl py-4 font-extrabold shadow-lg">Back to App</button>
      </main>
    </div>
  );
}
