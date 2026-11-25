import {
  DollarSign,
  Goal as GoalIcon,
  MoreHorizontal,
  Pencil,
  Plus,
  Target,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Sparkline } from '@/shared/components/charts/sparkline';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { EmptyState } from '@/shared/components/display/empty-state';
import { Tag } from '@/shared/components/display/tag';
import type { Tone } from '@/shared/components/display/tone';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Progress } from '@/shared/ui/progress';
import { Skeleton } from '@/shared/ui/skeleton';

import { goalsQuery, useGoals, useRemoveGoal } from '../api/analytics-api';
import { GoalDialog } from '../components/goal-dialog';
import { QueryError } from '../components/query-error';
import { RangeControl } from '../components/range-control';
import { rangeFromRequest, useRangeParams } from '../hooks/use-range';
import { compact, integer, money, percent } from '../lib/format';
import type { Goal } from '../model/analytics';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ request }) => {
    await queryClient.prefetchQuery(goalsQuery(rangeFromRequest(request)));
    return null;
  };

type Status = 'onTrack' | 'atRisk' | 'behind';
const STATUS_TONE: Record<Status, Tone> = {
  onTrack: 'success',
  atRisk: 'warning',
  behind: 'danger',
};

const progressOf = (goal: Goal) => (goal.conversionRate / goal.target) * 100;
const statusOf = (goal: Goal): Status => {
  const p = progressOf(goal);
  return p >= 100 ? 'onTrack' : p >= 80 ? 'atRisk' : 'behind';
};

function GoalCard({ goal, onEdit }: { goal: Goal; onEdit: () => void }) {
  const { t } = useTranslation('analytics');
  const remove = useRemoveGoal();
  const status = statusOf(goal);

  return (
    <article className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-xs">
      <header className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{goal.name}</h3>
          <p className="text-xs text-muted-foreground">{t(`goals.events.${goal.event}`)}</p>
        </div>
        <Tag size="sm" dot tone={STATUS_TONE[status]}>
          {t(`goals.status.${status}`)}
        </Tag>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t('goals.actions', { name: goal.name })}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil /> {t('goals.edit')}
            </DropdownMenuItem>
            <ConfirmDialog
              trigger={
                <DropdownMenuItem variant="destructive" onSelect={(e) => e.preventDefault()}>
                  <Trash2 /> {t('goals.delete')}
                </DropdownMenuItem>
              }
              title={t('goals.deleteTitle', { name: goal.name })}
              description={t('goals.deleteDescription')}
              confirmLabel={t('goals.delete')}
              cancelLabel={t('goals.form.cancel')}
              destructive
              pending={remove.isPending}
              onConfirm={() => remove.mutateAsync(goal.id)}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-3xl font-semibold tracking-tight tabular-nums">
            {percent(goal.conversionRate, 2)}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('goals.target', { value: percent(goal.target) })}
          </p>
        </div>
        <Sparkline data={goal.trend} label={t('goals.trend', { name: goal.name })} />
      </div>
      <Progress
        value={Math.min(progressOf(goal), 100)}
        className="h-2"
        aria-label={t('goals.progress', { name: goal.name })}
      />
      <dl className="mt-auto grid grid-cols-2 gap-3 border-t pt-4 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">{t('goals.conversions')}</dt>
          <dd className="font-medium tabular-nums">{integer(goal.conversions)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t('goals.value')}</dt>
          <dd className="font-medium tabular-nums">{money(goal.conversions * goal.value)}</dd>
        </div>
      </dl>
    </article>
  );
}

/** Conversion goals with their targets, progress and the value they bring in. */
export default function GoalsPage() {
  const { t } = useTranslation('analytics');
  const { range } = useRangeParams();
  const query = useGoals(range);
  const [editing, setEditing] = useState<Goal | 'new' | null>(null);
  const data = query.data;

  const conversions = data?.reduce((sum, g) => sum + g.conversions, 0) ?? 0;
  const value = data?.reduce((sum, g) => sum + g.conversions * g.value, 0) ?? 0;
  const onTrack = data?.filter((g) => statusOf(g) === 'onTrack').length ?? 0;

  return (
    <Page
      width="full"
      title={t('goals.title')}
      description={t('goals.description')}
      actions={
        <RangeControl>
          <Button onClick={() => setEditing('new')}>
            <Plus /> {t('goals.create')}
          </Button>
        </RangeControl>
      }
    >
      {query.isError && !data ? (
        <QueryError onRetry={() => void query.refetch()} />
      ) : !data ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <EmptyState
          icon={GoalIcon}
          title={t('goals.empty.title')}
          description={t('goals.empty.description')}
          actions={
            <Button onClick={() => setEditing('new')}>
              <Plus /> {t('goals.create')}
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-3">
            <StatCard
              icon={TrendingUp}
              label={t('goals.kpis.conversions')}
              value={compact(conversions)}
            />
            <StatCard
              icon={DollarSign}
              color="var(--chart-2)"
              label={t('goals.kpis.value')}
              value={money(value)}
            />
            <StatCard
              icon={Target}
              color="var(--chart-3)"
              label={t('goals.kpis.onTrack')}
              value={t('goals.kpis.onTrackValue', { done: onTrack, total: data.length })}
            />
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {data.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onEdit={() => setEditing(goal)} />
            ))}
          </div>
        </div>
      )}
      <GoalDialog goal={editing} onClose={() => setEditing(null)} />
    </Page>
  );
}
