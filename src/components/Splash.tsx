import { ChevronRight, Leaf, MessageCircle, Phone, Smartphone } from 'lucide-react';
import { useAppStore } from '../store';

export function Splash() {
  const { navigate, currentUser, goHome } = useAppStore();

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-b from-leaf-700 via-leaf-600 to-leaf-700 text-white px-6 py-10 animate-fade-up">
      <div className="w-28 h-28 rounded-full bg-white/10 backdrop-blur flex items-center justify-center mb-6 shadow-2xl border-2 border-white/20">
        <Leaf size={56} strokeWidth={2.5} className="text-white drop-shadow-lg" />
      </div>
      <h1 className="text-5xl font-extrabold tracking-tight text-center mb-1 font-kannada drop-shadow-md">ಗ್ರಾಮ360</h1>
      <h2 className="text-2xl font-semibold tracking-wide mb-4">Grama360</h2>
      <p className="text-white/90 text-center text-lg font-semibold mb-1 max-w-xs leading-relaxed font-kannada">
        ನಿಮ್ಮ ಊರಿನ ಸೇವೆಗಳು ಒಂದೇ ಸಂಪರ್ಕದಲ್ಲಿ.
      </p>
      <p className="text-white/70 text-center text-sm font-medium mb-8 max-w-xs">Your village services, one contact.</p>

      {/* Three ways in — the whole idea of Grama360 */}
      <div className="grid grid-cols-3 gap-2 w-full max-w-xs mb-8">
        {[
          { Icon: Phone, en: 'Keypad phone', kn: 'ಕೀಪ್ಯಾಡ್ ಫೋನ್' },
          { Icon: Smartphone, en: 'Smartphone', kn: 'ಸ್ಮಾರ್ಟ್‌ಫೋನ್' },
          { Icon: MessageCircle, en: 'Local rep', kn: 'ಊರಿನ ಪ್ರತಿನಿಧಿ' },
        ].map(({ Icon, en, kn }) => (
          <div key={en} className="bg-white/10 border border-white/15 rounded-2xl p-3 flex flex-col items-center gap-1.5 text-center">
            <Icon size={22} />
            <span className="text-[11px] font-extrabold leading-tight font-kannada">{kn}</span>
            <span className="text-[10px] text-white/70 leading-tight">{en}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => (currentUser ? goHome() : navigate('language'))}
        className="bg-white text-leaf-700 text-xl font-extrabold rounded-2xl px-10 py-5 shadow-xl hover:bg-amber-warm hover:text-white transition-colors active:scale-[0.97] flex items-center gap-3"
      >
        <span className="font-kannada">ಆರಂಭಿಸಿ</span>
        <span className="text-leaf-700/40 font-normal">|</span>
        <span>Start</span>
        <ChevronRight size={24} />
      </button>

      <p className="text-white/50 text-xs text-center mt-8">Pilot: Brahmavara – Mandarthi · Udupi</p>
    </div>
  );
}
