import { PolarAngleAxis, RadialBar, RadialBarChart } from 'recharts';

import { cn } from '@/shared/lib/cn';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/shared/ui/chart';

import { seriesColor } from './series';

export type RadialRing = { key: string; label: string; value: number; color?: string };

export type RadialChartProps = {
  /** One ring per item, outermost first. Values are percentages (0 – 100). */
  data: RadialRing[];
  className?: string;
  legend?: boolean;
};

/** Concentric progress rings: compare a few completion rates at a glance. */
export function RadialChart({ data, className, legend = true }: RadialChartProps) {
  const config = Object.fromEntries(
    data.map((d, i) => [d.key, { label: d.label, color: d.color ?? seriesColor(i) }]),
  );
  // Recharts draws the first item innermost; reverse so the list reads outside-in.
  const rings = [...data].reverse().map((d) => ({ ...d, fill: `var(--color-${d.key})` }));

  return (
    <div className={cn('flex flex-col items-center gap-4 sm:flex-row', className)}>
      <ChartContainer config={config} className="aspect-square w-full max-w-56">
        <RadialBarChart
          data={rings}
          innerRadius="28%"
          outerRadius="100%"
          startAngle={90}
          endAngle={-270}
          barSize={10}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />
          <RadialBar dataKey="value" background={{ fill: 'var(--muted)' }} cornerRadius={8} />
        </RadialBarChart>
      </ChartContainer>
      {legend && (
        <ul className="grid w-full gap-3 text-sm">
          {data.map((d, i) => (
            <li key={d.key} className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ background: d.color ?? seriesColor(i) }}
              />
              <span className="text-muted-foreground">{d.label}</span>
              <span className="ml-auto font-medium tabular-nums">{d.value}%</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
