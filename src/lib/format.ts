/**
 * EKEA — formatage suisse
 * Montants en CHF, dates DD.MM.YYYY, adresses avec code postal à 4 chiffres.
 */

const CHF = new Intl.NumberFormat('fr-CH', {
  style: 'currency',
  currency: 'CHF',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const CHF_COMPACT = new Intl.NumberFormat('fr-CH', {
  style: 'currency',
  currency: 'CHF',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const NUMBER_FR = new Intl.NumberFormat('fr-CH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 312.4 → « CHF 312.40 » */
export function formatCHF(amount: number | null | undefined, compact = false): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return '—';
  return compact ? CHF_COMPACT.format(amount) : CHF.format(amount);
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return NUMBER_FR.format(value);
}

/** Récupère la date locale au format YYYY-MM-DD, sans dérive de fuseau. */
export function todayISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

/**
 * Analyse souplement les formats rencontrés :
 * ISO (2026-11-15), suisse (15.11.2026 ou 15/11/2026), et 15 novembre 2026.
 */
export function parseFlexibleDate(input: string | null | undefined): string | null {
  if (!input) return null;
  const raw = String(input).trim();
  if (!raw) return null;

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const swiss = raw.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})$/);
  if (swiss) {
    const [, d, m, y] = swiss;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return toISODate(parsed);
  }
  return null;
}

export function toISODate(date: Date): string {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

/** 2026-11-15 → « 15.11.2026 » */
export function formatDateCH(iso: string | null | undefined): string {
  if (!iso) return '—';
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return iso;
  const [, y, m, d] = match;
  return `${d}.${m}.${y}`;
}

/** 2026-11-15 → « 15 novembre 2026 » */
export function formatDateLong(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('fr-CH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/** « Lundi 2 novembre 2026 » */
export function formatTodayLong(date = new Date()): string {
  const formatted = new Intl.DateTimeFormat('fr-CH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('fr-CH', { hour: '2-digit', minute: '2-digit' }).format(d);
}

/** Nombre de jours entiers entre aujourd’hui et une échéance. */
export function daysUntil(iso: string, from = todayISO()): number {
  const a = new Date(`${iso.slice(0, 10)}T12:00:00`).getTime();
  const b = new Date(`${from.slice(0, 10)}T12:00:00`).getTime();
  return Math.round((a - b) / 86_400_000);
}

/** « dans 5 jours », « aujourd’hui », « demain », « en retard de 3 jours » */
export function relativeDeadline(iso: string): string {
  const days = daysUntil(iso);
  if (days === 0) return 'Aujourd’hui';
  if (days === 1) return 'Demain';
  if (days === -1) return 'En retard d’un jour';
  if (days < 0) return `En retard de ${Math.abs(days)} jours`;
  if (days < 7) return `Dans ${days} jours`;
  if (days < 14) return 'Dans une semaine';
  if (days < 31) return `Dans ${Math.round(days / 7)} semaines`;
  if (days < 61) return 'Dans un mois';
  return `Dans ${Math.round(days / 30)} mois`;
}

/** Libellé court pour les puces d’échéance. */
export function deadlineTone(iso: string): 'urgent' | 'warning' | 'sage' | 'neutral' {
  const days = daysUntil(iso);
  if (days < 0) return 'urgent';
  if (days <= 3) return 'urgent';
  if (days <= 10) return 'warning';
  if (days <= 30) return 'sage';
  return 'neutral';
}

export function initials(first: string, last: string): string {
  const a = (first || '').trim().charAt(0);
  const b = (last || '').trim().charAt(0);
  const value = `${a}${b}`.toUpperCase();
  return value || 'EK';
}

export function formatBytes(bytes: number): string {
  if (!bytes) return '0 Ko';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

/** Reconnaît un code postal suisse (4 chiffres) dans une adresse. */
export function extractSwissPostalCode(address: string): string | null {
  const match = address.match(/\b(\d{4})\b/);
  return match ? match[1] : null;
}

export function isSwissPostalCode(value: string): boolean {
  return /^\d{4}$/.test(value.trim());
}
