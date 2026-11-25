import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts';

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

export type LineChartProps = {
  data: ChartDatum[];
  xKey: string;
  series: ChartSeries[];
  className?: string;
  curve?: 'natural' | 'monotone' | 'linear' | 'step';
  /** Show a dot on every point. */
  dots?: boolean;
  /** Draws a dashed horizontal target line. */
  target?: { value: number; label?: string };
  /** Series keys drawn dashed (e.g. a forecast or the previous period). */
  dashed?: string[];
  hideGrid?: boolean;
  hideYAxis?: boolean;
  legend?: boolean;
  valueFormatter?: ValueFormatter;
};

/** Multi-series line chart: compare trends (this period vs. last, A vs. B). */
export function LineChart({
  data,
  xKey,
  series,
  className,
  curve = 'natural',
  dots,
  target,
  dashed = [],
  hideGrid,
  hideYAxis,
  legend = series.length > 1,
  valueFormatter = defaultFormatter,
}: LineChartProps) {
  const config = toChartConfig(series);

  return (
    <ChartContainer config={config} className={cn('aspect-auto h-64 w-full', className)}>
      <RechartsLineChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        {!hideGrid && <CartesianGrid vertical={false} strokeDasharray="3 3" />}
        <XAxis dataKey={xKey} {...axisProps} minTickGap={24} />
        <YAxis hide={hideYAxis} {...axisProps} width={44} tickFormatter={valueFormatter} />
        <ChartTooltip
          cursor={{ strokeDasharray: '4 4' }}
          content={<ChartTooltipContent indicator="line" />}
        />
        {target && (
          <ReferenceLine
            y={target.value}
            stroke="var(--muted-foreground)"
            strokeDasharray="4 4"
            label={
              target.label
                ? {
                    value: target.label,
                    position: 'insideTopRight',
                    fontSize: 11,
                    fill: 'var(--muted-foreground)',
                  }
                : undefined
            }
          />
        )}
        {series.map((s) => (
          <Line
            key={s.key}
            dataKey={s.key}
            type={curve}
            stroke={`var(--color-${s.key})`}
            strokeWidth={2}
            strokeDasharray={dashed.includes(s.key) ? '5 5' : undefined}
            dot={dots ? { r: 4, strokeWidth: 2, fill: 'var(--card)' } : false}
            activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--card)' }}
          />
        ))}
        {legend && <ChartLegend content={<ChartLegendContent />} />}
      </RechartsLineChart>
    </ChartContainer>
  );
}
