import { useSortable } from '@dnd-kit/sortable';
import { FlexRender } from '@tanstack/react-table';
import type { CSSProperties } from 'react';

import { cn } from '@/shared/lib/cn';

import type { DataTableHeader } from './features';
import { pinnedCellStyle, pinnedEdgeClass } from './pinning';

/**
 * One `<th>`: renders the header template, the resize handle (drag, or
 * double-click to reset) and, when enabled, acts as a drag source for column
 * reordering. Pinned columns stick to their edge and never drag.
 */
export function DataTableHeaderCell<TData extends object>({
  header,
  reorderable,
}: {
  header: DataTableHeader<TData>;
  reorderable: boolean;
}) {
  const { column } = header;
  const pinned = column.getIsPinned();
  const canDrag = reorderable && !pinned && !header.isPlaceholder && header.subHeaders.length === 0;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: column.id,
    disabled: !canDrag,
  });
  const align = column.columnDef.meta?.align;

  const style: CSSProperties = {
    width: header.getSize(),
    ...pinnedCellStyle(column),
    ...(transform && canDrag
      ? { transform: `translate3d(${transform.x}px, 0, 0)`, zIndex: 40, position: 'relative' }
      : {}),
  };

  return (
    <th
      ref={setNodeRef}
      colSpan={header.colSpan}
      style={style}
      className={cn(
        'group/th relative h-11 border-b bg-card px-3 text-left align-middle text-xs font-medium whitespace-nowrap text-muted-foreground select-none',
        align === 'end' && 'text-right',
        align === 'center' && 'text-center',
        pinned && 'z-30',
        pinnedEdgeClass(column),
        isDragging && 'opacity-80 shadow-md',
        canDrag && 'cursor-grab active:cursor-grabbing',
      )}
      {...(canDrag ? { ...attributes, ...listeners } : {})}
    >
      {header.isPlaceholder ? null : <FlexRender header={header} />}
      {column.getCanResize() && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize column"
          onMouseDown={(e) => {
            e.stopPropagation();
            header.getResizeHandler()(e);
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            header.getResizeHandler()(e);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onDoubleClick={() => column.resetSize()}
          className={cn(
            'absolute top-0 right-0 z-10 h-full w-1.5 cursor-col-resize touch-none opacity-0 transition-opacity group-hover/th:opacity-100',
            'after:absolute after:inset-y-2 after:right-0.5 after:w-px after:bg-border',
            column.getIsResizing() && 'opacity-100 after:inset-y-0 after:w-0.5 after:bg-primary',
          )}
        />
      )}
    </th>
  );
}
