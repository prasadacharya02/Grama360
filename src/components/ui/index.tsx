import {
  Ambulance, BadgeCheck, BookOpen, Car, CheckCircle2, Clock, Cog, Droplets, Flame, Hammer,
  HeartHandshake, Refrigerator, Scissors, Shield, ShieldCheck, Siren, Store, Tractor, TreePalm,
  Truck, Users, Wrench, Zap, type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { statusLabel } from '../../i18n';
import type { AvailabilityStatus, Language, ProviderProfile, VerificationStatus } from '../../types';
import { initials } from '../../utils/format';

/* ── Icons ─────────────────────────────────────────────────── */

const ICONS: Record<string, LucideIcon> = {
  Car, Truck, Tractor, Users, TreePalm, Cog, Zap, Droplets, Refrigerator, Hammer, Wrench, Scissors,
  HeartHandshake, BookOpen, Store, Siren, Ambulance, Shield, Flame, Clock,
};

export function CategoryIcon({ icon, size = 24, className }: { icon: string; size?: number; className?: string }) {
  const Icon = ICONS[icon] ?? Wrench;
  return <Icon size={size} strokeWidth={2.4} className={className} />;
}

/* ── Availability ──────────────────────────────────────────── */

const STATUS_STYLE: Record<AvailabilityStatus, { dot: string; pill: string }> = {
  AVAILABLE_NOW: { dot: 'bg-leaf-500', pill: 'bg-leaf-50 text-leaf-700 border-leaf-500/30' },
  BUSY: { dot: 'bg-amber-warm', pill: 'bg-amber-warm/10 text-amber-deep border-amber-warm/30' },
  OFFLINE: { dot: 'bg-stone-400', pill: 'bg-stone-100 text-stone-600 border-stone-300' },
};

export function StatusDot({ status, className }: { status: AvailabilityStatus; className?: string }) {
  return (
    <span className={cn('inline-block w-2.5 h-2.5 rounded-full', STATUS_STYLE[status].dot, status === 'AVAILABLE_NOW' && 'animate-pulse', className)} />
  );
}

export function StatusPill({ status, lang, className }: { status: AvailabilityStatus; lang: Language; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-extrabold px-2.5 py-1 rounded-full border', STATUS_STYLE[status].pill, className)}>
      <StatusDot status={status} />
      {statusLabel(status, lang)}
    </span>
  );
}

/* ── Verification ──────────────────────────────────────────── */

export function VerifiedBadge({ status, lang, size = 'sm' }: { status: VerificationStatus; lang: Language; size?: 'sm' | 'md' }) {
  const big = size === 'md';
  if (status === 'GRAMA360_VERIFIED') {
    return (
      <span className={cn('inline-flex items-center gap-1 font-extrabold rounded-full bg-amber-warm text-white', big ? 'text-sm px-3 py-1' : 'text-[11px] px-2 py-0.5')}>
        <BadgeCheck size={big ? 16 : 12} /> {lang === 'kn' ? 'ಗ್ರಾಮ360 ಪರಿಶೀಲಿತ' : 'Grama360 Verified'}
      </span>
    );
  }
  if (status === 'PHONE_VERIFIED') {
    return (
      <span className={cn('inline-flex items-center gap-1 font-extrabold rounded-full bg-leaf-100 text-leaf-700', big ? 'text-sm px-3 py-1' : 'text-[11px] px-2 py-0.5')}>
        <ShieldCheck size={big ? 16 : 12} /> {lang === 'kn' ? 'ಫೋನ್ ಪರಿಶೀಲಿತ' : 'Phone Verified'}
      </span>
    );
  }
  return (
    <span className={cn('inline-flex items-center gap-1 font-extrabold rounded-full bg-stone-100 text-stone-500', big ? 'text-sm px-3 py-1' : 'text-[11px] px-2 py-0.5')}>
      <Clock size={big ? 16 : 12} /> {lang === 'kn' ? 'ಪರಿಶೀಲನೆ ಬಾಕಿ' : 'Pending'}
    </span>
  );
}

export function isHighlyRated(p: Pick<ProviderProfile, 'rating' | 'reviewCount'>): boolean {
  return p.rating >= 4.5 && p.reviewCount >= 2;
}

/* ── Avatar ────────────────────────────────────────────────── */

const AVATAR_COLORS = [
  'from-leaf-500 to-leaf-700', 'from-amber-warm to-amber-deep', 'from-sky-deep to-leaf-700',
  'from-earth-500 to-earth-700', 'from-leaf-600 to-sky-deep',
];

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const colour = AVATAR_COLORS[name.length % AVATAR_COLORS.length];
  const dims = size === 'lg' ? 'w-20 h-20 text-2xl rounded-3xl' : size === 'sm' ? 'w-10 h-10 text-sm rounded-xl' : 'w-14 h-14 text-lg rounded-2xl';
  return (
    <div className={cn('bg-gradient-to-br text-white flex items-center justify-center font-extrabold shadow-md flex-shrink-0 uppercase', colour, dims)}>
      {initials(name)}
    </div>
  );
}

/* ── Small primitives ──────────────────────────────────────── */

export function Chip({ active, onClick, children, className }: { active?: boolean; onClick?: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'min-h-0 h-10 px-4 rounded-full text-sm font-bold border transition-colors whitespace-nowrap',
        active ? 'bg-leaf-600 text-white border-leaf-600' : 'bg-white text-ink/70 border-ink/10 hover:border-leaf-400',
        className
      )}
    >
      {children}
    </button>
  );
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-extrabold text-ink">{label}</span>
      {hint && <span className="block text-xs text-ink/50 font-medium mt-0.5">{hint}</span>}
      <div className="mt-2">{children}</div>
      {error && <span className="block text-xs text-red-600 font-bold mt-1">{error}</span>}
    </label>
  );
}

export const inputClass =
  'w-full px-4 py-3.5 rounded-xl bg-earth-50 text-ink font-bold text-base border-2 border-ink/10 focus:outline-none focus:border-leaf-500 placeholder:text-ink/30 placeholder:font-medium';

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3 px-1">
      <h3 className="text-lg font-extrabold text-ink">{children}</h3>
      {action}
    </div>
  );
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] max-w-[90vw] animate-fade-up" role="status" aria-live="polite">
      <div className="bg-ink text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2">
        <CheckCircle2 size={18} className="text-leaf-400 flex-shrink-0" />
        <span>{message}</span>
      </div>
    </div>
  );
}
