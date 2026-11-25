import type { ReactNode } from 'react';
import { Cell, Label, Pie, PieChart } from 'recharts';

import { cn } from '@/shared/lib/cn';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/shared/ui/chart';

import { defaultFormatter, seriesColor, type ValueFormatter } from './series';

export type DonutSlice = { key: string; label: string; value: number; color?: string };

export type DonutChartProps = {
  data: DonutSlice[];
  className?: string;
  /** Big number in the hole. Defaults to the formatted total. */
  centerValue?: ReactNode;
  centerLabel?: ReactNode;
  /** Ring thickness as a fraction of the radius (0.1 – 0.6). */
  thickness?: number;
  /** `full` circle (default) or `half` (semicircle). */
  shape?: 'full' | 'half';
  /** Legend with values and shares beside or below the chart. */
  legend?: 'right' | 'bottom' | false;
  valueFormatter?: ValueFormatter;
};

/** Part-to-whole chart. Keep it to 5 slices or fewer; fold the rest into "Other". */
export function DonutChart({
  data,
  className,
  centerValue,
  centerLabel,
  thickness = 0.28,
  shape = 'full',
  legend = 'right',
  valueFormatter = defaultFormatter,
}: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const config = Object.fromEntries(
    data.map((d, i) => [d.key, { label: d.label, color: d.color ?? seriesColor(i) }]),
  );
  const half = shape === 'half';
  const outer = half ? 176 : 80;

  return (
    <div
      className={cn(
        'flex items-center gap-6',
        legend === 'bottom' && 'flex-col',
        legend === 'right' && 'flex-col sm:flex-row',
        className,
      )}
    >
      <ChartContainer
        config={config}
        className={cn(
          'w-full shrink-0',
          half ? 'aspect-[2/1.1] max-w-64' : 'aspect-square max-w-56',
        )}
      >
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />
          <Pie
            data={data.map((d) => ({ ...d, fill: `var(--color-${d.key})` }))}
            dataKey="value"
            nameKey="key"
            // Percent radii are relative to half the shorter side; a semicircle in a
            // 2:1 box needs ~180% to span the width.
            innerRadius={`${Math.round((1 - thickness) * outer)}%`}
            outerRadius={`${outer}%`}
            cy={half ? '92%' : '50%'}
            startAngle={half ? 180 : 90}
            endAngle={half ? 0 : -270}
            paddingAngle={2}
            cornerRadius={4}
            stroke="var(--card)"
            strokeWidth={2}
          >
            {data.map((d) => (
              <Cell key={d.key} />
            ))}
            <Label
              content={({ viewBox }) => {
                const { cx = 0, cy = 0 } = (viewBox ?? {}) as { cx?: number; cy?: number };
                return (
                  <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan
                      x={cx}
                      y={half ? cy - 30 : cy - 4}
                      className="fill-foreground text-2xl font-semibold"
                    >
                      {centerValue ?? valueFormatter(total)}
                    </tspan>
                    {centerLabel && (
                      <tspan
                        x={cx}
                        y={half ? cy - 8 : cy + 18}
                        className="fill-muted-foreground text-xs"
                      >
                        {centerLabel}
                      </tspan>
                    )}
                  </text>
                );
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>
      {legend && (
        <ul className={cn('grid w-full gap-3 text-sm', legend === 'bottom' && 'grid-cols-2')}>
          {data.map((d, i) => (
            <li key={d.key} className="flex items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-[3px]"
                style={{ background: d.color ?? seriesColor(i) }}
              />
              <span className="truncate text-muted-foreground">{d.label}</span>
              <span className="ml-auto font-medium tabular-nums">{valueFormatter(d.value)}</span>
              <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
                {total ? Math.round((d.value / total) * 100) : 0}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
