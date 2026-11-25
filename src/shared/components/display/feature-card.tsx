import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

export type FeatureCardProps = {
  icon: LucideIcon;
  title: ReactNode;
  description: ReactNode;
  /** A link or small CTA at the bottom. */
  footer?: ReactNode;
  color?: string;
  className?: string;
};

/** Icon + title + description tile for feature grids, onboarding and empty dashboards. */
export function FeatureCard({
  icon: Icon,
  title,
  description,
  footer,
  color = 'var(--primary)',
  className,
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        'group flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-xs transition-shadow hover:shadow-md',
        className,
      )}
    >
      <span
        className="flex size-10 items-center justify-center rounded-lg"
        style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}
      >
        <Icon className="size-5" />
      </span>
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {footer && <div className="mt-auto pt-1 text-sm">{footer}</div>}
    </div>
  );
}
