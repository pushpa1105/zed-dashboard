import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState, type ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

export type KanbanCard = { id: string; [key: string]: unknown };
export type KanbanColumn<T extends KanbanCard> = {
  id: string;
  title: ReactNode;
  /** Dot color for the column header. */
  color?: string;
  cards: T[];
};

export type KanbanBoardProps<T extends KanbanCard> = {
  columns: KanbanColumn<T>[];
  /** Called with the new columns after every move (controlled component). */
  onChange: (columns: KanbanColumn<T>[]) => void;
  renderCard: (card: T) => ReactNode;
  className?: string;
};

function SortableCard({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('touch-none', isDragging && 'opacity-40')}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

function Column({ id, children }: { id: string; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-24 flex-1 flex-col gap-2 rounded-lg p-1 transition-colors',
        isOver && 'bg-primary/5',
      )}
    >
      {children}
    </div>
  );
}

/**
 * Drag-and-drop board (dnd-kit). Reorder cards within a column or move them
 * between columns, by mouse, touch or keyboard (Space to lift, arrows, Space to drop).
 */
export function KanbanBoard<T extends KanbanCard>({
  columns,
  onChange,
  renderCard,
  className,
}: KanbanBoardProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const columnOf = (id: string) =>
    columns.find((c) => c.id === id || c.cards.some((card) => card.id === id));
  const activeCard = activeId
    ? columns.flatMap((c) => c.cards).find((card) => card.id === activeId)
    : undefined;

  const onDragStart = ({ active }: DragStartEvent) => setActiveId(String(active.id));

  // Moving across columns happens while dragging, so the target column makes room live.
  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const from = columnOf(String(active.id));
    const to = columnOf(String(over.id));
    if (!from || !to || from.id === to.id) return;
    const card = from.cards.find((c) => c.id === active.id)!;
    const overIndex = to.cards.findIndex((c) => c.id === over.id);
    const insertAt = overIndex === -1 ? to.cards.length : overIndex;
    onChange(
      columns.map((col) => {
        if (col.id === from.id) return { ...col, cards: col.cards.filter((c) => c.id !== card.id) };
        if (col.id === to.id) {
          const cards = [...col.cards];
          cards.splice(insertAt, 0, card);
          return { ...col, cards };
        }
        return col;
      }),
    );
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over) return;
    const col = columnOf(String(active.id));
    if (!col || col.id !== columnOf(String(over.id))?.id) return;
    const from = col.cards.findIndex((c) => c.id === active.id);
    const to = col.cards.findIndex((c) => c.id === over.id);
    if (from === -1 || to === -1 || from === to) return;
    onChange(
      columns.map((c) => (c.id === col.id ? { ...c, cards: arrayMove(c.cards, from, to) } : c)),
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className={cn('flex gap-4 overflow-x-auto pb-2', className)}>
        {columns.map((col) => (
          <div key={col.id} className="flex w-72 shrink-0 flex-col rounded-xl bg-muted/50 p-2">
            <div className="flex items-center gap-2 px-2 py-1.5">
              <span
                className="size-2 rounded-full"
                style={{ background: col.color ?? 'var(--muted-foreground)' }}
              />
              <p className="text-sm font-medium">{col.title}</p>
              <span className="ml-auto rounded-full bg-card px-1.5 text-xs text-muted-foreground tabular-nums">
                {col.cards.length}
              </span>
            </div>
            <SortableContext
              id={col.id}
              items={col.cards.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <Column id={col.id}>
                {col.cards.map((card) => (
                  <SortableCard key={card.id} id={card.id}>
                    {renderCard(card)}
                  </SortableCard>
                ))}
              </Column>
            </SortableContext>
          </div>
        ))}
      </div>
      <DragOverlay>
        {activeCard ? <div className="rotate-2 shadow-lg">{renderCard(activeCard)}</div> : null}
      </DragOverlay>
    </DndContext>
  );
}
