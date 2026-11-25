import { CalendarClock, Plus, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link } from '@/core/router/router';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { KanbanBoard, type KanbanColumn } from '@/shared/components/display/kanban-board';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';

import { dealsQuery, useDeals, useMoveDeal } from '../api/crm-api';
import { CompanyMark, WidgetError } from '../components/crm-parts';
import { NewDealDialog } from '../components/new-deal-dialog';
import { daysFromToday, money, shortDate } from '../lib/format';
import { PIPELINE_STAGES, STAGE_COLOR, type Deal, type DealStage } from '../model/crm';
import { crmRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(dealsQuery());
    return null;
  };

type Card = Deal & { [key: string]: unknown };

function DealCard({ deal }: { deal: Card }) {
  const { t } = useTranslation('crm');
  const age = Math.max(0, -daysFromToday(deal.createdAt));
  const due = daysFromToday(deal.closeDate);
  return (
    <article className="space-y-3 rounded-lg border bg-card p-3 shadow-xs transition-shadow hover:shadow-sm">
      <div className="flex items-start gap-2.5">
        <CompanyMark name={deal.company} className="size-8" />
        <div className="min-w-0">
          <Link
            to={crmRoutes.deal.href({ dealId: deal.id })}
            onPointerDown={(e) => e.stopPropagation()}
            className="line-clamp-2 text-sm leading-snug font-medium hover:underline"
          >
            {deal.name}
          </Link>
          <p className="truncate text-xs text-muted-foreground">{deal.company}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold tabular-nums">{money(deal.value)}</span>
        <InitialsAvatar name={deal.owner} size="xs" />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{t('pipeline.age', { count: age })}</span>
        <span
          className={cn(
            'inline-flex items-center gap-1',
            due < 0 && deal.stage !== 'won' && 'font-medium text-destructive',
          )}
        >
          <CalendarClock className="size-3.5" aria-hidden />
          {shortDate(deal.closeDate)}
        </span>
      </div>
    </article>
  );
}

const buildColumns = (deals: Deal[]): Array<KanbanColumn<Card>> =>
  PIPELINE_STAGES.map((stage) => ({
    id: stage,
    title: stage,
    color: STAGE_COLOR[stage],
    cards: deals.filter((d) => d.stage === stage) as Card[],
  }));

export default function PipelinePage() {
  const { t } = useTranslation('crm');
  const deals = useDeals();
  const move = useMoveDeal();
  const [query, setQuery] = useState('');
  const [owner, setOwner] = useState('all');

  // Board state follows the server data, but drags edit it locally first.
  const [board, setBoard] = useState<{ source?: Deal[]; columns: Array<KanbanColumn<Card>> }>({
    columns: [],
  });
  if (deals.data && board.source !== deals.data) {
    setBoard({ source: deals.data, columns: buildColumns(deals.data) });
  }

  // Persist stage changes once the card is dropped (pointer or keyboard).
  const boardRef = useRef(board);
  useEffect(() => {
    boardRef.current = board;
  }, [board]);
  const commit = useCallback(() => {
    const { source, columns } = boardRef.current;
    if (!source) return;
    for (const column of columns) {
      for (const card of column.cards) {
        const original = source.find((d) => d.id === card.id);
        if (original && original.stage !== column.id) {
          move.mutate({ id: card.id, stage: column.id as DealStage });
        }
      }
    }
  }, [move]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') commit();
    };
    window.addEventListener('pointerup', commit);
    window.addEventListener('keyup', onKey);
    return () => {
      window.removeEventListener('pointerup', commit);
      window.removeEventListener('keyup', onKey);
    };
  }, [commit]);

  const owners = useMemo(
    () => Array.from(new Set(deals.data?.map((d) => d.owner) ?? [])).sort(),
    [deals.data],
  );
  const filtering = query.trim() !== '' || owner !== 'all';
  const visible = (card: Card) =>
    (owner === 'all' || card.owner === owner) &&
    `${card.name} ${card.company}`.toLowerCase().includes(query.trim().toLowerCase());

  const columns = board.columns.map((col) => {
    const cards = filtering ? col.cards.filter(visible) : col.cards;
    const total = cards.reduce((sum, c) => sum + c.value, 0);
    const weighted = cards.reduce((sum, c) => sum + (c.value * c.probability) / 100, 0);
    return {
      ...col,
      cards,
      title: (
        <span className="flex w-full items-center justify-between gap-2">
          <span>{t(`stages.${col.id as DealStage}`)}</span>
          <span className="text-xs font-normal text-muted-foreground tabular-nums">
            {money(total, true)}
          </span>
        </span>
      ),
      weighted,
    };
  });

  return (
    <Page
      width="full"
      title={t('pipeline.title')}
      description={t('pipeline.description')}
      actions={<NewDealDialog />}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('pipeline.search')}
            className="pl-9"
            aria-label={t('pipeline.search')}
          />
        </div>
        <Select value={owner} onValueChange={setOwner}>
          <SelectTrigger className="w-48" aria-label={t('common.owner')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('pipeline.allOwners')}</SelectItem>
            {owners.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto hidden gap-6 text-sm lg:flex">
          {columns.slice(0, 4).map((col) => (
            <div key={col.id} className="text-right">
              <p className="text-xs text-muted-foreground">{t(`stages.${col.id as DealStage}`)}</p>
              <p className="font-medium tabular-nums">
                {t('pipeline.weighted', { value: money(col.weighted, true) })}
              </p>
            </div>
          ))}
        </div>
      </div>

      {deals.isError ? (
        <WidgetError onRetry={() => void deals.refetch()} />
      ) : !deals.data ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-[28rem] w-72 shrink-0" />
          ))}
        </div>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 md:-mx-8 md:px-8">
          <KanbanBoard
            columns={columns}
            onChange={(next) => {
              // While filtering, merge the moved visible cards back into the full columns.
              if (!filtering) {
                setBoard((b) => ({ ...b, columns: next.map((c) => ({ ...c, title: c.id })) }));
                return;
              }
              setBoard((b) => {
                const movedIds = new Set(next.flatMap((c) => c.cards.map((card) => card.id)));
                return {
                  ...b,
                  columns: b.columns.map((col) => {
                    const target = next.find((c) => c.id === col.id)!;
                    const hidden = col.cards.filter((card) => !movedIds.has(card.id));
                    return { ...col, cards: [...target.cards, ...hidden] };
                  }),
                };
              });
            }}
            renderCard={(card) => <DealCard deal={card} />}
            className="min-w-max pb-2"
          />
        </div>
      )}
      <NewDealDialog
        trigger={
          <Button
            size="icon-lg"
            className="fixed right-6 bottom-6 z-20 rounded-full shadow-lg md:hidden"
            aria-label={t('pipeline.addDeal')}
          >
            <Plus />
          </Button>
        }
      />
    </Page>
  );
}
