export const money = (value: number, locale: string, fractionDigits = 0) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: fractionDigits,
  }).format(value);

export const compact = (value: number, locale: string) =>
  new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value);

/** 8_100_000 → "2h 15m". Shows the two largest units, at least minutes. */
export const duration = (ms: number) => {
  const minutes = Math.max(1, Math.round(Math.abs(ms) / 60_000));
  const [d, h, m] = [Math.floor(minutes / 1440), Math.floor(minutes / 60) % 24, minutes % 60];
  if (d) return h ? `${d}d ${h}h` : `${d}d`;
  if (h) return m ? `${h}h ${m}m` : `${h}h`;
  return `${m}m`;
};
