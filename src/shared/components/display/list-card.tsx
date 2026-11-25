import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

export type ListRow = {
  key: string;
  /** Leading visual: avatar, icon tile, thumbnail. */
  media?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right side: value, status, timestamp. */
  meta?: ReactNode;
  /** Trailing control (menu, button). */
  action?: ReactNode;
  onClick?: () => void;
};

/** Stacked rows with media, text, meta and an action: the generic list widget. */
export function ListCard({
  rows,
  dividers = true,
  className,
}: {
  rows: ListRow[];
  dividers?: boolean;
  className?: string;
}) {
  return (
    <ul className={cn(dividers && 'divide-y', className)}>
      {rows.map((row) => {
        const Inner = row.onClick ? 'button' : 'div';
        return (
          <li key={row.key}>
            <Inner
              type={row.onClick ? 'button' : undefined}
              onClick={row.onClick}
              className={cn(
                'flex w-full items-center gap-3 py-3 text-left',
                row.onClick && '-mx-2 rounded-md px-2 hover:bg-muted/60',
              )}
            >
              {row.media}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{row.title}</p>
                {row.subtitle && (
                  <p className="truncate text-xs text-muted-foreground">{row.subtitle}</p>
                )}
              </div>
              {row.meta && <div className="shrink-0 text-right text-sm">{row.meta}</div>}
              {row.action}
            </Inner>
          </li>
        );
      })}
    </ul>
  );
}
