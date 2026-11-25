import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AlertTriangle, Gauge, MoreHorizontal, Plus } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Textarea } from '@/shared/ui/textarea';

import type { Card, Column, Label, Member } from '../model/kanban';

import { SortableCard } from './sortable-card';

/** One droppable list of cards. Columns can be split into swimlanes. */
export function CardList({
  id,
  cards,
  members,
  labels,
  onOpen,
  className,
}: {
  id: string;
  cards: Card[];
  members: Member[];
  labels: Label[];
  onOpen: (card: Card) => void;
  className?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <SortableContext id={id} items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
      <ul
        ref={setNodeRef}
        className={cn(
          'flex min-h-16 flex-col gap-2 rounded-lg p-1 transition-colors',
          isOver && 'bg-primary/5 ring-1 ring-primary/20 ring-inset',
          className,
        )}
      >
        {cards.map((card) => (
          <SortableCard
            key={card.id}
            card={card}
            members={members}
            labels={labels}
            onOpen={onOpen}
          />
        ))}
      </ul>
    </SortableContext>
  );
}

export function ColumnHeader({
  column,
  count,
  onWipLimit,
}: {
  column: Column;
  count: number;
  onWipLimit: (limit: number | null) => void;
}) {
  const { t } = useTranslation('app-kanban');
  const over = column.wipLimit !== null && count > column.wipLimit;
  const full = column.wipLimit !== null && count === column.wipLimit;
  return (
    <div className="flex items-center gap-2 px-1">
      <h3 className="truncate text-sm font-semibold">{column.title}</h3>
      <span
        className={cn(
          'inline-flex h-5 items-center gap-1 rounded-full px-1.5 text-[0.6875rem] font-medium tabular-nums',
          over
            ? 'bg-destructive/12 text-destructive'
            : full
              ? 'bg-warning/20'
              : 'bg-muted text-muted-foreground',
        )}
        title={column.wipLimit !== null ? t('wip.hint', { limit: column.wipLimit }) : undefined}
      >
        {over && <AlertTriangle className="size-3" />}
        {count}
        {column.wipLimit !== null && ` / ${column.wipLimit}`}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            className="ml-auto"
            aria-label={t('column.menu', { name: column.title })}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Gauge className="size-4" /> {t('wip.title')}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={String(column.wipLimit ?? 'none')}
            onValueChange={(v) => onWipLimit(v === 'none' ? null : Number(v))}
          >
            <DropdownMenuRadioItem value="none">{t('wip.none')}</DropdownMenuRadioItem>
            {[2, 3, 4, 5, 8].map((n) => (
              <DropdownMenuRadioItem key={n} value={String(n)}>
                {t('wip.limit', { count: n })}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/** "Add a card" control at the bottom of a column. */
export function AddCard({ onAdd }: { onAdd: (title: string) => void }) {
  const { t } = useTranslation('app-kanban');
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const submit = () => {
    if (title.trim()) onAdd(title.trim());
    setTitle('');
  };

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Plus /> {t('addCard')}
      </Button>
    );
  }
  return (
    <div className="space-y-2 p-1">
      <Textarea
        autoFocus
        rows={2}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
          if (e.key === 'Escape') setOpen(false);
        }}
        placeholder={t('cardPlaceholder')}
        className="min-h-0 resize-none bg-card"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={!title.trim()}>
          {t('add')}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          {t('cancel')}
        </Button>
      </div>
    </div>
  );
}
