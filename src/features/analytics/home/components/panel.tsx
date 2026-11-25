import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

/**
 * This template's signature: the section title sits *outside* a flat,
 * bordered panel (no shadow), which keeps the page calm and dense.
 */
export function Panel({
  title,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn('flex h-full min-w-0 flex-col gap-3', className)}>
      <header className="flex min-h-8 items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        {action}
      </header>
      <div className={cn('flex-1 rounded-lg border bg-card', bodyClassName)}>{children}</div>
    </section>
  );
}
