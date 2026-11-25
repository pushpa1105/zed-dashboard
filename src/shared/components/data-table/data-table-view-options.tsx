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
import { GripVertical, RotateCcw, Settings2 } from 'lucide-react';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';

import { getColumnLabel, type DataTableColumn, type DataTableInstance } from './features';

function ColumnRow<TData extends object>({ column }: { column: DataTableColumn<TData> }) {
  const pinned = !!column.getIsPinned();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    disabled: pinned,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'flex items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-muted',
        isDragging && 'relative z-10 bg-card shadow-md',
      )}
    >
      <button
        type="button"
        aria-label={`Move ${getColumnLabel(column)}`}
        disabled={pinned}
        className="cursor-grab text-muted-foreground disabled:cursor-not-allowed disabled:opacity-30"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3.5" />
      </button>
      <label className="flex flex-1 cursor-pointer items-center gap-2">
        <Checkbox
          checked={column.getIsVisible()}
          disabled={!column.getCanHide()}
          onCheckedChange={(value) => column.toggleVisibility(!!value)}
        />
        <span className="truncate">{getColumnLabel(column)}</span>
      </label>
    </li>
  );
}

/**
 * "Columns" popover: toggle visibility and drag to reorder. Display-only
 * columns (selection, actions) without `enableHiding` are left out.
 */
export function DataTableViewOptions<TData extends object>({
  table,
  label = 'Columns',
  resetLabel = 'Reset',
}: {
  table: DataTableInstance<TData>;
  label?: string;
  resetLabel?: string;
}) {
  const columns = table.getAllLeafColumns().filter((c) => c.getCanHide());
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const order = table.getAllLeafColumns().map((c) => c.id);
    table.setColumnOrder(
      arrayMove(order, order.indexOf(String(active.id)), order.indexOf(String(over.id))),
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 /> {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 p-1.5">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={columns.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <ul className="max-h-72 overflow-y-auto">
              {columns.map((column) => (
                <ColumnRow key={column.id} column={column} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
        <div className="mt-1 border-t pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              table.resetColumnOrder();
              table.resetColumnVisibility();
              table.resetColumnSizing();
            }}
          >
            <RotateCcw /> {resetLabel}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
