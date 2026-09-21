import { Languages } from 'lucide-react';
import { useAppStore } from '../store';

export function LanguageSelect() {
  const { navigate, setLanguage } = useAppStore();
  const pick = (lang: 'kn' | 'en') => { setLanguage(lang); navigate('auth'); };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-b from-earth-50 to-earth-100 px-6">
      <div className="w-24 h-24 rounded-full bg-leaf-600 text-white flex items-center justify-center mb-6 shadow-xl">
        <Languages size={44} strokeWidth={2.5} />
      </div>
      <h2 className="text-3xl font-extrabold text-ink mb-1 text-center font-kannada">ಭಾಷೆ ಆಯ್ಕೆ ಮಾಡಿ</h2>
      <h2 className="text-lg font-bold text-ink/60 mb-10 text-center">Select language</h2>

      <div className="w-full max-w-xs space-y-4">
        <button
          onClick={() => pick('kn')}
          className="w-full bg-white rounded-3xl p-6 shadow-lg border-2 border-leaf-500/20 hover:border-leaf-600 transition-colors text-center active:scale-[0.98]"
        >
          <span className="text-4xl block mb-2 font-kannada font-bold text-leaf-700">ಕನ್ನಡ</span>
          <span className="block text-sm text-leaf-600 font-extrabold font-kannada">ಮುಂದುವರಿಸಿ →</span>
        </button>
        <button
          onClick={() => pick('en')}
          className="w-full bg-white rounded-3xl p-6 shadow-lg border-2 border-sky-deep/20 hover:border-sky-deep transition-colors text-center active:scale-[0.98]"
        >
          <span className="text-4xl block mb-2 font-extrabold text-sky-deep">English</span>
          <span className="block text-sm text-sky-deep font-extrabold">Continue →</span>
        </button>
      </div>

      <p className="mt-10 text-sm text-ink/50 text-center max-w-xs">
        ಮೇಲಿನ ಪಟ್ಟಿಯಿಂದ ಯಾವಾಗ ಬೇಕಾದರೂ ಬದಲಾಯಿಸಬಹುದು. · You can change this anytime.
      </p>
    </div>
  );
}
