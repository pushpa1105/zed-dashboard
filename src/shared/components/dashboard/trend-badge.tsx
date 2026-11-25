import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

import { cn } from '@/shared/lib/cn';

export type TrendBadgeProps = {
  /** Change in percent, e.g. 12.4 or -3. */
  delta: number;
  /** For metrics where lower is better (costs, churn, bounce rate). */
  invert?: boolean;
  variant?: 'pill' | 'text';
  className?: string;
};

/**
 * Signed change with direction icon. Good/bad is never color alone: the arrow
 * and sign carry it too.
 */
export function TrendBadge({ delta, invert, variant = 'pill', className }: TrendBadgeProps) {
  const flat = Math.abs(delta) < 0.05;
  const good = flat ? null : delta > 0 !== !!invert;
  const Icon = flat ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
        variant === 'pill' && 'rounded-full px-1.5 py-0.5',
        good === true && 'text-success',
        good === false && 'text-destructive',
        good === null && 'text-muted-foreground',
        variant === 'pill' && good === true && 'bg-success/10',
        variant === 'pill' && good === false && 'bg-destructive/10',
        variant === 'pill' && good === null && 'bg-muted',
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {delta > 0 ? '+' : ''}
      {delta.toFixed(Math.abs(delta) < 10 ? 1 : 0)}%
    </span>
  );
}
