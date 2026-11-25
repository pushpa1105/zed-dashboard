import { PolarAngleAxis, PolarGrid, Radar, RadarChart as RechartsRadarChart } from 'recharts';

import { cn } from '@/shared/lib/cn';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/shared/ui/chart';

import { toChartConfig, type ChartDatum, type ChartSeries } from './series';

export type RadarChartProps = {
  data: ChartDatum[];
  /** Field naming each axis (e.g. "skill", "channel"). */
  axisKey: string;
  series: ChartSeries[];
  className?: string;
  legend?: boolean;
};

/** Profile comparison across 5–8 dimensions (skills, channel mix, product scores). */
export function RadarChart({
  data,
  axisKey,
  series,
  className,
  legend = series.length > 1,
}: RadarChartProps) {
  const config = toChartConfig(series);

  return (
    <ChartContainer config={config} className={cn('mx-auto aspect-square max-h-72', className)}>
      <RechartsRadarChart data={data} outerRadius="64%">
        <ChartTooltip content={<ChartTooltipContent />} />
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis
          dataKey={axisKey}
          tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
        />
        {series.map((s) => (
          <Radar
            key={s.key}
            dataKey={s.key}
            stroke={`var(--color-${s.key})`}
            strokeWidth={2}
            fill={`var(--color-${s.key})`}
            fillOpacity={0.15}
            dot={{ r: 3, fillOpacity: 1 }}
          />
        ))}
        {legend && <ChartLegend content={<ChartLegendContent />} />}
      </RechartsRadarChart>
    </ChartContainer>
  );
}
