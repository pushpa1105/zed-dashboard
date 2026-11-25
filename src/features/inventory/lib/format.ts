const whole = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const cents = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const compact = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});
const units = new Intl.NumberFormat('en-US');
const compactUnits = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const usd = (n: number) => whole.format(n);
export const usdCents = (n: number) => cents.format(n);
export const usdCompact = (n: number) => compact.format(n);
export const qty = (n: number) => units.format(n);
export const qtyCompact = (n: number) => compactUnits.format(n);
export const signed = (n: number) =>
  `${n > 0 ? '+' : n < 0 ? '−' : ''}${units.format(Math.abs(n))}`;

export const shortDate = (iso: string) =>
  new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });

export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

/** `YYYY-MM-DD` in the user's local calendar. */
export const isoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const todayIso = () => isoDate(new Date());

/** Short month names for the last `count` months, oldest first. */
export const lastMonths = (count: number) =>
  Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (count - 1 - i));
    return d.toLocaleDateString('en-US', { month: 'short' });
  });

/** A date `days` from now (local time). */
export const inDays = (days: number) => new Date(Date.now() + days * 86_400_000);
