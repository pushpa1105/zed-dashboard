import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

import { useKanbanMutations } from '../api/kanban-api';
import type { Board, Card, Label, Member } from '../model/kanban';

import { AddCard, CardList, ColumnHeader } from './board-column';
import { CardFace } from './card-face';

export type BoardFilters = { assignees: Set<string>; labels: Set<string>; query: string };

const NONE = 'none';
const SEP = '::';
const laneOf = (card: Card) => card.assigneeIds[0] ?? NONE;

function matches(card: Card, filters: BoardFilters) {
  if (filters.assignees.size && !card.assigneeIds.some((id) => filters.assignees.has(id)))
    return false;
  if (filters.labels.size && !card.labelIds.some((id) => filters.labels.has(id))) return false;
  const q = filters.query.trim().toLowerCase();
  if (q && !`${card.key} ${card.title}`.toLowerCase().includes(q)) return false;
  return true;
}

/** Container id = column id, or `lane::column` in swimlane mode. */
function buildContainers(board: Board, filters: BoardFilters, lanes: string[] | null) {
  const out: Record<string, string[]> = {};
  const keys = lanes
    ? lanes.flatMap((lane) => board.columns.map((c) => `${lane}${SEP}${c.id}`))
    : board.columns.map((c) => c.id);
  for (const key of keys) out[key] = [];
  for (const card of board.cards) {
    if (!matches(card, filters)) continue;
    const key = lanes ? `${laneOf(card)}${SEP}${card.columnId}` : card.columnId;
    out[key]?.push(card.id);
  }
  return out;
}

const parse = (container: string) => {
  const [lane, column] = container.includes(SEP) ? container.split(SEP) : [null, container];
  return { lane, column: column! };
};

function AddColumn({ onAdd }: { onAdd: (title: string) => void }) {
  const { t } = useTranslation('app-kanban');
  const [title, setTitle] = useState('');
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <Button
        variant="outline"
        className="w-[19rem] shrink-0 border-dashed"
        onClick={() => setOpen(true)}
      >
        <Plus /> {t('addColumn')}
      </Button>
    );
  }
  return (
    <form
      className="flex w-[19rem] shrink-0 gap-2 self-start rounded-xl bg-muted/50 p-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (title.trim()) onAdd(title.trim());
        setTitle('');
        setOpen(false);
      }}
    >
      <Input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t('columnPlaceholder')}
      />
      <Button type="submit" disabled={!title.trim()}>
        {t('add')}
      </Button>
    </form>
  );
}

/**
 * Board with drag and drop between columns (and swimlanes). While dragging,
 * the order lives in local state; on drop the move is sent to the API and
 * applied optimistically, so the card never jumps back.
 */
