const compactFormat = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});
const integerFormat = new Intl.NumberFormat('en-US');
const moneyFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export const compact = (n: number) => compactFormat.format(n);
export const integer = (n: number) => integerFormat.format(Math.round(n));
export const money = (n: number) => moneyFormat.format(n);
export const percent = (n: number, digits = 1) => `${n.toFixed(digits)}%`;

/** 192 → "3m 12s". */
export const duration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m ? `${m}m ${s.toString().padStart(2, '0')}s` : `${s}s`;
};

/** Seconds since an ISO timestamp, as "12s ago" / "3m ago". */
export const ago = (iso: string, now = Date.now()) => {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m`;
};

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/** 12.3 → "+12.3%", -4 → "-4.0%". */
export const signedPercent = (n: number, digits = 1) => `${n > 0 ? '+' : ''}${percent(n, digits)}`;

/** "3 hours ago" / "hace 3 horas", in the given locale. */
export const relativeTime = (iso: string, locale: string) => {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const minutes = Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
  const hours = Math.round(minutes / 60);
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute');
  return Math.abs(hours) < 24
    ? rtf.format(hours, 'hour')
    : rtf.format(Math.round(hours / 24), 'day');
};
