import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { FlexRender } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronRight } from 'lucide-react';
import { Fragment, useRef, type CSSProperties, type ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import { DataTableHeaderCell } from './data-table-header-cell';
import { DataTableEmpty, DataTableError, DataTableSkeletonRows } from './data-table-states';
import { DENSITY_CELL, DENSITY_ROW_HEIGHT, type Density } from './density';
import type { DataTableCell, DataTableInstance, DataTableRow } from './features';
import { pinnedCellStyle, pinnedEdgeClass } from './pinning';

export type DataTableProps<TData extends object> = {
  table: DataTableInstance<TData>;
  density?: Density;
  /** Zebra rows. */
  striped?: boolean;
  /** Vertical lines between cells (spreadsheet look). */
  bordered?: boolean;
  /** Keep the header visible while scrolling (default true). */
  stickyHeader?: boolean;
  /** Render column `footer` templates in a sticky footer row (totals). */
  showFooter?: boolean;
  /** Extra classes per body row (conditional formatting). */
  rowClassName?: (row: DataTableRow<TData>) => string | undefined;
  /**
   * Render only the rows in view. Needs a bounded scroll area (`maxHeight`).
   * Detail panels (`renderDetail`) are not rendered in this mode.
   */
  virtualized?: boolean;
  /** Max height of the scroll area; the header stays sticky inside it. */
  maxHeight?: number | string;
  /** Drag headers to reorder unpinned columns. */
  reorderableColumns?: boolean;
  /** Show skeleton rows (first load). For refetches prefer `refreshing`. */
  loading?: boolean;
  /** Dim the body while new data loads (keeps the previous page visible). */
  refreshing?: boolean;
  error?: ReactNode;
  onRetry?: () => void;
  /** Replaces the default "No results" row. */
  empty?: ReactNode;
  /** Texts for the built-in empty and error rows. */
  labels?: { emptyTitle?: string; emptyDescription?: string; retry?: string };
  onRowClick?: (row: DataTableRow<TData>) => void;
  /** Panel rendered under an expanded row that has no sub-rows. */
  renderDetail?: (row: DataTableRow<TData>) => ReactNode;
  className?: string;
  /** Accessible table name. */
  caption?: string;
  /**
   * Called when the scroll area nears its end (infinite loading). Needs a
   * bounded scroll area (`maxHeight`). Guard against duplicate calls upstream.
   */
  onScrollEnd?: () => void;
  /** Distance from the bottom, in px, that counts as "the end" (default 240). */
  scrollEndThreshold?: number;
};

function BodyCell<TData extends object>({
  cell,
  density,
  bordered,
}: {
  cell: DataTableCell<TData>;
  density: Density;
  bordered?: boolean;
}) {
  const { column, row } = cell;
  const meta = column.columnDef.meta;
  const style: CSSProperties = { width: column.getSize(), ...pinnedCellStyle(column) };

  return (
    <td
      style={style}
      className={cn(
        'truncate border-b bg-card px-3 align-middle transition-colors',
        'group-hover/row:bg-[color-mix(in_oklch,var(--muted)_70%,var(--card))]',
        'group-data-[selected=true]/row:bg-[color-mix(in_oklch,var(--primary)_7%,var(--card))]',
        'group-data-[striped=true]/row:bg-[color-mix(in_oklch,var(--muted)_45%,var(--card))]',
        DENSITY_CELL[density],
        bordered && 'border-r last:border-r-0',
        meta?.align === 'end' && 'text-right tabular-nums',
        meta?.align === 'center' && 'text-center',
        column.getIsPinned() && 'z-10',
        pinnedEdgeClass(column),
        meta?.cellClassName,
      )}
    >
      {cell.getIsGrouped() ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            row.toggleExpanded();
          }}
          className="inline-flex items-center gap-1.5 font-medium"
          style={{ paddingInlineStart: row.depth * 16 }}
        >
          <ChevronRight
            className={cn('size-4 transition-transform', row.getIsExpanded() && 'rotate-90')}
          />
          <FlexRender cell={cell} />
          <span className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground tabular-nums">
            {row.subRows.length}
          </span>
        </button>
      ) : (
        <FlexRender cell={cell} />
      )}
    </td>
  );
}

/**
 * Renders a table instance from `useDataTable`: sticky header, pinned
 * columns with edge shadows, live column resizing, drag-to-reorder headers,
 * grouped/aggregated rows, detail panels, optional row virtualization and
 * loading/empty/error states. All behavior lives in the instance; this
 * component is presentation only.
 */
