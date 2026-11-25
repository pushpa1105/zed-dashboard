import { Check, ListChecks, MessageSquare, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { cn } from '@/shared/lib/cn';
import { formatRelative } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Progress } from '@/shared/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet';
import { Textarea } from '@/shared/ui/textarea';

import { useKanbanMutations } from '../api/kanban-api';
import { PRIORITIES, type Board, type Card, type Label, type Member } from '../model/kanban';

import { LabelPill, PriorityIcon } from './card-face';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] items-center gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Details({
  board,
  card,
  members,
  labels,
}: {
  board: Board;
  card: Card;
  members: Member[];
  labels: Label[];
}) {
  const { t } = useTranslation('app-kanban');
  const { updateCard, move, comment } = useKanbanMutations(board.id);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [newItem, setNewItem] = useState('');
  const [draft, setDraft] = useState('');

  const patch = (p: Parameters<typeof updateCard.mutate>[0]['patch']) =>
    updateCard.mutate({ cardId: card.id, patch: p });
  const toggle = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  const done = card.checklist.filter((i) => i.done).length;

  return (
    <div className="flex-1 space-y-8 overflow-y-auto px-6 pb-8">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => title.trim() && title !== card.title && patch({ title: title.trim() })}
        className="h-auto border-transparent px-2 py-1.5 text-lg font-semibold shadow-none hover:border-input"
        aria-label={t('sheet.title')}
      />

      <div className="space-y-3.5">
        <Row label={t('sheet.status')}>
          <Select
            value={card.columnId}
            onValueChange={(columnId) => move.mutate({ cardId: card.id, columnId, beforeId: null })}
          >
            <SelectTrigger className="w-full max-w-60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {board.columns.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>
        <Row label={t('sheet.priority')}>
          <Select
            value={card.priority}
            onValueChange={(v) => patch({ priority: v as Card['priority'] })}
          >
            <SelectTrigger className="w-full max-w-60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  <PriorityIcon priority={p} /> {t(`priority.${p}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>
        <Row label={t('sheet.assignees')}>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex min-h-9 w-full max-w-sm flex-wrap items-center gap-1.5 rounded-lg border border-dashed px-2 py-1 text-left hover:bg-muted/50"
              >
                {card.assigneeIds.length === 0 && (
                  <span className="px-1 text-muted-foreground">{t('sheet.noAssignees')}</span>
                )}
                {card.assigneeIds.map((id) => {
                  const m = members.find((x) => x.id === id);
                  return m ? (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-muted py-0.5 pr-2 pl-0.5 text-xs"
                    >
                      <InitialsAvatar name={m.name} size="xs" /> {m.name}
                    </span>
                  ) : null;
                })}
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-1">
              {members.map((m) => {
                const on = card.assigneeIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => patch({ assigneeIds: toggle(card.assigneeIds, m.id) })}
                    className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                  >
                    <InitialsAvatar name={m.name} size="xs" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{m.name}</span>
                      <span className="block text-xs text-muted-foreground">{m.role}</span>
                    </span>
                    {on && <Check className="size-4 text-primary" />}
                  </button>
                );
              })}
            </PopoverContent>
          </Popover>
        </Row>
        <Row label={t('sheet.labels')}>
          <div className="flex flex-wrap gap-1.5">
            {labels.map((label) => {
              const on = card.labelIds.includes(label.id);
              return (
                <button
                  key={label.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => patch({ labelIds: toggle(card.labelIds, label.id) })}
                  className={cn(
                    'rounded-full transition-opacity',
                    !on && 'opacity-35 hover:opacity-70',
                  )}
                >
                  <LabelPill label={label} />
                </button>
              );
            })}
          </div>
        </Row>
        <Row label={t('sheet.due')}>
          <div className="flex max-w-60 gap-1.5">
            <Input
              type="date"
              value={card.due ?? ''}
              onChange={(e) => patch({ due: e.target.value || null })}
            />
            {card.due && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => patch({ due: null })}
                aria-label={t('sheet.clearDue')}
              >
                <X />
              </Button>
            )}
          </div>
        </Row>
      </div>

      <section className="space-y-2">
        <h4 className="text-sm font-semibold">{t('sheet.description')}</h4>
        <Textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => description !== card.description && patch({ description })}
          placeholder={t('sheet.descriptionPlaceholder')}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <ListChecks className="size-4" /> {t('sheet.checklist')}
          </h4>
          {card.checklist.length > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {done}/{card.checklist.length}
            </span>
          )}
        </div>
        {card.checklist.length > 0 && (
          <Progress value={(done / card.checklist.length) * 100} className="h-1.5" />
        )}
        <ul className="space-y-1">
          {card.checklist.map((item) => (
            <li
              key={item.id}
              className="group flex items-center gap-3 rounded-md px-1 py-1 hover:bg-muted/50"
            >
              <Checkbox
                checked={item.done}
                onCheckedChange={(v) =>
                  patch({
                    checklist: card.checklist.map((i) =>
                      i.id === item.id ? { ...i, done: v === true } : i,
                    ),
                  })
                }
                aria-label={item.text}
              />
              <span
                className={cn('flex-1 text-sm', item.done && 'text-muted-foreground line-through')}
              >
                {item.text}
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                onClick={() => patch({ checklist: card.checklist.filter((i) => i.id !== item.id) })}
                aria-label={t('sheet.removeItem', { item: item.text })}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newItem.trim()) return;
            patch({
              checklist: [
                ...card.checklist,
                { id: `ci-${Date.now()}`, text: newItem.trim(), done: false },
              ],
            });
            setNewItem('');
          }}
        >
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder={t('sheet.addItem')}
          />
          <Button
            type="submit"
            variant="outline"
            size="icon"
            disabled={!newItem.trim()}
            aria-label={t('sheet.addItem')}
          >
            <Plus />
          </Button>
        </form>
      </section>

      <section className="space-y-4">
        <h4 className="flex items-center gap-2 text-sm font-semibold">
          <MessageSquare className="size-4" />{' '}
          {t('sheet.comments', { count: card.comments.length })}
        </h4>
        <ul className="space-y-4">
          {card.comments.map((c) => {
            const author = members.find((m) => m.id === c.authorId);
            return (
              <li key={c.id} className="flex gap-3">
                <InitialsAvatar name={author?.name ?? '?'} size="sm" />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">{author?.name}</span>{' '}
                    <span className="text-xs text-muted-foreground">{formatRelative(c.at)}</span>
                  </p>
                  <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm">{c.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="space-y-2">
          <Textarea
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('sheet.commentPlaceholder')}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              disabled={!draft.trim() || comment.isPending}
              onClick={() =>
                comment.mutate({ cardId: card.id, text: draft }, { onSuccess: () => setDraft('') })
              }
            >
              {t('sheet.comment')}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

/** Right-hand sheet with every field of a card. Reads live data from the board. */
export function CardSheet({
  board,
  cardId,
  members,
  labels,
  onClose,
}: {
  board: Board;
  cardId: string | null;
  members: Member[];
  labels: Label[];
  onClose: () => void;
}) {
  const { t } = useTranslation('app-kanban');
  const card = board.cards.find((c) => c.id === cardId);
  const column = board.columns.find((c) => c.id === card?.columnId);
  return (
    <Sheet open={!!card} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        className="w-full gap-0 sm:max-w-xl"
        // Don't select the title on open; keyboard users can tab into the fields.
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader className="px-6 pt-6">
          <SheetDescription className="font-mono text-xs">
            {card?.key} · {column?.title}
          </SheetDescription>
          <SheetTitle className="sr-only">{card?.title ?? t('sheet.title')}</SheetTitle>
        </SheetHeader>
        {card && (
          <Details key={card.id} board={board} card={card} members={members} labels={labels} />
        )}
      </SheetContent>
    </Sheet>
  );
}
