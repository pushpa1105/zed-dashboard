/** Currency formatting for the ERP workspace (USD books). */
const full = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const whole = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const compact = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const money = (value: number) => full.format(value);
export const moneyWhole = (value: number) => whole.format(value);
export const moneyCompact = (value: number) => compact.format(value);

/** Accounting style: negatives in parentheses, zero as an em dash. */
export const accounting = (value: number) => {
  if (Math.abs(value) < 0.005) return '—';
  const text = whole.format(Math.abs(value));
  return value < 0 ? `(${text})` : text;
};

export const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