export function DataTable<TData extends object>({
  table,
  density = 'default',
  striped,
  bordered,
  stickyHeader = true,
  showFooter,
  rowClassName,
  virtualized,
  maxHeight,
  reorderableColumns,
  loading,
  refreshing,
  error,
  onRetry,
  empty,
  labels,
  onRowClick,
  renderDetail,
  className,
  caption,
  onScrollEnd,
  scrollEndThreshold = 240,
}: DataTableProps<TData>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rows = table.getRowModel().rows;
  const columnCount = Math.max(1, table.getVisibleLeafColumns().length);

  const virtualizer = useVirtualizer({
    count: virtualized ? rows.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => DENSITY_ROW_HEIGHT[density],
    overscan: 12,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );
  const centerIds = table.getCenterVisibleLeafColumns().map((c) => c.id);

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const order = table.getAllLeafColumns().map((c) => c.id);
    const from = order.indexOf(String(active.id));
    const to = order.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    const next = [...order];
    next.splice(to, 0, ...next.splice(from, 1));
    table.setColumnOrder(next);
  };

  const renderRow = (row: DataTableRow<TData>, index: number) => (
    <Fragment key={row.id}>
      <tr
        data-index={index}
        data-selected={row.getIsSelected()}
        data-striped={striped && index % 2 === 1}
        onClick={onRowClick ? () => onRowClick(row) : undefined}
        className={cn('group/row', onRowClick && 'cursor-pointer', rowClassName?.(row))}
      >
        {row.getVisibleCells().map((cell) => (
          <BodyCell key={cell.id} cell={cell} density={density} bordered={bordered} />
        ))}
      </tr>
      {!virtualized && renderDetail && row.getIsExpanded() && row.subRows.length === 0 && (
        <tr>
          <td colSpan={columnCount} className="border-b bg-muted/40 p-0">
            {renderDetail(row)}
          </td>
        </tr>
      )}
    </Fragment>
  );

  let body: ReactNode;
  if (loading) body = <DataTableSkeletonRows columns={columnCount} />;
  else if (error)
    body = (
      <DataTableError
        columns={columnCount}
        title={error}
        onRetry={onRetry}
        retryLabel={labels?.retry}
      />
    );
  else if (rows.length === 0)
    body = empty ?? (
      <DataTableEmpty
        columns={columnCount}
        title={labels?.emptyTitle}
        description={labels?.emptyDescription}
      />
    );
  else if (virtualized) {
    const items = virtualizer.getVirtualItems();
    const top = items[0]?.start ?? 0;
    const bottom = virtualizer.getTotalSize() - (items[items.length - 1]?.end ?? 0);
    body = (
      <>
        {top > 0 && (
          <tr aria-hidden>
            <td colSpan={columnCount} style={{ height: top }} />
          </tr>
        )}
        {items.map((item) => renderRow(rows[item.index]!, item.index))}
        {bottom > 0 && (
          <tr aria-hidden>
            <td colSpan={columnCount} style={{ height: bottom }} />
          </tr>
        )}
      </>
    );
  } else body = rows.map(renderRow);

  return (
    <div
      ref={scrollRef}
      className={cn('relative overflow-auto rounded-lg border bg-card', className)}
      style={{ maxHeight }}
      onScroll={
        onScrollEnd
          ? (e) => {
              const el = e.currentTarget;
              if (el.scrollHeight - el.scrollTop - el.clientHeight < scrollEndThreshold)
                onScrollEnd();
            }
          : undefined
      }
    >
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <table
          className="border-separate border-spacing-0 text-sm"
          style={{ width: table.getTotalSize(), minWidth: '100%', tableLayout: 'fixed' }}
        >
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead
            className={cn(
              stickyHeader && 'sticky top-0 z-20',
              bordered && '[&_th]:border-r [&_th:last-child]:border-r-0',
            )}
          >
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                <SortableContext items={centerIds} strategy={horizontalListSortingStrategy}>
                  {group.headers.map((header) => (
                    <DataTableHeaderCell
                      key={header.id}
                      header={header}
                      reorderable={!!reorderableColumns}
                    />
                  ))}
                </SortableContext>
              </tr>
            ))}
          </thead>
          <tbody
            className={cn('transition-opacity', refreshing && 'pointer-events-none opacity-60')}
            aria-busy={loading || refreshing || undefined}
          >
            {body}
          </tbody>
          {showFooter && !loading && !error && rows.length > 0 && (
            <tfoot className="sticky bottom-0 z-20">
              {table
                .getFooterGroups()
                // Skip footer rows with nothing to show (e.g. the level of grouped headers).
                .filter((group) =>
                  group.headers.some((h) => !h.isPlaceholder && h.column.columnDef.footer),
                )
                .map((group) => (
                  <tr key={group.id}>
                    {group.headers.map((header) => (
                      <td
                        key={header.id}
                        colSpan={header.colSpan}
                        style={{ width: header.getSize(), ...pinnedCellStyle(header.column) }}
                        className={cn(
                          'h-11 border-t bg-muted px-3 text-sm font-semibold',
                          header.column.columnDef.meta?.align === 'end' &&
                            'text-right tabular-nums',
                          header.column.getIsPinned() && 'z-10',
                          bordered && 'border-r last:border-r-0',
                        )}
                      >
                        {header.isPlaceholder ? null : <FlexRender footer={header} />}
                      </td>
                    ))}
                  </tr>
                ))}
            </tfoot>
          )}
        </table>
      </DndContext>
    </div>
  );
}
