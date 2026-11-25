export const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

export const mean = (values: number[]) => (values.length ? sum(values) / values.length : 0);

/** Average of `value` weighted by `weight`, e.g. on-time % weighted by shipments. */
export function weightedMean<T>(
  items: T[],
  value: (item: T) => number,
  weight: (item: T) => number,
) {
  const total = sum(items.map(weight));
  return total ? sum(items.map((i) => value(i) * weight(i))) / total : 0;
}

/** Percent change from `previous` to `current`, one decimal. */
export const pctChange = (current: number, previous: number) =>
  previous ? Math.round(((current - previous) / previous) * 1000) / 10 : 0;
