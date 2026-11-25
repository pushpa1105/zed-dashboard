import type { ReactNode } from 'react';

import { SectionCard } from '@/shared/components/dashboard/section-card';
import { cn } from '@/shared/lib/cn';

/** Two-column grid of demos; a `wide` demo spans both columns. */
export function ShowcaseGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid gap-6 lg:grid-cols-2', className)}>{children}</div>;
}

/** One demo: a titled card with a short description. */
export function Demo({
  id,
  title,
  description,
  wide,
  action,
  children,
  className,
}: {
  /** Anchor id (for in-page jump links). */
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  wide?: boolean;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div id={id} className={cn('min-w-0 scroll-mt-24', wide && 'lg:col-span-2')}>
      <SectionCard
        title={title}
        description={description}
        action={action}
        className={cn('h-full', className)}
        contentClassName="space-y-4"
      >
        {children}
      </SectionCard>
    </div>
  );
}

/** Live readout of a component's value, for demos. */
export function ValuePreview({ label = 'Value', value }: { label?: string; value: unknown }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 font-mono text-xs">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 break-all">
        {JSON.stringify(value, (_, v: unknown) => (v instanceof Date ? v.toISOString() : v)) ??
          'undefined'}
      </span>
    </div>
  );
}

/** Small caption above a control inside a demo. */
export function DemoLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-muted-foreground">
      {children}
    </label>
  );
}
