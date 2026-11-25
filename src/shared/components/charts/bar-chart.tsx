import { Bar, BarChart as RechartsBarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';

import { cn } from '@/shared/lib/cn';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/shared/ui/chart';

import {
  axisProps,
  defaultFormatter,
  toChartConfig,
  type ChartDatum,
  type ChartSeries,
  type ValueFormatter,
} from './series';

export type BarChartProps = {
  data: ChartDatum[];
  xKey: string;
  series: ChartSeries[];
  className?: string;
  /** `grouped` (default) places bars side by side, `stacked` on top of each other. */
  mode?: 'grouped' | 'stacked';
  /** Horizontal bars (categories on the y axis). Good for long labels and rankings. */
  horizontal?: boolean;
  /**
   * Emphasize one category: every other bar is muted. Pass the index, or
   * `'last'` to highlight the most recent period.
   */
  highlight?: number | 'last';
  /** Corner radius in px, applied to the data end only. */
  radius?: number;
  /** Max bar thickness in px. */
  barSize?: number;
  hideGrid?: boolean;
  hideYAxis?: boolean;
  legend?: boolean;
  valueFormatter?: ValueFormatter;
};

/** Bar chart for comparing magnitudes across categories or periods. */
export function BarChart({
  data,
  xKey,
  series,
  className,
  mode = 'grouped',
  horizontal,
  highlight,
  radius = 4,
  barSize = 28,
  hideGrid,
  hideYAxis,
  legend = series.length > 1,
  valueFormatter = defaultFormatter,
}: BarChartProps) {
  const config = toChartConfig(series);
  const highlightIndex = highlight === 'last' ? data.length - 1 : highlight;
  const stacked = mode === 'stacked';

  return (
    <ChartContainer config={config} className={cn('aspect-auto h-64 w-full', className)}>
      <RechartsBarChart
        data={data}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{ left: 4, right: 8, top: 8 }}
        barGap={2}
      >
        {!hideGrid && (
          <CartesianGrid vertical={!!horizontal} horizontal={!horizontal} strokeDasharray="3 3" />
        )}
        {horizontal ? (
          <YAxis dataKey={xKey} type="category" {...axisProps} width={96} />
        ) : (
          <XAxis dataKey={xKey} {...axisProps} minTickGap={8} />
        )}
        {horizontal ? (
          <XAxis type="number" hide={hideYAxis} {...axisProps} tickFormatter={valueFormatter} />
        ) : (
          <YAxis hide={hideYAxis} {...axisProps} width={44} tickFormatter={valueFormatter} />
        )}
        <ChartTooltip
          cursor={{ fill: 'var(--muted)', opacity: 0.6 }}
          content={<ChartTooltipContent />}
        />
        {series.map((s, i) => {
          const r = !stacked || i === series.length - 1 ? radius : 0;
          return (
            <Bar
              key={s.key}
              dataKey={s.key}
              stackId={stacked ? 'stack' : undefined}
              fill={`var(--color-${s.key})`}
              radius={horizontal ? [0, r, r, 0] : [r, r, 0, 0]}
              maxBarSize={barSize}
              stroke={stacked ? 'var(--card)' : undefined}
              strokeWidth={stacked ? 1 : 0}
            >
              {highlightIndex !== undefined &&
                data.map((_, index) => (
                  <Cell key={index} fillOpacity={index === highlightIndex ? 1 : 0.28} />
                ))}
            </Bar>
          );
        })}
        {legend && <ChartLegend content={<ChartLegendContent />} />}
      </RechartsBarChart>
    </ChartContainer>
  );
}
