import type { ReactNode } from 'react';

import { Skeleton } from '@/shared/ui/skeleton';
import { TableCell, TableRow } from '@/shared/ui/table';

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-2 px-6 pb-6">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-11 w-full" />
      ))}
    </div>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-12 text-center text-muted-foreground">
        {children}
      </TableCell>
    </TableRow>
  );
}
