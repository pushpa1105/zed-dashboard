import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

export type KeyValue = { key: string; label: ReactNode; value: ReactNode; hint?: ReactNode };

/** Compact grid of labeled values in bordered cells (specs, metadata, summaries). */
export function KeyValueGrid({
  items,
  columns = 3,
  className,
}: {
  items: KeyValue[];
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  return (
    <dl
      className={cn(
        'grid [gap:1px] overflow-hidden rounded-lg border bg-border',
        columns === 2 && 'sm:grid-cols-2',
        columns === 3 && 'sm:grid-cols-3',
        columns === 4 && 'sm:grid-cols-2 lg:grid-cols-4',
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.key} className="space-y-1 bg-card p-4">
          <dt className="text-xs text-muted-foreground">{item.label}</dt>
          <dd className="text-base font-semibold tabular-nums">{item.value}</dd>
          {item.hint && <dd className="text-xs text-muted-foreground">{item.hint}</dd>}
        </div>
      ))}
    </dl>
  );
}
