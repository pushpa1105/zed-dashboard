import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

export type DescriptionItem = { key: string; term: ReactNode; detail: ReactNode };

/**
 * Term/detail pairs. `horizontal` puts terms in a left column (record detail
 * pages); `vertical` stacks term above detail (compact side panels).
 */
export function DescriptionList({
  items,
  layout = 'horizontal',
  className,
}: {
  items: DescriptionItem[];
  layout?: 'horizontal' | 'vertical';
  className?: string;
}) {
  return (
    <dl className={cn('divide-y text-sm', className)}>
      {items.map((item) => (
        <div
          key={item.key}
          className={cn(
            'py-3 first:pt-0 last:pb-0',
            layout === 'horizontal' ? 'grid gap-1 sm:grid-cols-3 sm:gap-4' : 'space-y-1',
          )}
        >
          <dt className="text-muted-foreground">{item.term}</dt>
          <dd className={cn('font-medium', layout === 'horizontal' && 'sm:col-span-2')}>
            {item.detail}
          </dd>
        </div>
      ))}
    </dl>
  );
}
