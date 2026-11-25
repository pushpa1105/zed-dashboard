import { ChevronRight } from 'lucide-react';

import { cn } from '@/shared/lib/cn';
import { Checkbox } from '@/shared/ui/checkbox';

import { createDataTableColumnHelper } from './features';

/**
 * Checkbox column: header toggles the current page (indeterminate when
 * partially selected), cells toggle one row. Shift-click is not intercepted.
 */
export function createSelectColumn<TData extends object>({
  label = 'Select',
}: { label?: string } = {}) {
  return createDataTableColumnHelper<TData>().display({
    id: 'select',
    size: 40,
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    enablePinning: false,
    enableGrouping: false,
    header: ({ table }) => {
      const all = table.getIsAllPageRowsSelected();
      const some = table.getIsSomePageRowsSelected() && !all;
      return (
        <Checkbox
          aria-label={`${label} all`}
          checked={all ? true : some ? 'indeterminate' : false}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          onPointerDown={(e) => e.stopPropagation()}
        />
      );
    },
    cell: ({ row }) => (
      <Checkbox
        aria-label={label}
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        onClick={(e) => e.stopPropagation()}
      />
    ),
  });
}

/** Chevron column that expands sub-rows or a detail panel. */
export function createExpandColumn<TData extends object>({
  label = 'Toggle details',
}: { label?: string } = {}) {
  return createDataTableColumnHelper<TData>().display({
    id: 'expand',
    size: 36,
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    enableGrouping: false,
    header: () => null,
    cell: ({ row }) =>
      row.getCanExpand() ? (
        <button
          type="button"
          aria-label={label}
          aria-expanded={row.getIsExpanded()}
          onClick={(e) => {
            e.stopPropagation();
            row.toggleExpanded();
          }}
          className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          style={{ marginInlineStart: row.depth * 12 }}
        >
          <ChevronRight
            className={cn('size-4 transition-transform', row.getIsExpanded() && 'rotate-90')}
          />
        </button>
      ) : null,
  });
}
