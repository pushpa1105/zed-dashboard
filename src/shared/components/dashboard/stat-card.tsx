import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Sparkline } from '@/shared/components/charts/sparkline';
import { cn } from '@/shared/lib/cn';
import { Skeleton } from '@/shared/ui/skeleton';

import { TrendBadge } from './trend-badge';

export type StatCardProps = {
  label: ReactNode;
  value: ReactNode;
  icon?: LucideIcon;
  /** Percent change; renders a TrendBadge. */
  delta?: number;
  /** Lower is better (costs, churn…). */
  invert?: boolean;
  /** Text after the delta, e.g. "vs last month". */
  hint?: ReactNode;
  /** Small trend line in the corner. */
  sparkline?: number[];
  /**
   * - `default`: label on top, value, delta row
   * - `tile`: colored icon tile on the left (compact)
   * - `accent`: filled with a brand gradient (use for one hero metric per row)
   * - `minimal`: no card chrome; for stat strips inside another card
   */
  variant?: 'default' | 'tile' | 'accent' | 'minimal';
  /** Icon tile / sparkline color. Any CSS color; defaults to the brand color. */
  color?: string;
  loading?: boolean;
  className?: string;
  children?: ReactNode;
};

/** KPI tile. One number, its change, and (optionally) its shape over time. */
export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  invert,
  hint,
  sparkline,
  variant = 'default',
  color = 'var(--primary)',
  loading,
  className,
  children,
}: StatCardProps) {
  const accent = variant === 'accent';

  const iconTile = Icon && (
    <span
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-lg',
        accent && 'bg-overlay-foreground/15 text-overlay-foreground',
      )}
      style={
        accent ? undefined : { background: `color-mix(in srgb, ${color} 12%, transparent)`, color }
      }
    >
      <Icon className="size-[1.15rem]" />
    </span>
  );

  const valueNode = loading ? (
    <Skeleton className="h-8 w-24" />
  ) : (
    <p className="text-[1.65rem] leading-none font-semibold tracking-tight tabular-nums">{value}</p>
  );

  const deltaRow = (delta !== undefined || hint) && (
    <div
      className={cn(
        'flex flex-wrap items-center gap-1.5 text-xs',
        accent ? 'text-overlay-foreground/80' : 'text-muted-foreground',
      )}
    >
      {delta !== undefined && (
        <TrendBadge
          delta={delta}
          invert={invert}
          className={accent ? 'bg-overlay-foreground/15 text-overlay-foreground' : undefined}
        />
      )}
      {hint}
    </div>
  );

  if (variant === 'tile') {
    return (
      <div
        className={cn('flex items-center gap-4 rounded-xl border bg-card p-5 shadow-xs', className)}
      >
        {iconTile}
        <div className="min-w-0 space-y-1">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <div className="flex items-baseline gap-2">
            {loading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <p className="text-lg font-semibold tabular-nums">{value}</p>
            )}
            {delta !== undefined && <TrendBadge delta={delta} invert={invert} variant="text" />}
          </div>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative flex flex-col gap-3 overflow-hidden',
        variant !== 'minimal' && 'rounded-xl p-6',
        variant === 'default' && 'border bg-card shadow-xs',
        accent && 'text-overlay-foreground shadow-md',
        className,
      )}
      style={
        accent
          ? {
              background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 70%, var(--background)))`,
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {iconTile}
          <p
            className={cn(
              'text-sm',
              accent ? 'text-overlay-foreground/85' : 'text-muted-foreground',
            )}
          >
            {label}
          </p>
        </div>
        {sparkline && (
          <Sparkline data={sparkline} color={accent ? 'white' : color} className="-mt-1 h-8 w-20" />
        )}
      </div>
      {valueNode}
      {deltaRow}
      {children}
    </div>
  );
}
