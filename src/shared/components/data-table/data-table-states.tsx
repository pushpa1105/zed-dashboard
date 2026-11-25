import { AlertTriangle, RotateCw, SearchX } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

/** Placeholder rows shown while the first page loads. */
export function DataTableSkeletonRows({ columns, rows = 8 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <tr key={r}>
          {Array.from({ length: columns }, (_, c) => (
            <td key={c} className="border-b px-3 py-2.5">
              <Skeleton className="h-4" style={{ width: `${45 + ((r * 7 + c * 13) % 45)}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/** Full-width message row for empty and error states. */
export function DataTableMessage({
  columns,
  icon,
  title,
  description,
  action,
}: {
  columns: number;
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <tr>
      <td colSpan={columns} className="px-3 py-14">
        <div className="sticky left-0 mx-auto flex max-w-sm flex-col items-center gap-2 text-center">
          {icon && (
            <span className="mb-1 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              {icon}
            </span>
          )}
          <p className="text-sm font-medium">{title}</p>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          {action && <div className="mt-2">{action}</div>}
        </div>
      </td>
    </tr>
  );
}

export function DataTableEmpty({
  columns,
  title = 'No results',
  description = 'Try adjusting your search or filters.',
  action,
}: {
  columns: number;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <DataTableMessage
      columns={columns}
      icon={<SearchX className="size-5" />}
      title={title}
      description={description}
      action={action}
    />
  );
}

export function DataTableError({
  columns,
  title = 'Could not load data',
  description,
  onRetry,
  retryLabel = 'Try again',
}: {
  columns: number;
  title?: ReactNode;
  description?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <DataTableMessage
      columns={columns}
      icon={<AlertTriangle className="size-5 text-destructive" />}
      title={title}
      description={description}
      action={
        onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RotateCw /> {retryLabel}
          </Button>
        )
      }
    />
  );
}
