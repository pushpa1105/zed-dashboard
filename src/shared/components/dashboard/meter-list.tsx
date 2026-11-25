import type { ReactNode } from 'react';

import { seriesColor } from '@/shared/components/charts/series';
import { cn } from '@/shared/lib/cn';

export type MeterItem = {
  key: string;
  label: ReactNode;
  /** Current amount. */
  value: number;
  /** Capacity; the bar shows value / max. */
  max: number;
  /** Text on the right; defaults to "value/max". */
  display?: ReactNode;
  color?: string;
};

/**
 * Labeled progress bars: plan limits, budget burn, goal completion, channel
 * share. Colors follow the categorical order unless `color` is set.
 */
export function MeterList({
  items,
  className,
  size = 'md',
}: {
  items: MeterItem[];
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <ul className={cn('space-y-4', className)}>
      {items.map((item, i) => {
        const pct = item.max ? Math.min(100, (item.value / item.max) * 100) : 0;
        return (
          <li key={item.key} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate">{item.label}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {item.display ?? `${item.value}/${item.max}`}
              </span>
            </div>
            <div
              className={cn(
                'overflow-hidden rounded-full bg-muted',
                size === 'sm' ? 'h-1.5' : 'h-2',
              )}
              role="meter"
              aria-valuenow={item.value}
              aria-valuemin={0}
              aria-valuemax={item.max}
            >
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${pct}%`, background: item.color ?? seriesColor(i) }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
