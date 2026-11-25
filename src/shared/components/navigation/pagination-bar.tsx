import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select';

import { getPaginationRange } from './pagination-range';

export type PaginationBarProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Pages shown on each side of the current page. */
  siblings?: number;
  /** Adds "Rows per page" when both are set. */
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  /** Left-side summary, e.g. "Showing 21–40 of 312". */
  summary?: React.ReactNode;
  labels?: { previous: string; next: string; rowsPerPage: string };
  className?: string;
};

/** Numbered pager with ellipses, prev/next and an optional page-size picker. */
export function PaginationBar({
  page,
  totalPages,
  onPageChange,
  siblings = 1,
  pageSize,
  pageSizeOptions = [10, 20, 50, 100],
  onPageSizeChange,
  summary,
  labels = { previous: 'Previous', next: 'Next', rowsPerPage: 'Rows per page' },
  className,
}: PaginationBarProps) {
  const tokens = getPaginationRange(page, totalPages, siblings);

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3 text-sm', className)}>
      <div className="flex items-center gap-4 text-muted-foreground">
        {summary}
        {pageSize && onPageSizeChange && (
          <label className="flex items-center gap-2">
            <span>{labels.rowsPerPage}</span>
            <NativeSelect
              size="sm"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {pageSizeOptions.map((n) => (
                <NativeSelectOption key={n} value={n}>
                  {n}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
        )}
      </div>
      <nav aria-label="Pagination" className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft /> <span className="hidden sm:inline">{labels.previous}</span>
        </Button>
        {tokens.map((token) =>
          typeof token === 'number' ? (
            <Button
              key={token}
              variant={token === page ? 'outline' : 'ghost'}
              size="icon-sm"
              aria-current={token === page ? 'page' : undefined}
              className={cn('tabular-nums', token === page && 'border-primary/40 text-primary')}
              onClick={() => onPageChange(token)}
            >
              {token}
            </Button>
          ) : (
            <span key={token} className="w-7 text-center text-muted-foreground" aria-hidden>
              …
            </span>
          ),
        )}
        <Button
          variant="ghost"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <span className="hidden sm:inline">{labels.next}</span> <ChevronRight />
        </Button>
      </nav>
    </div>
  );
}
