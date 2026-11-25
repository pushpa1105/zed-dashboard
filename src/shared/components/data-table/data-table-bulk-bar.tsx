import { X } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

/**
 * Floating action bar shown while rows are selected (bulk ship, export,
 * delete…). Renders nothing when `count` is 0.
 */
export function DataTableBulkBar({
  count,
  onClear,
  children,
  label = (n: number) => `${n.toLocaleString()} selected`,
  clearLabel = 'Clear selection',
  className,
}: {
  count: number;
  onClear: () => void;
  /** Action buttons. Use `size="sm"` and `variant="ghost"` for the bar's dark surface. */
  children: ReactNode;
  label?: (count: number) => string;
  clearLabel?: string;
  className?: string;
}) {
  if (count === 0) return null;
  return (
    <div
      role="toolbar"
      aria-label={label(count)}
      className={cn(
        'fixed inset-x-0 bottom-6 z-40 mx-auto flex w-fit max-w-[calc(100vw-2rem)] animate-in items-center gap-1 rounded-xl border bg-popover p-1.5 pl-3 text-sm text-popover-foreground shadow-lg fade-in slide-in-from-bottom-4',
        className,
      )}
    >
      <span className="mr-2 font-medium tabular-nums">{label(count)}</span>
      <span className="mr-1 h-5 w-px bg-border" />
      <div className="flex flex-wrap items-center gap-1">{children}</div>
      <Button variant="ghost" size="icon-sm" onClick={onClear} aria-label={clearLabel}>
        <X />
      </Button>
    </div>
  );
}
