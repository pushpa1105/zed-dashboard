import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

export type SectionCardProps = {
  title?: ReactNode;
  description?: ReactNode;
  /** Right side of the header: a select, tabs, a menu button… */
  action?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  /** `default` white card, `muted` tinted, `ghost` no chrome (title only). */
  variant?: 'default' | 'muted' | 'ghost';
  /** Remove content padding (for tables and edge-to-edge lists). */
  flush?: boolean;
};

/**
 * The standard dashboard panel: title row with an optional action, content,
 * optional footer. Every widget on every dashboard template sits in one.
 */
export function SectionCard({
  title,
  description,
  action,
  footer,
  children,
  className,
  contentClassName,
  variant = 'default',
  flush,
}: SectionCardProps) {
  const hasHeader = title || description || action;

  return (
    <section
      className={cn(
        'flex min-w-0 flex-col rounded-xl text-card-foreground',
        variant === 'default' && 'border bg-card shadow-xs',
        variant === 'muted' && 'bg-muted/60',
        className,
      )}
    >
      {hasHeader && (
        <header
          className={cn(
            'flex items-start justify-between gap-3',
            variant === 'ghost' ? 'pb-4' : 'px-6 pt-6 pb-4',
          )}
        >
          <div className="min-w-0 space-y-1">
            {title && <h2 className="text-base leading-6 font-semibold tracking-tight">{title}</h2>}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </header>
      )}
      <div
        className={cn(
          'flex-1',
          !flush && variant !== 'ghost' && 'px-6 pb-6',
          !hasHeader && !flush && variant !== 'ghost' && 'pt-6',
          contentClassName,
        )}
      >
        {children}
      </div>
      {footer && (
        <footer className="border-t px-6 py-3.5 text-sm text-muted-foreground">{footer}</footer>
      )}
    </section>
  );
}
