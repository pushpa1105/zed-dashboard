import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

/**
 * Progress bar with a target marker. Meeting the target (at or above it, or at
 * or below it when `lowerIsBetter`) colors the bar success, missing it destructive.
 */
export function TargetBar({
  value,
  target,
  max = 100,
  lowerIsBetter,
  label,
  className,
}: {
  value: number;
  target: number;
  max?: number;
  lowerIsBetter?: boolean;
  label: ReactNode;
  className?: string;
}) {
  const met = lowerIsBetter ? value <= target : value >= target;
  const pct = (n: number) => `${Math.min(100, (n / max) * 100)}%`;
  return (
    <div className={cn('w-full min-w-32 space-y-1.5', className)}>
      <div className="relative h-2 overflow-hidden rounded-full bg-muted">
        <span
          className={cn('block h-full rounded-full', met ? 'bg-success' : 'bg-destructive')}
          style={{ width: pct(value) }}
        />
        <span className="absolute inset-y-0 w-0.5 bg-foreground/60" style={{ left: pct(target) }} />
      </div>
      <p className="text-xs text-muted-foreground tabular-nums">{label}</p>
    </div>
  );
}
