import { cn } from '@/shared/lib/cn';
import { Skeleton } from '@/shared/ui/skeleton';

/** Loading placeholder shaped like a stat card. */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-3 rounded-xl border bg-card p-5', className)} aria-busy="true">
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-10 rounded-lg" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-3 w-40" />
    </div>
  );
}

/** Loading placeholder shaped like a list of rows. */
export function ListSkeleton({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-4', className)} aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

/** Loading placeholder shaped like a table. */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn('overflow-hidden rounded-lg border', className)} aria-busy="true">
      <div className="flex gap-4 border-b bg-muted/50 px-4 py-3">
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex gap-4 border-b px-4 py-3.5 last:border-0">
          {Array.from({ length: columns }, (_, c) => (
            <Skeleton key={c} className={cn('h-3.5 flex-1', c === 0 && 'max-w-40')} />
          ))}
        </div>
      ))}
    </div>
  );
}

const BAR_HEIGHTS = [45, 70, 55, 85, 60, 95, 75, 50, 80, 65, 90, 70];

/** Loading placeholder shaped like a bar chart. */
export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex h-48 items-end gap-2', className)} aria-busy="true">
      {BAR_HEIGHTS.map((h, i) => (
        <Skeleton
          key={i}
          className="flex-1 rounded-t-md rounded-b-none"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}