export function BoardView({
  board,
  members,
  labels,
  filters,
  swimlanes,
  onOpen,
}: {
  board: Board;
  members: Member[];
  labels: Label[];
  filters: BoardFilters;
  swimlanes: boolean;
  onOpen: (card: Card) => void;
}) {
  const { t } = useTranslation('app-kanban');
  const { move, addCard, addColumn, updateColumn } = useKanbanMutations(board.id);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      // Space picks up and drops; Enter is kept for opening the card.
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space'] },
    }),
  );

  const lanes = swimlanes
    ? [...members.map((m) => m.id).filter((id) => board.cards.some((c) => laneOf(c) === id)), NONE]
    : null;
  const base = buildContainers(board, filters, lanes);
  const [live, setLive] = useState<Record<string, string[]> | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const containers = live ?? base;
  const byId = new Map(board.cards.map((c) => [c.id, c]));

  const findContainer = (id: string) =>
    id in containers ? id : Object.keys(containers).find((key) => containers[key]!.includes(id));

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id));
    setLive(base);
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const from = findContainer(String(active.id));
    const to = findContainer(String(over.id));
    if (!from || !to || from === to) return;
    setLive((prev) => {
      const state = prev ?? base;
      const source = state[from]!.filter((id) => id !== active.id);
      const target = [...state[to]!];
      const overIndex = target.indexOf(String(over.id));
      target.splice(overIndex >= 0 ? overIndex : target.length, 0, String(active.id));
      return { ...state, [from]: source, [to]: target };
    });
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const id = String(active.id);
    const card = byId.get(id);
    const container = over ? findContainer(String(over.id)) : undefined;
    if (!card || !container) {
      setLive(null);
      setActiveId(null);
      return;
    }
    let list = containers[container]!;
    const from = list.indexOf(id);
    const to = list.indexOf(String(over!.id));
    if (from >= 0 && to >= 0 && from !== to) list = arrayMove(list, from, to);

    const { lane, column } = parse(container);
    const beforeId = list[list.indexOf(id) + 1] ?? null;
    const laneChanged = lane !== null && lane !== laneOf(card);
    const unchanged =
      column === card.columnId && !laneChanged && beforeId === nextInColumn(board, card);
    if (!unchanged) {
      move.mutate({
        cardId: id,
        columnId: column,
        beforeId,
        assigneeIds: laneChanged ? (lane === NONE ? [] : [lane!]) : undefined,
      });
    }
    setLive(null);
    setActiveId(null);
  };

  const active = activeId ? byId.get(activeId) : undefined;
  const cardsFor = (container: string) =>
    containers[container]!.map((cid) => byId.get(cid)).filter(Boolean) as Card[];
  const columnCount = (columnId: string) =>
    board.cards.filter((c) => c.columnId === columnId).length;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setLive(null);
        setActiveId(null);
      }}
    >
      {lanes ? (
        <div className="overflow-x-auto pb-4">
          <div
            className="grid w-max gap-x-4"
            style={{ gridTemplateColumns: `repeat(${board.columns.length}, 19rem)` }}
          >
            {board.columns.map((column) => (
              <div
                key={column.id}
                className="sticky top-0 z-10 rounded-t-xl bg-muted/60 px-2 pt-3 pb-2"
              >
                <ColumnHeader
                  column={column}
                  count={columnCount(column.id)}
                  onWipLimit={(wipLimit) => updateColumn.mutate({ columnId: column.id, wipLimit })}
                />
              </div>
            ))}
            {lanes.map((lane) => {
              const member = members.find((m) => m.id === lane);
              const count = board.cards.filter((c) => laneOf(c) === lane).length;
              return (
                <div key={lane} className="contents">
                  <div
                    className="col-span-full mt-4 flex items-center gap-2 border-b pb-2"
                    style={{ gridColumn: `1 / span ${board.columns.length}` }}
                  >
                    {member ? (
                      <InitialsAvatar name={member.name} size="xs" />
                    ) : (
                      <span className="size-6 rounded-full border border-dashed" />
                    )}
                    <span className="text-sm font-medium">{member?.name ?? t('unassigned')}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
                  </div>
                  {board.columns.map((column) => {
                    const key = `${lane}${SEP}${column.id}`;
                    return (
                      <div key={key} className="bg-muted/40 px-2 py-2">
                        <CardList
                          id={key}
                          cards={cardsFor(key)}
                          members={members}
                          labels={labels}
                          onOpen={onOpen}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-4 overflow-x-auto pb-4">
          {board.columns.map((column) => (
            <section
              key={column.id}
              className="flex max-h-[calc(100svh-17rem)] w-[19rem] shrink-0 flex-col gap-2 rounded-xl bg-muted/60 p-2"
              aria-label={column.title}
            >
              <div className="pt-1">
                <ColumnHeader
                  column={column}
                  count={columnCount(column.id)}
                  onWipLimit={(wipLimit) => updateColumn.mutate({ columnId: column.id, wipLimit })}
                />
              </div>
              <div className="-mx-1 overflow-y-auto px-1">
                <CardList
                  id={column.id}
                  cards={cardsFor(column.id)}
                  members={members}
                  labels={labels}
                  onOpen={onOpen}
                />
              </div>
              <AddCard
                onAdd={(title) => addCard.mutate({ boardId: board.id, columnId: column.id, title })}
              />
            </section>
          ))}
          <AddColumn
            onAdd={(title) => addColumn.mutate({ boardId: board.id, title, wipLimit: null })}
          />
        </div>
      )}

      <DragOverlay dropAnimation={{ duration: 180, easing: 'ease-out' }}>
        {active && <CardFace card={active} members={members} labels={labels} overlay />}
      </DragOverlay>
    </DndContext>
  );
}

/** Id of the card currently right after `card` in its column (null if last). */
function nextInColumn(board: Board, card: Card) {
  const column = board.cards.filter((c) => c.columnId === card.columnId);
  return column[column.indexOf(card) + 1]?.id ?? null;
}
