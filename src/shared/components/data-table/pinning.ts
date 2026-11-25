import type { CSSProperties } from 'react';

import type { DataTableColumn } from './features';

/** Sticky offsets for a pinned column (logical start/end, works in RTL). */
export function pinnedCellStyle<TData extends object>(
  column: DataTableColumn<TData>,
): CSSProperties {
  const pinned = column.getIsPinned();
  if (!pinned) return {};
  return {
    position: 'sticky',
    insetInlineStart: pinned === 'start' ? column.getStart('start') : undefined,
    insetInlineEnd: pinned === 'end' ? column.getAfter('end') : undefined,
  };
}

/** Edge shadow on the last start-pinned / first end-pinned column. */
export function pinnedEdgeClass<TData extends object>(column: DataTableColumn<TData>): string {
  const pinned = column.getIsPinned();
  if (!pinned) return '';
  const table = column.table;
  if (pinned === 'start') {
    const start = table.getStartVisibleLeafColumns();
    return start[start.length - 1]?.id === column.id
      ? 'shadow-[inset_-1px_0_0_var(--border),6px_0_8px_-6px_rgb(0_0_0/0.15)]'
      : '';
  }
  const end = table.getEndVisibleLeafColumns();
  return end[0]?.id === column.id
    ? 'shadow-[inset_1px_0_0_var(--border),-6px_0_8px_-6px_rgb(0_0_0/0.15)]'
    : '';
}
