import { useMemo, useState } from 'react';
import { Check, ChevronRight, Phone } from 'lucide-react';
import { useAppStore, type ProviderDraft } from '../../store';
import { CATEGORIES, GROUPS, PILOT_DISTRICT, VILLAGES } from '../../data/catalog';
import { formatPhone, toE164 } from '../../utils/format';
import { CategoryIcon, Field, inputClass } from '../ui';
import { cn } from '../../utils/cn';

const HOURS_PRESETS = ['6 AM – 9 PM', '8 AM – 6 PM', '9 AM – 7 PM', '5 AM – 8 PM', '24 hours'];

/**
 * Provider self-registration (3 short steps) — also used for editing.
 *   1. What work do you do?   (tap an occupation)
 *   2. About you              (name, phone, WhatsApp)
 *   3. Where do you work?     (village, villages you go to, hours, experience, note)
 */
export function ProviderForm({ mode }: { mode: 'register' | 'edit' }) {
  const { t, language: lang, currentUser, myProfiles, selectedProvider, registerProvider, updateProvider, navigate, showToast, goBack } = useAppStore();

  // In edit mode we edit the selected profile if it is ours, otherwise the first of ours.
  const editing = mode === 'edit' ? (selectedProvider && selectedProvider.userId === currentUser?.id ? selectedProvider : myProfiles[0]) ?? null : null;

  const initial: ProviderDraft = useMemo(() => editing ? {
    name: editing.name, phoneNumber: editing.phoneNumber, categoryId: editing.categoryId, village: editing.village,
    district: editing.district, serviceArea: editing.serviceArea, experienceYears: editing.experienceYears,
    description: editing.description, workingHours: editing.workingHours, hasWhatsApp: editing.hasWhatsApp,
  } : {
    name: currentUser?.name ?? '', phoneNumber: currentUser?.phoneNumber ?? '', categoryId: '', village: '',
    district: PILOT_DISTRICT, serviceArea: [], experienceYears: 0, description: '', workingHours: HOURS_PRESETS[0], hasWhatsApp: true,
  }, [editing, currentUser]);

  const [form, setForm] = useState<ProviderDraft>(initial);
  const [phoneInput, setPhoneInput] = useState(initial.phoneNumber ? formatPhone(initial.phoneNumber) : '');
  const [step, setStep] = useState<1 | 2 | 3>(mode === 'edit' ? 2 : 1);
  const [otherVillage, setOtherVillage] = useState(!!initial.village && !VILLAGES.some((v) => v.name === initial.village));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof ProviderDraft>(k: K, v: ProviderDraft[K]) => setForm((f) => ({ ...f, [k]: v }));

  const toggleArea = (name: string) => {
    setForm((f) => ({
      ...f,
      serviceArea: f.serviceArea.includes(name) ? f.serviceArea.filter((a) => a !== name) : [...f.serviceArea, name],
    }));
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = t('required');
    if (!toE164(phoneInput)) e.phone = t('invalidPhone');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e: Record<string, string> = {};
    if (!form.village.trim()) e.village = t('required');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const finish = () => {
    if (!validateStep3()) return;
    const phone = toE164(phoneInput)!;
    const serviceArea = form.serviceArea.includes(form.village) ? form.serviceArea : [form.village, ...form.serviceArea];
    const payload: ProviderDraft = { ...form, phoneNumber: phone, serviceArea, name: form.name.trim(), village: form.village.trim(), description: form.description.trim() };
    if (editing) {
      updateProvider(editing.id, payload);
      showToast(t('saved'));
    } else {
      registerProvider(payload);
      showToast(t('registered'));
    }
    navigate('provider_dashboard');
  };

  const stepTitle = step === 1 ? t('whatDoYouDo') : step === 2 ? t('aboutYou') : t('whereYouWork');

  return (
    <div className="min-h-screen bg-sand">
      <header className="bg-gradient-to-br from-amber-warm to-amber-deep text-white px-5 pt-5 pb-8 rounded-b-[2.5rem] shadow-xl">
        <p className="text-white/80 text-xs font-extrabold uppercase tracking-wider">{mode === 'edit' ? t('editTitle') : t('registerTitle')}</p>
        <h2 className="text-2xl font-extrabold mt-1">{stepTitle}</h2>
        <p className="text-white/85 text-sm font-medium mt-1">{mode === 'edit' ? '' : t('registerSubtitle')}</p>
        <div className="flex gap-1.5 mt-4">
          {[1, 2, 3].map((n) => (
            <button key={n} onClick={() => n < step && setStep(n as 1 | 2 | 3)} className={cn('min-h-0 h-2 flex-1 rounded-full transition-colors', n <= step ? 'bg-white' : 'bg-white/30')} aria-label={t('stepOf', { a: n, b: 3 })} />
          ))}
        </div>
      </header>

      <main className="px-4 -mt-4 space-y-4">
        {/* Step 1: occupation */}
        {step === 1 && (
          <div className="bg-white rounded-3xl p-4 shadow-xl border border-ink/5 space-y-5">
            {GROUPS.map((g) => (
              <div key={g.id}>
                <p className="text-xs font-extrabold text-ink/50 uppercase tracking-wide mb-2">{g.emoji} {lang === 'kn' ? g.kannadaName : g.name}</p>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.filter((c) => c.group === g.id).map((c) => {
                    const active = form.categoryId === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => { set('categoryId', c.id); setErrors({}); }}
                        className={cn('rounded-2xl p-3 flex flex-col items-center gap-2 border-2 min-h-[6rem] transition-colors', active ? 'bg-leaf-50 border-leaf-600' : 'bg-earth-50 border-transparent hover:border-leaf-300')}
                      >
                        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', active ? 'bg-leaf-600 text-white' : 'bg-white text-leaf-700')}>
                          {active ? <Check size={24} strokeWidth={3} /> : <CategoryIcon icon={c.icon} size={24} />}
                        </div>
                        <span className="text-[11px] font-extrabold text-ink text-center leading-tight">{lang === 'kn' ? c.kannadaName : c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {errors.category && <p className="text-red-600 text-sm font-bold">{errors.category}</p>}
            <button
              onClick={() => { if (!form.categoryId) { setErrors({ category: t('chooseCategory') }); return; } setErrors({}); setStep(2); }}
              className="w-full bg-leaf-700 text-white text-lg font-extrabold rounded-2xl py-4 shadow-xl flex items-center justify-center gap-2"
            >
              {t('next')} <ChevronRight size={22} />
            </button>
          </div>
        )}

        {/* Step 2: about you */}
        {step === 2 && (
          <div className="bg-white rounded-3xl p-5 shadow-xl border border-ink/5 space-y-5">
            {mode === 'edit' && (
              <button onClick={() => setStep(1)} className="w-full min-h-0 flex items-center gap-3 bg-earth-50 rounded-2xl p-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-leaf-600 text-white flex items-center justify-center"><CategoryIcon icon={CATEGORIES.find((c) => c.id === form.categoryId)?.icon ?? 'Wrench'} size={20} /></div>
                <div className="flex-1">
                  <p className="text-xs text-ink/50 font-bold">{t('whatDoYouDo')}</p>
                  <p className="font-extrabold text-ink">{(() => { const c = CATEGORIES.find((x) => x.id === form.categoryId); return lang === 'kn' ? c?.kannadaName : c?.name; })()}</p>
                </div>
                <ChevronRight size={18} className="text-ink/30" />
              </button>
            )}
            <Field label={t('fullName')} error={errors.name}>
              <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={t('namePlaceholder')} className={inputClass} autoFocus={mode === 'register'} />
            </Field>
            <Field label={t('phoneForCustomers')} error={errors.phone}>
              <div className="relative">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
                <input type="tel" inputMode="numeric" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} placeholder="98450 36001" className={cn(inputClass, 'pl-11 text-lg tracking-wide')} />
              </div>
            </Field>
            <label className="flex items-center gap-3 bg-earth-50 rounded-2xl p-4 cursor-pointer">
              <input type="checkbox" checked={form.hasWhatsApp} onChange={(e) => set('hasWhatsApp', e.target.checked)} className="w-6 h-6 accent-leaf-600" />
              <span className="font-bold text-ink text-sm">💬 {t('hasWhatsApp')}</span>
            </label>
            <button onClick={() => validateStep2() && setStep(3)} className="w-full bg-leaf-700 text-white text-lg font-extrabold rounded-2xl py-4 shadow-xl flex items-center justify-center gap-2">
              {t('next')} <ChevronRight size={22} />
            </button>
          </div>
        )}

        {/* Step 3: where you work */}
        {step === 3 && (
          <div className="bg-white rounded-3xl p-5 shadow-xl border border-ink/5 space-y-5">
            <Field label={t('village')} error={errors.village}>
              <div className="flex flex-wrap gap-2">
                {VILLAGES.map((v) => {
                  const active = !otherVillage && form.village === v.name;
                  return (
                    <button key={v.id} onClick={() => { setOtherVillage(false); set('village', v.name); }} className={cn('min-h-0 h-10 px-3.5 rounded-full text-sm font-bold border', active ? 'bg-leaf-600 text-white border-leaf-600' : 'bg-white text-ink/70 border-ink/10')}>
                      {lang === 'kn' ? v.kannadaName : v.name}
                    </button>
                  );
                })}
                <button onClick={() => { setOtherVillage(true); set('village', ''); }} className={cn('min-h-0 h-10 px-3.5 rounded-full text-sm font-bold border', otherVillage ? 'bg-leaf-600 text-white border-leaf-600' : 'bg-white text-ink/70 border-ink/10')}>
                  {t('otherVillage')}
                </button>
              </div>
              {otherVillage && (
                <input value={form.village} onChange={(e) => set('village', e.target.value)} placeholder={t('typeVillage')} className={cn(inputClass, 'mt-3')} autoFocus />
              )}
            </Field>

            <Field label={t('serviceArea')} hint={t('serviceAreaHint')}>
              <div className="flex flex-wrap gap-2">
                {VILLAGES.map((v) => {
                  const active = form.serviceArea.includes(v.name) || form.village === v.name;
                  return (
                    <button key={v.id} onClick={() => toggleArea(v.name)} disabled={form.village === v.name} className={cn('min-h-0 h-10 px-3.5 rounded-full text-sm font-bold border flex items-center gap-1', active ? 'bg-amber-warm/15 text-amber-deep border-amber-warm/40' : 'bg-white text-ink/70 border-ink/10')}>
                      {active && <Check size={14} strokeWidth={3} />} {lang === 'kn' ? v.kannadaName : v.name}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label={t('hours')}>
              <div className="flex flex-wrap gap-2 mb-2">
                {HOURS_PRESETS.map((h) => (
                  <button key={h} onClick={() => set('workingHours', h)} className={cn('min-h-0 h-9 px-3 rounded-full text-xs font-bold border', form.workingHours === h ? 'bg-leaf-600 text-white border-leaf-600' : 'bg-white text-ink/70 border-ink/10')}>{h}</button>
                ))}
              </div>
              <input value={form.workingHours} onChange={(e) => set('workingHours', e.target.value)} className={inputClass} />
            </Field>

            <Field label={t('experience')}>
              <div className="flex items-center gap-3">
                <button onClick={() => set('experienceYears', Math.max(0, form.experienceYears - 1))} className="w-14 h-14 rounded-2xl bg-earth-50 text-2xl font-extrabold text-ink border-2 border-ink/10">−</button>
                <input type="number" inputMode="numeric" min={0} max={60} value={form.experienceYears} onChange={(e) => set('experienceYears', Math.max(0, Math.min(60, parseInt(e.target.value) || 0)))} className={cn(inputClass, 'text-center text-xl')} />
                <button onClick={() => set('experienceYears', Math.min(60, form.experienceYears + 1))} className="w-14 h-14 rounded-2xl bg-earth-50 text-2xl font-extrabold text-ink border-2 border-ink/10">+</button>
              </div>
            </Field>

            <Field label={t('description')}>
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} placeholder={t('descriptionPlaceholder')} className={cn(inputClass, 'resize-none font-medium')} />
            </Field>

            <button onClick={finish} className="w-full bg-amber-warm hover:bg-amber-deep text-white text-xl font-extrabold rounded-2xl py-5 shadow-xl active:scale-[0.98]">
              {editing ? t('saveChanges') : `✅ ${t('registerNow')}`}
            </button>
            {!editing && <p className="text-center text-xs text-ink/50 font-medium">{t('freeForever')}</p>}
          </div>
        )}

        <button onClick={goBack} className="w-full min-h-0 py-3 text-sm font-bold text-ink/50">{t('cancel')}</button>
      </main>
    </div>
  );
}
