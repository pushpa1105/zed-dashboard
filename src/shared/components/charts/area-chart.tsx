import { useId } from 'react';
import { Area, AreaChart as RechartsAreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

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

export type AreaChartProps = {
  data: ChartDatum[];
  xKey: string;
  series: ChartSeries[];
  className?: string;
  /** Stack series on top of each other. */
  stacked?: boolean;
  /** `natural` = smooth curves (default), `linear`, `step`. */
  curve?: 'natural' | 'monotone' | 'linear' | 'step';
  /** Fill with a vertical gradient that fades out (default) or a flat tint. */
  fill?: 'gradient' | 'solid' | 'none';
  hideGrid?: boolean;
  hideYAxis?: boolean;
  hideXAxis?: boolean;
  legend?: boolean;
  valueFormatter?: ValueFormatter;
  xFormatter?: (value: string) => string;
};

/** Smooth area/line chart for trends over time (single or multiple series). */
export function AreaChart({
  data,
  xKey,
  series,
  className,
  stacked,
  curve = 'natural',
  fill = 'gradient',
  hideGrid,
  hideYAxis,
  hideXAxis,
  legend = series.length > 1,
  valueFormatter = defaultFormatter,
  xFormatter,
}: AreaChartProps) {
  const id = useId().replace(/:/g, '');
  const config = toChartConfig(series);

  return (
    <ChartContainer config={config} className={cn('aspect-auto h-64 w-full', className)}>
      <RechartsAreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`${id}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={`var(--color-${s.key})`} stopOpacity={0.28} />
              <stop offset="100%" stopColor={`var(--color-${s.key})`} stopOpacity={0.01} />
            </linearGradient>
          ))}
        </defs>
        {!hideGrid && <CartesianGrid vertical={false} strokeDasharray="3 3" />}
        <XAxis
          dataKey={xKey}
          hide={hideXAxis}
          {...axisProps}
          minTickGap={24}
          tickFormatter={xFormatter}
        />
        <YAxis hide={hideYAxis} {...axisProps} width={44} tickFormatter={valueFormatter} />
        <ChartTooltip
          cursor={{ strokeDasharray: '4 4' }}
          content={
            <ChartTooltipContent
              indicator="dot"
              formatter={(value, name, item) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="size-2.5 rounded-[2px]" style={{ background: item.color }} />
                    {config[String(name)]?.label ?? name}
                  </span>
                  <span className="font-medium text-foreground tabular-nums">
                    {valueFormatter(Number(value))}
                  </span>
                </div>
              )}
            />
          }
        />
        {series.map((s) => (
          <Area
            key={s.key}
            dataKey={s.key}
            type={curve}
            stackId={stacked ? 'stack' : undefined}
            stroke={`var(--color-${s.key})`}
            strokeWidth={2}
            fill={
              fill === 'gradient'
                ? `url(#${id}-${s.key})`
                : fill === 'solid'
                  ? `var(--color-${s.key})`
                  : 'transparent'
            }
            fillOpacity={fill === 'solid' ? 0.15 : 1}
            activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--card)' }}
          />
        ))}
        {legend && <ChartLegend content={<ChartLegendContent />} />}
      </RechartsAreaChart>
    </ChartContainer>
  );
}
