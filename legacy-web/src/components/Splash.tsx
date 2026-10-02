import { Leaf, ChevronRight } from 'lucide-react';
import { useAppStore } from '../store';

export function Splash() {
  const { setScreen } = useAppStore();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-leaf-700 to-leaf-600 text-white px-6 animate-fade-up">
      <div className="w-28 h-28 rounded-full bg-white/10 backdrop-blur flex items-center justify-center mb-8 shadow-2xl border-2 border-white/20">
        <Leaf size={56} strokeWidth={2.5} className="text-white drop-shadow-lg" />
      </div>
      <h1 className="text-5xl font-extrabold tracking-tight text-center mb-2 font-[Noto_Serif_Kannada] drop-shadow-md">
        ಗ್ರಾಮ 360
      </h1>
      <h2 className="text-2xl font-semibold tracking-wide mb-1">Grama360</h2>
      <p className="text-white/80 text-center text-lg font-medium mb-8 max-w-xs leading-relaxed">
        ನಿಮ್ಮ ಗ್ರಾಮದಲ್ಲಿನ ಸೇವೆಗಳನ್ನು ಕಂಡುಕೊಳ್ಳಿ — ಬಲು ಸುಲಭ
      </p>
      <button
        onClick={() => setScreen('language')}
        className="bg-white text-leaf-700 text-xl font-extrabold rounded-2xl px-10 py-5 shadow-xl hover:bg-amber-warm hover:text-white transition-colors active:scale-[0.97] flex items-center gap-3"
      >
        ಆರಂಭಿಸಿ <ChevronRight size={24} />
      </button>
    </div>
  );
}
