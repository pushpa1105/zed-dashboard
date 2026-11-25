import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

import type { DataTableInstance } from './features';

export type PaginationLabels = {
  rowsPerPage: string;
  /** e.g. `(from, to, total) => \`${from}–${to} of ${total}\`` */
  range: (from: number, to: number, total: number) => string;
  selected: (count: number, total: number) => string;
  first: string;
  previous: string;
  next: string;
  last: string;
};

const fmt = (n: number) => n.toLocaleString();

const DEFAULT_LABELS: PaginationLabels = {
  rowsPerPage: 'Rows per page',
  range: (from, to, total) => `${fmt(from)}–${fmt(to)} of ${fmt(total)}`,
  selected: (count, total) => `${fmt(count)} of ${fmt(total)} selected`,
  first: 'First page',
  previous: 'Previous page',
  next: 'Next page',
  last: 'Last page',
};

/**
 * Footer: selection count, page size, "x–y of N" and first/prev/next/last.
 * Works in client mode and in server mode (reads `rowCount`).
 */
export function DataTablePagination<TData extends object>({
  table,
  pageSizes = [10, 20, 50, 100],
  labels: overrides,
  className,
}: {
  table: DataTableInstance<TData>;
  pageSizes?: number[];
  labels?: Partial<PaginationLabels>;
  className?: string;
}) {
  const labels = { ...DEFAULT_LABELS, ...overrides };
  const { pageIndex, pageSize } = table.state.pagination;
  const total = table.getRowCount();
  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min(total, (pageIndex + 1) * pageSize);
  const selected = Object.keys(table.state.rowSelection).length;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 px-1 text-sm text-muted-foreground',
        className,
      )}
    >
      <p className="tabular-nums">{selected > 0 ? labels.selected(selected, total) : null}</p>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline">{labels.rowsPerPage}</span>
          <Select value={String(pageSize)} onValueChange={(v) => table.setPageSize(Number(v))}>
            <SelectTrigger size="sm" className="w-18">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {pageSizes.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="min-w-28 text-center tabular-nums">{labels.range(from, to, total)}</span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={labels.first}
            onClick={() => table.firstPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={labels.previous}
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={labels.next}
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={labels.last}
            onClick={() => table.lastPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
