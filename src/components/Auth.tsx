import { useState } from 'react';
import { ArrowRight, Briefcase, Headset, Phone, User } from 'lucide-react';
import { useAppStore } from '../store';
import { formatPhone, toE164 } from '../utils/format';
import type { Role } from '../types';

type Step = 'phone' | 'otp' | 'role';

export function Auth() {
  const { t, language, sendOtp, verifyOtp, otpSentTo, chooseRole, demoLogin, currentUser, myProfiles } = useAppStore();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submitPhone = () => {
    const e164 = toE164(phone);
    if (!e164) { setError(t('invalidPhone')); return; }
    setError(null);
    sendOtp(e164);
    setStep('otp');
  };

  const submitOtp = () => {
    if (!verifyOtp(otp)) { setError(t('invalidOtp')); return; }
    setError(null);
    setStep('role');
  };

  const submitRole = () => {
    if (!role) return;
    chooseRole(role, name);
  };

  const knownName = currentUser?.name;

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-leaf-600 to-leaf-800 px-5 pt-12 pb-8 flex flex-col">
      <div className="text-white mb-6 text-center">
        <h2 className="text-4xl font-extrabold mb-1 font-kannada">ಗ್ರಾಮ360</h2>
        <p className="text-white/80 font-medium">{t('tagline')}</p>
      </div>

      <div className="bg-white rounded-[2rem] p-6 shadow-2xl flex-1 flex flex-col">
        {step === 'phone' && (
          <>
            <h3 className="text-ink text-xl font-extrabold mb-1">{t('phoneLogin')}</h3>
            <p className="text-ink/60 text-sm mb-6 font-medium">{t('noEmail')}</p>
            <label className="block text-xs font-extrabold text-ink/60 uppercase tracking-wide mb-2">{t('phoneNumber')}</label>
            <div className="relative mb-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/50 font-extrabold text-lg">+91</span>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d\s+]/g, '').slice(0, 14))}
                onKeyDown={(e) => e.key === 'Enter' && submitPhone()}
                placeholder="98450 36001"
                className="w-full pl-16 pr-4 py-4 rounded-2xl bg-earth-50 text-ink font-extrabold text-xl tracking-wide border-2 border-ink/10 focus:border-leaf-500 focus:outline-none placeholder:text-ink/25"
              />
            </div>
            {error && <p className="text-red-600 text-sm font-bold mb-2">{error}</p>}
            <button
              onClick={submitPhone}
              className="mt-4 w-full bg-amber-warm text-white text-lg font-extrabold rounded-2xl py-4 shadow-xl hover:bg-amber-deep transition-colors active:scale-[0.98] flex items-center justify-center gap-3"
            >
              {t('sendOtp')} <ArrowRight size={22} />
            </button>

            <div className="mt-auto pt-8">
              <p className="text-xs font-extrabold text-ink/40 uppercase tracking-wide mb-2">{t('quickDemo')}</p>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => demoLogin('customer')} className="min-h-0 py-3 rounded-2xl bg-leaf-50 text-leaf-700 text-xs font-extrabold flex flex-col items-center gap-1 border border-leaf-500/20">
                  <User size={18} /> {t('demoCustomer')}
                </button>
                <button onClick={() => demoLogin('provider')} className="min-h-0 py-3 rounded-2xl bg-amber-warm/10 text-amber-deep text-xs font-extrabold flex flex-col items-center gap-1 border border-amber-warm/30">
                  <Briefcase size={18} /> <span className="text-center leading-tight">{t('demoProvider')}</span>
                </button>
                <button onClick={() => demoLogin('admin')} className="min-h-0 py-3 rounded-2xl bg-ink/5 text-ink text-xs font-extrabold flex flex-col items-center gap-1 border border-ink/10">
                  <Headset size={18} /> <span className="text-center leading-tight">{t('demoAdmin')}</span>
                </button>
              </div>
              <p className="text-ink/40 text-xs text-center mt-3">{t('demoHint')}</p>
            </div>
          </>
        )}

        {step === 'otp' && (
          <>
            <h3 className="text-ink text-xl font-extrabold mb-1">{t('enterOtp')}</h3>
            <p className="text-ink/60 text-sm mb-6 font-medium">{t('otpSentTo', { phone: otpSentTo ? `+91 ${formatPhone(otpSentTo)}` : '' })}</p>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => e.key === 'Enter' && submitOtp()}
              placeholder="••••••"
              className="w-full px-6 py-5 rounded-2xl bg-earth-50 text-ink font-extrabold text-3xl text-center tracking-[0.4em] border-2 border-ink/10 focus:border-leaf-500 focus:outline-none placeholder:text-ink/20"
              maxLength={6}
              autoFocus
            />
            {error && <p className="text-red-600 text-sm font-bold mt-2">{error}</p>}
            <button
              onClick={submitOtp}
              className="mt-6 w-full bg-leaf-600 text-white text-lg font-extrabold rounded-2xl py-4 shadow-xl hover:bg-leaf-700 transition-colors active:scale-[0.98]"
            >
              {t('verifyContinue')}
            </button>
            <button onClick={() => { setStep('phone'); setOtp(''); setError(null); }} className="mt-3 w-full min-h-0 py-3 text-sm font-bold text-ink/50">
              {t('changeNumber')}
            </button>
            <p className="text-ink/40 text-xs text-center mt-auto">{t('demoHint')}</p>
          </>
        )}

        {step === 'role' && (
          <>
            <h3 className="text-ink text-xl font-extrabold mb-1">{t('iAmA')}</h3>
            <p className="text-ink/60 text-sm mb-5 font-medium">{t('chooseRole')}</p>

            {!knownName && (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('yourNameOptional')}
                className="w-full mb-4 px-4 py-3.5 rounded-2xl bg-earth-50 text-ink font-bold border-2 border-ink/10 focus:border-leaf-500 focus:outline-none placeholder:text-ink/30 placeholder:font-medium"
              />
            )}

            <div className="space-y-3 flex-1">
              <button
                onClick={() => setRole('customer')}
                className={`w-full rounded-3xl p-5 text-left border-2 transition-colors flex items-center gap-4 ${role === 'customer' ? 'bg-leaf-50 border-leaf-600' : 'bg-white border-ink/10 hover:border-leaf-300'}`}
              >
                <div className="w-12 h-12 rounded-2xl bg-leaf-600 text-white flex items-center justify-center flex-shrink-0"><User size={24} /></div>
                <div>
                  <h4 className="text-lg font-extrabold text-ink">{t('roleCustomer')}</h4>
                  <p className="text-sm text-ink/60 font-medium">{t('roleCustomerDesc')}</p>
                </div>
              </button>
              <button
                onClick={() => setRole('provider')}
                className={`w-full rounded-3xl p-5 text-left border-2 transition-colors flex items-center gap-4 ${role === 'provider' ? 'bg-amber-warm/10 border-amber-warm' : 'bg-white border-ink/10 hover:border-amber-warm/50'}`}
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-warm text-white flex items-center justify-center flex-shrink-0"><Briefcase size={24} /></div>
                <div>
                  <h4 className="text-lg font-extrabold text-ink">{t('roleProvider')}</h4>
                  <p className="text-sm text-ink/60 font-medium">{t('roleProviderDesc')}</p>
                  {myProfiles.length > 0 && <p className="text-xs text-amber-deep font-bold mt-1">{myProfiles.length} {language === 'kn' ? 'ಸೇವೆ ನೋಂದಣಿಯಾಗಿದೆ' : 'service(s) registered'}</p>}
                </div>
              </button>
            </div>
            <button
              onClick={submitRole}
              disabled={!role}
              className="w-full bg-leaf-700 text-white text-lg font-extrabold rounded-2xl py-4 shadow-xl hover:bg-leaf-800 transition-colors active:scale-[0.98] mt-5 disabled:opacity-40"
            >
              {t('continue')}
            </button>
          </>
        )}
      </div>

      <p className="mt-4 text-white/60 text-sm font-bold flex items-center justify-center gap-2 text-center">
        <Phone size={14} className="flex-shrink-0" /> {t('helplineLine')}
      </p>
    </div>
  );
}
