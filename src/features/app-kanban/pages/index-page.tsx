import { FilterX, Rows3, Search, Tags } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { ErrorState } from '@/shared/components/display/error-state';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label as FieldLabel } from '@/shared/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';
import { Switch } from '@/shared/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

import { boardQuery, useBoard, useKanbanWorkspace, workspaceQuery } from '../api/kanban-api';
import { BoardView, type BoardFilters } from '../components/board-view';
import { LabelPill } from '../components/card-face';
import { CardSheet } from '../components/card-sheet';

const DEFAULT_BOARD = 'b-launch';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await Promise.all([
      queryClient.prefetchQuery(workspaceQuery()),
      queryClient.prefetchQuery(boardQuery(DEFAULT_BOARD)),
    ]);
    return null;
  };

const toggle = (set: Set<string>, id: string) => {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
};

export default function KanbanPage() {
  const { t } = useTranslation('app-kanban');
  const workspace = useKanbanWorkspace();
  const [boardId, setBoardId] = useState(DEFAULT_BOARD);
  const board = useBoard(boardId);
  const [openCard, setOpenCard] = useState<string | null>(null);
  const [swimlanes, setSwimlanes] = useState(false);
  const [filters, setFilters] = useState<BoardFilters>({
    assignees: new Set(),
    labels: new Set(),
    query: '',
  });

  const members = workspace.data?.members ?? [];
  const labels = workspace.data?.labels ?? [];
  const filtered = filters.assignees.size > 0 || filters.labels.size > 0 || filters.query !== '';
  const error = workspace.isError || board.isError;

  return (
    <Page
      title={board.data?.name ?? t('title')}
      description={board.data?.description ?? t('description')}
      width="full"
      actions={
        workspace.data && (
          <Select value={boardId} onValueChange={setBoardId}>
            <SelectTrigger className="w-64" aria-label={t('board')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {workspace.data.boards.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                  <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                    {b.cardCount}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.query}
            onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
            placeholder={t('filters.search')}
            className="pl-9"
            aria-label={t('filters.search')}
          />
        </div>

        <div
          className="flex items-center -space-x-1.5"
          role="group"
          aria-label={t('filters.assignees')}
        >
          {members.map((m) => {
            const on = filters.assignees.has(m.id);
            return (
              <Tooltip key={m.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-pressed={on}
                    aria-label={m.name}
                    onClick={() =>
                      setFilters((f) => ({ ...f, assignees: toggle(f.assignees, m.id) }))
                    }
                    className={cn(
                      'rounded-full ring-2 ring-background transition-transform hover:z-10 hover:-translate-y-0.5',
                      on && 'z-10 ring-primary',
                    )}
                  >
                    <InitialsAvatar name={m.name} size="sm" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{m.name}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <Tags /> {t('filters.labels')}
              {filters.labels.size > 0 && (
                <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground tabular-nums">
                  {filters.labels.size}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 space-y-1 p-2">
            {labels.map((label) => {
              const on = filters.labels.has(label.id);
              return (
                <button
                  key={label.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setFilters((f) => ({ ...f, labels: toggle(f.labels, label.id) }))}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md px-2 py-1.5 hover:bg-accent',
                    on && 'bg-accent',
                  )}
                >
                  <LabelPill label={label} />
                  {on && <span className="size-1.5 rounded-full bg-primary" />}
                </button>
              );
            })}
          </PopoverContent>
        </Popover>

        {filtered && (
          <Button
            variant="ghost"
            onClick={() => setFilters({ assignees: new Set(), labels: new Set(), query: '' })}
          >
            <FilterX /> {t('filters.clear')}
          </Button>
        )}

        <div className="ml-auto flex items-center gap-2.5">
          <Rows3 className="size-4 text-muted-foreground" />
          <FieldLabel htmlFor="swimlanes" className="font-normal">
            {t('swimlanes')}
          </FieldLabel>
          <Switch id="swimlanes" checked={swimlanes} onCheckedChange={setSwimlanes} />
        </div>
      </div>

      {error ? (
        <ErrorState
          title={t('error.title')}
          description={t('error.description')}
          retryLabel={t('error.retry')}
          onRetry={() => {
            void workspace.refetch();
            void board.refetch();
          }}
        />
      ) : !board.data || !workspace.data ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[28rem] w-[19rem] shrink-0 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <BoardView
            board={board.data}
            members={members}
            labels={labels}
            filters={filters}
            swimlanes={swimlanes}
            onOpen={(card) => setOpenCard(card.id)}
          />
          <p className="text-xs text-muted-foreground">{t('hint')}</p>
          <CardSheet
            board={board.data}
            cardId={openCard}
            members={members}
            labels={labels}
            onClose={() => setOpenCard(null)}
          />
        </>
      )}
    </Page>
  );
}
