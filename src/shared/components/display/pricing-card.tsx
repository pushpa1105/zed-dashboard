import { Check } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

export type PricingCardProps = {
  name: ReactNode;
  price: ReactNode;
  /** e.g. "/month", "per seat". */
  period?: ReactNode;
  description?: ReactNode;
  features: ReactNode[];
  /** The CTA button. */
  action: ReactNode;
  /** Visually emphasized plan with a ribbon label. */
  highlighted?: boolean;
  badge?: ReactNode;
  className?: string;
};

/** Plan card for pricing tables and upgrade dialogs. */
export function PricingCard({
  name,
  price,
  period,
  description,
  features,
  action,
  highlighted,
  badge,
  className,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col gap-5 rounded-xl border bg-card p-6 shadow-xs',
        highlighted &&
          'border-primary shadow-[0_0_0_1px_var(--primary),0_12px_32px_-12px_color-mix(in_oklch,var(--primary)_40%,transparent)]',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">{name}</p>
        {badge && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {badge}
          </span>
        )}
      </div>
      <div>
        <p className="flex items-baseline gap-1">
          <span className="text-4xl font-semibold tracking-tight tabular-nums">{price}</span>
          {period && <span className="text-sm text-muted-foreground">{period}</span>}
        </p>
        {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
      <ul className="space-y-2.5 border-t pt-5 text-sm">
        {features.map((feature, i) => (
          <li key={i} className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
