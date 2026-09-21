import { VILLAGE_BY_NAME } from '../data/catalog';
import type { Language } from '../types';

/** "+919845360001" → "98450 36001" (how numbers are read out in India). */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const local = digits.length > 10 ? digits.slice(-10) : digits;
  if (local.length !== 10) return phone;
  return `${local.slice(0, 5)} ${local.slice(5)}`;
}

/** Normalise anything a user typed into E.164 for India. */
export function toE164(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `+91${digits.slice(1)}`;
  return null;
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export function whatsappHref(phone: string, text?: string): string {
  const digits = phone.replace(/\D/g, '');
  const q = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${digits}${q}`;
}

export function villageLabel(name: string, lang: Language): string {
  if (lang === 'en') return name;
  return VILLAGE_BY_NAME[name.toLowerCase()]?.kannadaName ?? name;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length === 1 ? parts[0].slice(0, 1) : `${parts[0][0]}${parts[1][0]}`;
}

export function timeAgo(iso: string, lang: Language): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.round(diff / 60000));
  if (mins < 60) return lang === 'kn' ? `${mins} ನಿಮಿಷದ ಹಿಂದೆ` : `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return lang === 'kn' ? `${hrs} ಗಂಟೆ ಹಿಂದೆ` : `${hrs} hr ago`;
  const days = Math.round(hrs / 24);
  return lang === 'kn' ? `${days} ದಿನದ ಹಿಂದೆ` : `${days} d ago`;
}

export function isThisMonth(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
