import type { Column } from '@tanstack/react-table';
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  EyeOff,
  Group,
  PinOff,
  PanelLeft,
  PanelRight,
  X,
} from 'lucide-react';

import { cn } from '@/shared/lib/cn';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

import type { DataTableFeatures } from './features';

export type ColumnHeaderLabels = {
  asc: string;
  desc: string;
  clearSort: string;
  pinStart: string;
  pinEnd: string;
  unpin: string;
  hide: string;
  group: string;
  ungroup: string;
};

const DEFAULT_LABELS: ColumnHeaderLabels = {
  asc: 'Sort ascending',
  desc: 'Sort descending',
  clearSort: 'Clear sort',
  pinStart: 'Pin to left',
  pinEnd: 'Pin to right',
  unpin: 'Unpin',
  hide: 'Hide column',
  group: 'Group by this column',
  ungroup: 'Remove grouping',
};

/**
 * Column header with a menu: sort asc/desc/clear, pin left/right, group, hide.
 * The sort indicator also shows the multi-sort position (1, 2…).
 */
export function DataTableColumnHeader<TData extends object, TValue = unknown>({
  column,
  title,
  className,
  labels: labelOverrides,
}: {
  column: Column<DataTableFeatures, TData, TValue>;
  title: string;
  className?: string;
  labels?: Partial<ColumnHeaderLabels>;
}) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const canSort = column.getCanSort();
  const canPin = column.getCanPin();
  const canHide = column.getCanHide();
  const canGroup = column.getCanGroup();
  const align = column.columnDef.meta?.align;

  if (!canSort && !canPin && !canHide && !canGroup) {
    return <span className={className}>{title}</span>;
  }

  const sorted = column.getIsSorted();
  const sortIndex = column.getSortIndex();
  const multi = column.table.atoms.sorting.get().length > 1;
  const pinned = column.getIsPinned();
  const SortIcon = sorted === 'asc' ? ArrowUp : sorted === 'desc' ? ArrowDown : ChevronsUpDown;

  return (
    <div className={cn('flex', align === 'end' && 'justify-end', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger
          onPointerDown={(e) => e.stopPropagation()}
          className={cn(
            '-mx-1.5 inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-xs font-medium outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 data-[state=open]:bg-muted',
            sorted && 'text-foreground',
          )}
        >
          <span className="truncate">{title}</span>
          {canSort && (
            <span className="flex items-center text-muted-foreground">
              <SortIcon className={cn('size-3.5', !sorted && 'opacity-50')} />
              {sorted && multi && (
                <span className="text-[0.65rem] tabular-nums">{sortIndex + 1}</span>
              )}
            </span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-44">
          {canSort && (
            <>
              <DropdownMenuItem onClick={() => column.toggleSorting(false, true)}>
                <ArrowUp /> {labels.asc}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => column.toggleSorting(true, true)}>
                <ArrowDown /> {labels.desc}
              </DropdownMenuItem>
              {sorted && (
                <DropdownMenuItem onClick={() => column.clearSorting()}>
                  <X /> {labels.clearSort}
                </DropdownMenuItem>
              )}
            </>
          )}
          {canPin && (
            <>
              <DropdownMenuSeparator />
              {pinned !== 'start' && (
                <DropdownMenuItem onClick={() => column.pin('start')}>
                  <PanelLeft /> {labels.pinStart}
                </DropdownMenuItem>
              )}
              {pinned !== 'end' && (
                <DropdownMenuItem onClick={() => column.pin('end')}>
                  <PanelRight /> {labels.pinEnd}
                </DropdownMenuItem>
              )}
              {pinned && (
                <DropdownMenuItem onClick={() => column.pin(false)}>
                  <PinOff /> {labels.unpin}
                </DropdownMenuItem>
              )}
            </>
          )}
          {canGroup && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => column.toggleGrouping()}>
                <Group /> {column.getIsGrouped() ? labels.ungroup : labels.group}
              </DropdownMenuItem>
            </>
          )}
          {canHide && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
                <EyeOff /> {labels.hide}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
