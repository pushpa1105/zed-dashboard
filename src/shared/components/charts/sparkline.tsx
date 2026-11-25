import { useId } from 'react';
import { Area, AreaChart, Bar, BarChart, Line, LineChart, YAxis } from 'recharts';

import { cn } from '@/shared/lib/cn';

export type SparklineProps = {
  data: number[];
  /** Any CSS color. Defaults to the first chart slot. */
  color?: string;
  variant?: 'area' | 'line' | 'bar';
  className?: string;
  /** Accessible summary, e.g. "Revenue, last 12 weeks, trending up". */
  label?: string;
};

/**
 * Word-sized trend line for stat tiles and table cells. No axes, no tooltip:
 * it shows shape, not values. Put the value next to it.
 */
export function Sparkline({
  data,
  color = 'var(--chart-1)',
  variant = 'area',
  className,
  label,
}: SparklineProps) {
  const id = useId().replace(/:/g, '');
  const points = data.map((value, index) => ({ index, value }));
  const domain = ['dataMin - 1', 'dataMax + 1'] as const;
  const size = { width: 120, height: 36 };

  return (
    <div className={cn('h-9 w-28', className)} role="img" aria-label={label}>
      {variant === 'bar' ? (
        <BarChart data={points} {...size} style={{ width: '100%', height: '100%' }} responsive>
          <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} isAnimationActive={false} />
        </BarChart>
      ) : variant === 'line' ? (
        <LineChart data={points} {...size} style={{ width: '100%', height: '100%' }} responsive>
          <YAxis hide domain={domain} />
          <Line
            dataKey="value"
            type="natural"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      ) : (
        <AreaChart data={points} {...size} style={{ width: '100%', height: '100%' }} responsive>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={domain} />
          <Area
            dataKey="value"
            type="natural"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${id})`}
            isAnimationActive={false}
          />
        </AreaChart>
      )}
    </div>
  );
}
