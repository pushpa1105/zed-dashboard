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
