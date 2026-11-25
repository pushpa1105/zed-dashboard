/** Display helpers local to this template (keeps the folder self-contained). */
export const money = (value: number, fractionDigits = 2) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);

export const compact = (value: number) =>
  new Intl.NumberFormat(undefined, {
    notation: value >= 10_000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value);

export const shortDate = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(
    new Date(iso),
  );

export const longDate = (iso: string) =>
  new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso));

/** "2026-11" → "November 2026". */
export const monthLabel = (period: string, locale?: string) =>
  new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${period}-01T00:00:00Z`),
  );

/** Whole years between an ISO date and today. */
export const yearsSince = (iso: string) =>
  Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / (365.25 * 86_400_000)));

/** 7.5 → "7.5"; zero renders as a dash so empty days stay quiet. */
export const hours = (value: number) =>
  value ? new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value) : '—';

export const timeOfDay = (iso: string) =>
  new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(iso));

/** Whole days from today (UTC) to an ISO date; negative when it is in the past. */
export const daysUntil = (iso: string) => {
  const now = new Date();
  return Math.round(
    (Date.parse(`${iso}T00:00:00Z`) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) /
      86_400_000,
  );
};

/** Whole-number percentage, 0 when there is nothing to divide by. */
export const percent = (part: number, total: number) =>
  total ? Math.round((part / total) * 100) : 0;

/** Mean rounded to one decimal. */
export const average = (values: number[]) =>
  values.length ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10 : 0;
