import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAppStore } from '../store';
import { CATEGORY_MAP } from '../data/store';

export function ProviderRegister() {
  const { setScreen, registerProvider } = useAppStore();
  const [form, setForm] = useState({
    village: '', district: 'Ramanagara', serviceArea: '',
    experienceYears: 0, description: '', workingHours: '6 AM - 9 PM', categoryId: 'auto',
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-leaf-700 to-leaf-600 px-5 pt-12 pb-10">
      <button onClick={() => setScreen('auth')} className="text-white/90 hover:text-white mb-4 font-bold text-sm flex items-center gap-2"><ArrowLeft size={20}/> Back</button>
      <h2 className="text-3xl font-extrabold text-white mb-2">Become a Provider</h2>
      <p className="text-white/80 mb-6">Fill your profile. It takes just 2 minutes.</p>
      <div className="bg-white rounded-3xl p-6 shadow-2xl space-y-4">
        <div>
          <label className="text-xs font-extrabold text-ink/60 uppercase tracking-wide">Category</label>
          <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} className="w-full mt-2 px-4 py-3 rounded-xl bg-earth-50 text-ink font-bold border border-ink/10 focus:outline-none focus:border-leaf-500">
            {CATEGORY_MAP.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-extrabold text-ink/60 uppercase tracking-wide">Village</label>
          <input value={form.village} onChange={e => setForm({ ...form, village: e.target.value })} placeholder="E.g. Kanakapura" className="w-full mt-2 px-4 py-3 rounded-xl bg-earth-50 text-ink font-bold border border-ink/10 focus:outline-none focus:border-leaf-500" />
        </div>
        <div>
          <label className="text-xs font-extrabold text-ink/60 uppercase tracking-wide">District</label>
          <input value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} placeholder="E.g. Ramanagara" className="w-full mt-2 px-4 py-3 rounded-xl bg-earth-50 text-ink font-bold border border-ink/10 focus:outline-none focus:border-leaf-500" />
        </div>
        <div>
          <label className="text-xs font-extrabold text-ink/60 uppercase tracking-wide">Service Area</label>
          <input value={form.serviceArea} onChange={e => setForm({ ...form, serviceArea: e.target.value })} placeholder="Nearby villages you serve" className="w-full mt-2 px-4 py-3 rounded-xl bg-earth-50 text-ink font-bold border border-ink/10 focus:outline-none focus:border-leaf-500" />
        </div>
        <div>
          <label className="text-xs font-extrabold text-ink/60 uppercase tracking-wide">Experience (years)</label>
          <input type="number" value={form.experienceYears} onChange={e => setForm({ ...form, experienceYears: parseInt(e.target.value) || 0 })} className="w-full mt-2 px-4 py-3 rounded-xl bg-earth-50 text-ink font-bold border border-ink/10 focus:outline-none focus:border-leaf-500" />
        </div>
        <div>
          <label className="text-xs font-extrabold text-ink/60 uppercase tracking-wide">Working Hours</label>
          <input value={form.workingHours} onChange={e => setForm({ ...form, workingHours: e.target.value })} className="w-full mt-2 px-4 py-3 rounded-xl bg-earth-50 text-ink font-bold border border-ink/10 focus:outline-none focus:border-leaf-500" />
        </div>
        <div>
          <label className="text-xs font-extrabold text-ink/60 uppercase tracking-wide">Short Description</label>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Tell customers about your work..." className="w-full mt-2 px-4 py-3 rounded-xl bg-earth-50 text-ink font-medium border border-ink/10 focus:outline-none focus:border-leaf-500 resize-none" />
        </div>
        <button
          onClick={() => {
            registerProvider({ ...form, experienceYears: form.experienceYears, village: form.village, district: form.district, serviceArea: form.serviceArea, workingHours: form.workingHours, categoryId: form.categoryId, description: form.description });
          }}
          className="w-full bg-amber-warm text-white text-xl font-extrabold rounded-2xl py-5 shadow-xl hover:bg-amber-deep transition-colors active:scale-[0.98]"
        >
          Register & Continue
        </button>
      </div>
    </div>
  );
}
