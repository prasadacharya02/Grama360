import { Mic, MicOff, Search, X } from 'lucide-react';
import { useAppStore } from '../../store';
import { useSpeechInput } from '../../hooks/useSpeechInput';
import { cn } from '../../utils/cn';

/**
 * Text + voice search box. Voice uses the phone's own Kannada speech recognition
 * (Chrome on Android) — the customer just says "ನನಗೆ ಆಟೋ ಬೇಕು".
 */
export function SearchBar({ value, onChange, onSubmit, dark = false, autoFocus = false }: {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: (v: string) => void;
  dark?: boolean;
  autoFocus?: boolean;
}) {
  const { t, language, showToast } = useAppStore();
  const { supported, listening, start, stop } = useSpeechInput(language === 'kn' ? 'kn-IN' : 'en-IN', (text) => {
    onChange(text);
    onSubmit?.(text);
  });

  const onMic = () => {
    if (listening) { stop(); return; }
    if (!supported) { showToast(t('voiceUnsupported')); return; }
    if (!start()) showToast(t('voiceUnsupported'));
  };

  return (
    <div>
      <div className="relative">
        <Search className={cn('absolute left-4 top-1/2 -translate-y-1/2', dark ? 'text-white/70' : 'text-ink/40')} size={22} />
        <input
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit?.(value)}
          placeholder={listening ? t('listening') : t('searchPlaceholder')}
          enterKeyHint="search"
          className={cn(
            'w-full pl-12 pr-24 py-4 rounded-2xl text-lg font-semibold border-2 focus:outline-none',
            dark
              ? 'bg-white/15 backdrop-blur border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50'
              : 'bg-white border-ink/10 text-ink placeholder:text-ink/35 focus:border-leaf-500 shadow-md'
          )}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && (
            <button onClick={() => onChange('')} aria-label="Clear" className={cn('min-h-0 w-9 h-9 rounded-full flex items-center justify-center', dark ? 'text-white/70 hover:bg-white/10' : 'text-ink/40 hover:bg-ink/5')}>
              <X size={18} />
            </button>
          )}
          <button
            onClick={onMic}
            aria-label={t('speak')}
            className={cn(
              'min-h-0 w-11 h-11 rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-colors',
              listening ? 'bg-red-500 text-white pulse-ring' : 'bg-amber-warm text-white hover:bg-amber-deep'
            )}
          >
            {listening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
        </div>
      </div>
      <p className={cn('text-xs mt-2 px-1 font-medium', dark ? 'text-white/70' : 'text-ink/50')}>
        🎙️ {listening ? t('listening') : t('voiceHint')}
      </p>
    </div>
  );
}
