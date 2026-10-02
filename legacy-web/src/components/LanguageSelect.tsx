import { Languages } from 'lucide-react';
import { useAppStore } from '../store';

export function LanguageSelect() {
  const { setScreen, setLanguage } = useAppStore();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-earth-50 to-earth-100 px-6">
      <div className="w-24 h-24 rounded-full bg-leaf-600 text-white flex items-center justify-center mb-6 shadow-xl">
        <Languages size={44} strokeWidth={2.5} />
      </div>
      <h2 className="text-3xl font-extrabold text-ink mb-2 text-center">ಭಾಷೆ</h2>
      <h2 className="text-xl font-bold text-ink/80 mb-10 text-center">Select Language</h2>

      <div className="w-full max-w-xs space-y-4">
        <button
          onClick={() => { setLanguage('kn'); setScreen('auth'); }}
          className="w-full bg-white rounded-3xl p-6 shadow-lg border-2 border-leaf-500/20 hover:border-leaf-600 transition-colors text-center active:scale-[0.98]"
        >
          <span className="text-4xl block mb-2">ಕನ್ನಡ</span>
          <span className="text-base font-semibold text-ink/70">ಕನ್ನಡ (Kannada)</span>
          <span className="block text-sm text-leaf-600 font-bold mt-2">ಮುಂದುವರಿಸಿ</span>
        </button>
        <button
          onClick={() => { setLanguage('en'); setScreen('auth'); }}
          className="w-full bg-white rounded-3xl p-6 shadow-lg border-2 border-sky-deep/20 hover:border-sky-deep transition-colors text-center active:scale-[0.98]"
        >
          <span className="text-4xl block mb-2">English</span>
          <span className="text-base font-semibold text-ink/70">English</span>
          <span className="block text-sm text-sky-deep font-bold mt-2">Continue</span>
        </button>
      </div>

      <p className="mt-10 text-sm text-ink/50 text-center max-w-xs">
        You can change this anytime in your settings.
      </p>
    </div>
  );
}
