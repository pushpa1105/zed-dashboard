import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

export type EmptyStateProps = {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  /** Buttons or links. */
  actions?: ReactNode;
  /**
   * - `default`: centered, dashed border (empty list, first-run)
   * - `plain`: centered, no border (inside a card)
   * - `inline`: left-aligned row (small panels, search with no results)
   */
  variant?: 'default' | 'plain' | 'inline';
  className?: string;
};

/** Placeholder for "nothing here yet": says why and what to do next. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actions,
  variant = 'default',
  className,
}: EmptyStateProps) {
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-start gap-3 py-2', className)}>
        {Icon && (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </span>
        )}
        <div className="space-y-1">
          <p className="text-sm font-medium">{title}</p>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          {actions && <div className="flex flex-wrap gap-2 pt-1">{actions}</div>}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-10 text-center',
        variant === 'default' && 'rounded-xl border border-dashed',
        className,
      )}
    >
      {Icon && (
        <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground ring-8 ring-muted/40">
          <Icon className="size-5" />
        </span>
      )}
      <p className="text-base font-semibold">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-balance text-muted-foreground">{description}</p>
      )}
      {actions && <div className="mt-5 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}
