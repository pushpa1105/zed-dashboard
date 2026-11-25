import { formatDate, formatRelative } from '@/shared/lib/format';

export const fmtNumber = (value: number, locale?: string) =>
  new Intl.NumberFormat(locale).format(value);

export const fmtCurrency = (value: number, locale?: string) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);

export const fmtRate = (value: number, locale?: string) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value);

export const fmtKg = (value: number, locale?: string) =>
  `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value)} kg`;

/** "2 h 15 min" / "45 min". */
export function fmtDuration(minutes: number) {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  return h ? `${h} h ${(m % 60).toString().padStart(2, '0')} min` : `${m} min`;
}

export const fmtDateTime = (iso: string) => formatDate(iso, 'D MMM, HH:mm');
export const fmtShortDate = (iso: string) => formatDate(iso, 'D MMM');
export const fmtDate = (iso: string) => formatDate(iso, 'D MMM YYYY');
export const fmtTime = (iso: string) => formatDate(iso, 'HH:mm');
export const fmtAgo = (iso: string) => formatRelative(iso);

/** 13.5 → "13:30". */
export function hourLabel(hour: number) {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/** "08:30" → minutes since midnight. */
export const toMinutes = (hhmm: string) => {
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const fromMinutes = (minutes: number) =>
  `${Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0')}:${Math.round(minutes % 60)
    .toString()
    .padStart(2, '0')}`;

/** Whole days from now until `iso`; negative once it has passed. */
export const daysUntil = (iso: string) => Math.floor((Date.parse(iso) - Date.now()) / 86_400_000);

/** Consumption unit for a vehicle's energy source. */
export const consumptionUnit = (electric: boolean) => (electric ? 'kWh/100 km' : 'L/100 km');

/** 95.24 → "95.2%" (locale-aware). */
export const fmtPct = (value: number, locale?: string) =>
  new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(value / 100);
