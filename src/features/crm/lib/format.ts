/** Display helpers local to the CRM workspace (keeps the folder self-contained). */
export const money = (value: number, compact = false) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 0,
  }).format(value);

export const shortDate = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(iso));

export const dateTime = (iso: string) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));

export const time = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(iso));

/** Whole days from today (negative = past). */
export const daysFromToday = (iso: string) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - start.getTime()) / 86_400_000);
};

export const relativeDays = (iso: string, locale?: string) =>
  new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(daysFromToday(iso), 'day');
