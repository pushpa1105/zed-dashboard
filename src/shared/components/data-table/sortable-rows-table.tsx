import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

export type SortableColumn<Row> = {
  id: string;
  header: ReactNode;
  cell: (row: Row, index: number) => ReactNode;
  width?: number | string;
  align?: 'start' | 'end' | 'center';
};

type SortableRowsTableProps<Row> = {
  rows: Row[];
  getRowId: (row: Row) => string;
  columns: SortableColumn<Row>[];
  /** Receives the reordered rows and the move (for persisting a rank). */
  onReorder: (rows: Row[], move: { from: number; to: number }) => void;
  /** Accessible label for the drag handle, e.g. (row) => `Move ${row.title}`. */
  handleLabel?: (row: Row) => string;
  caption?: string;
  className?: string;
};

function SortableRow<Row>({
  row,
  index,
  id,
  columns,
  handleLabel,
}: {
  row: Row;
  index: number;
  id: string;
  columns: SortableColumn<Row>[];
  handleLabel?: (row: Row) => string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <tr
      ref={setNodeRef}
      // Vertical only: ignore the horizontal component of the drag.
      style={{ transform: CSS.Translate.toString(transform && { ...transform, x: 0 }), transition }}
      className={cn(
        'group/row bg-card',
        isDragging && 'relative z-10 shadow-lg ring-1 ring-primary/30 [&>td]:bg-card',
      )}
    >
      <td className="w-10 border-b pl-2">
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label={handleLabel?.(row) ?? 'Drag to reorder'}
          className="flex size-7 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      </td>
      {columns.map((column) => (
        <td
          key={column.id}
          className={cn(
            'h-12 border-b px-3 align-middle',
            column.align === 'end' && 'text-right tabular-nums',
            column.align === 'center' && 'text-center',
          )}
        >
          {column.cell(row, index)}
        </td>
      ))}
    </tr>
  );
}

/**
 * Table whose rows can be reordered by dragging the handle (mouse, touch) or
 * with the keyboard (focus the handle, Space, arrows, Space). Use it for
 * ranked backlogs, menu ordering and priority lists.
 */
export function SortableRowsTable<Row>({
  rows,
  getRowId,
  columns,
  onReorder,
  handleLabel,
  caption,
  className,
}: SortableRowsTableProps<Row>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = rows.map(getRowId);

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    onReorder(arrayMove(rows, from, to), { from, to });
  };

  return (
    <div className={cn('overflow-x-auto rounded-lg border bg-card', className)}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <table className="w-full border-separate border-spacing-0 text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr>
              <th className="h-11 w-10 border-b bg-card" />
              {columns.map((column) => (
                <th
                  key={column.id}
                  style={{ width: column.width }}
                  className={cn(
                    'h-11 border-b bg-card px-3 text-left text-xs font-medium text-muted-foreground',
                    column.align === 'end' && 'text-right',
                    column.align === 'center' && 'text-center',
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              {rows.map((row, index) => (
                <SortableRow
                  key={ids[index]}
                  id={ids[index]!}
                  row={row}
                  index={index}
                  columns={columns}
                  handleLabel={handleLabel}
                />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </DndContext>
    </div>
  );
}
