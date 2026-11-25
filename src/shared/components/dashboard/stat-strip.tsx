import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import { TrendBadge } from './trend-badge';

export type StatStripItem = {
  key: string;
  label: ReactNode;
  value: ReactNode;
  delta?: number;
  invert?: boolean;
  /** Small text under the value ("in last 7 days"). */
  hint?: ReactNode;
  /** Optional leading visual (icon tile, avatar…). */
  media?: ReactNode;
};

/**
 * Several KPIs in one row separated by dividers. Denser than a row of cards;
 * use it at the top of a chart card or as a summary band.
 */
export function StatStrip({ items, className }: { items: StatStripItem[]; className?: string }) {
  return (
    <dl
      className={cn(
        'grid divide-y sm:grid-cols-2 sm:divide-y-0 lg:divide-x',
        items.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3',
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.key} className="flex items-center gap-3 py-3 sm:px-5 sm:first:pl-0">
          {item.media}
          <div className="min-w-0 space-y-1">
            <dt className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              {item.label}
              {item.delta !== undefined && <TrendBadge delta={item.delta} invert={item.invert} />}
            </dt>
            <dd className="text-2xl font-semibold tracking-tight tabular-nums">{item.value}</dd>
            {item.hint && <dd className="text-xs text-muted-foreground">{item.hint}</dd>}
          </div>
        </div>
      ))}
    </dl>
  );
}
