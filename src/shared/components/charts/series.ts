import type { ChartConfig } from '@/shared/ui/chart';

/**
 * One plotted series. `key` is the data field; `color` defaults to the next
 * categorical slot (`--chart-1` … `--chart-5`), assigned in fixed order so a
 * series keeps its color when others are toggled.
 */
export type ChartSeries = {
  key: string;
  label: string;
  color?: string;
};

export type ChartDatum = Record<string, string | number | null | undefined>;

/** Formats a numeric value for axes and tooltips. */
export type ValueFormatter = (value: number) => string;

export const defaultFormatter: ValueFormatter = (value) =>
  new Intl.NumberFormat(undefined, {
    notation: value >= 10_000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value);

export const seriesColor = (index: number) => `var(--chart-${(index % 5) + 1})`;

/** Builds the shadcn ChartConfig (exposes `--color-<key>` CSS vars). */
export function toChartConfig(series: ChartSeries[]): ChartConfig {
  return Object.fromEntries(
    series.map((s, i) => [s.key, { label: s.label, color: s.color ?? seriesColor(i) }]),
  );
}

/** Shared axis styling: recessive ink, no axis lines. */
export const axisProps = {
  tickLine: false,
  axisLine: false,
  tickMargin: 8,
  fontSize: 12,
} as const;
