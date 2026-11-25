import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

export type ListColumn = { key: string; label: ReactNode; className?: string };

/**
 * Card-framed table for a query result: skeleton rows while `rows` is undefined,
 * dimmed while showing placeholder data, and `empty` below the header when set.
 */
export function ListTable({
  label,
  columns,
  rows,
  faded,
  empty,
}: {
  label: string;
  columns: ListColumn[];
  rows: ReactNode;
  faded?: boolean;
  empty?: ReactNode;
}) {
  return (
    <div className={cn('overflow-hidden rounded-xl border bg-card', faded && 'opacity-70')}>
      <Table aria-label={label}>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((col) => (
              <TableHead key={col.key} className={col.className}>
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows ??
            Array.from({ length: 8 }, (_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={columns.length} className="px-6">
                  <Skeleton className="h-8" />
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
      {empty}
    </div>
  );
}
