import { useState } from 'react';
import { Phone, ArrowRight, User, Briefcase } from 'lucide-react';
import { useAppStore } from '../store';

export function Auth() {
  const { state, setScreen, otpInput, setOtpInput, otpSentTo, sendOtp, verifyOtp } = useAppStore();
  const [step, setStep] = useState<'phone' | 'otp' | 'role'>('phone');
  const [localPhone, setLocalPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState<'customer' | 'provider' | null>(null);

  const submitPhone = () => {
    if (!localPhone || localPhone.length < 10) {
      alert('Please enter a valid phone number');
      return;
    }
    sendOtp(localPhone);
    setStep('otp');
  };

  const submitOtp = () => {
    if (verifyOtp(otpInput, true)) {
      setStep('role');
    }
  };

  const submitRole = () => {
    if (!selectedRole || !state.currentUser) return;
    // Role selected
    // For demo, update state directly
    if (selectedRole === 'customer') setScreen('customer_home');
    else if (selectedRole === 'provider') {
      const p = state.providers.find((pr) => pr.userId === state.currentUser!.id);
      setScreen(p ? 'provider_availability' : 'provider_register');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-leaf-600 to-leaf-800 px-6 pt-16 pb-10 flex flex-col">
      <div className="text-white mb-8 text-center">
        <h2 className="text-4xl font-extrabold mb-2">ಸೇವೆ</h2>
        <h3 className="text-xl font-medium text-white/90">Service Discovery</h3>
      </div>

      <div className="bg-white/10 backdrop-blur-md rounded-[2.5rem] p-6 shadow-2xl border border-white/10 flex-1 flex flex-col">
        {step === 'phone' && (
          <>
            <h3 className="text-white text-xl font-bold mb-2">Phone Login</h3>
            <p className="text-white/70 text-sm mb-6">No email needed. Just your mobile number.</p>
            <div className="relative mb-6">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" size={20} />
              <input
                type="tel"
                value={localPhone}
                onChange={(e) => setLocalPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white text-ink font-bold text-lg shadow-inner border-2 border-transparent focus:border-leaf-500 focus:outline-none placeholder:text-ink/30"
              />
            </div>
            <button
              onClick={submitPhone}
              className="w-full bg-amber-warm text-white text-lg font-extrabold rounded-2xl py-5 shadow-xl hover:bg-amber-deep transition-colors active:scale-[0.98] flex items-center justify-center gap-3 pulse-ring"
            >
              Send OTP <ArrowRight size={22} />
            </button>
          </>
        )}

        {step === 'otp' && (
          <>
            <h3 className="text-white text-xl font-bold mb-2">Enter OTP</h3>
            <p className="text-white/70 text-sm mb-6">We sent code to {otpSentTo}</p>
            <div className="mb-6">
              <input
                type="text"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                placeholder="1 2 3 4 5 6"
                className="w-full px-6 py-5 rounded-2xl bg-white text-ink font-extrabold text-3xl text-center tracking-[0.4em] shadow-inner border-2 border-transparent focus:border-leaf-500 focus:outline-none placeholder:text-ink/20"
                maxLength={6}
              />
            </div>
            <button
              onClick={submitOtp}
              className="w-full bg-leaf-500 text-white text-lg font-extrabold rounded-2xl py-5 shadow-xl hover:bg-leaf-600 transition-colors active:scale-[0.98]"
            >
              Verify & Continue
            </button>
          </>
        )}

        {step === 'role' && (
          <>
            <h3 className="text-white text-xl font-bold mb-2">I am a...</h3>
            <p className="text-white/70 text-sm mb-6">Select your role</p>
            <div className="space-y-4 flex-1">
              <button
                onClick={() => { setSelectedRole('customer'); }}
                className={`w-full rounded-3xl p-6 text-left shadow-xl border-2 transition-colors ${selectedRole === 'customer' ? 'bg-white border-leaf-500 text-ink' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}
              >
                <User size={28} className="mb-3" />
                <h4 className="text-xl font-extrabold">Customer</h4>
                <p className="text-sm opacity-80 mt-1">Find services near me</p>
              </button>
              <button
                onClick={() => { setSelectedRole('provider'); }}
                className={`w-full rounded-3xl p-6 text-left shadow-xl border-2 transition-colors ${selectedRole === 'provider' ? 'bg-white border-amber-warm text-ink' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}
              >
                <Briefcase size={28} className="mb-3" />
                <h4 className="text-xl font-extrabold">Service Provider</h4>
                <p className="text-sm opacity-80 mt-1">Offer my services</p>
              </button>
            </div>
            <button
              onClick={submitRole}
              disabled={!selectedRole}
              className="w-full bg-white text-leaf-700 text-xl font-extrabold rounded-2xl py-5 shadow-xl hover:bg-amber-warm hover:text-white transition-colors active:scale-[0.98] mt-6 disabled:opacity-40"
            >
              Continue
            </button>
          </>
        )}
      </div>

      <p className="text-white/50 text-xs text-center mt-6">Demo: use any number with OTP 123456</p>
    </div>
  );
}
