import { BellRing, CalendarClock } from 'lucide-react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { notify } from '@/core/notify/notify';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { ProgressRing } from '@/shared/components/charts/progress-ring';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { Tag } from '@/shared/components/display/tag';
import { UserCell } from '@/shared/components/display/user-cell';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { performanceQuery, usePerformance } from '../api/hr-api';
import { WidgetError } from '../components/widget-error';
import { longDate } from '../lib/format';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(performanceQuery());
    return null;
  };

const CYCLE_TONE = { inProgress: 'info', scheduled: 'neutral', closed: 'success' } as const;
const GOAL_TONE = { onTrack: 'success', atRisk: 'warning', offTrack: 'danger' } as const;
const GOAL_BAR = {
  onTrack: 'var(--success)',
  atRisk: 'var(--warning)',
  offTrack: 'var(--destructive)',
} as const;

export default function PerformancePage() {
  const { t } = useTranslation('hr');
  const performance = usePerformance();
  const data = performance.data;

  if (performance.isError) {
    return (
      <Page width="full" title={t('performance.title')}>
        <WidgetError onRetry={() => void performance.refetch()} />
      </Page>
    );
  }

  return (
    <Page width="full" title={t('performance.title')} description={t('performance.description')}>
      <section>
        <h2 className="mb-4 text-base font-semibold">{t('performance.cycles')}</h2>
        <div className="grid gap-4 md:grid-cols-3 md:gap-6">
          {!data
            ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)
            : data.cycles.map((cycle) => {
                const pct = Math.round((cycle.completed / cycle.total) * 100);
                return (
                  <article
                    key={cycle.id}
                    className="flex items-center gap-5 rounded-xl border bg-card p-6 shadow-xs"
                  >
                    <ProgressRing value={pct} size={72} strokeWidth={7} />
                    <div className="min-w-0 space-y-1.5">
                      <StatusBadge
                        status={cycle.status}
                        label={t(`performance.cycleStatus.${cycle.status}`)}
                        tone={CYCLE_TONE[cycle.status]}
                      />
                      <p className="text-sm leading-snug font-semibold">{cycle.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('performance.completion', { done: cycle.completed, total: cycle.total })}
                      </p>
                      <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarClock className="size-3.5" aria-hidden />
                        {t('performance.due', { date: longDate(cycle.due) })}
                      </p>
                    </div>
                  </article>
                );
              })}
        </div>
      </section>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-12">
        <SectionCard title={t('performance.goals')} className="lg:col-span-7">
          {data ? (
            <ul className="divide-y">
              {data.goals.map((goal) => (
                <li
                  key={goal.id}
                  className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_12rem]"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium">{goal.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {goal.owner} · {t('performance.due', { date: longDate(goal.due) })}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Tag size="sm" tone={GOAL_TONE[goal.status]} dot>
                        {t(`performance.goalStatus.${goal.status}`)}
                      </Tag>
                      <span className="text-sm font-medium tabular-nums">{goal.progress}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${goal.progress}%`, background: GOAL_BAR[goal.status] }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Skeleton className="h-72" />
          )}
        </SectionCard>
        <SectionCard
          title={t('performance.distribution')}
          description={t('performance.distributionDescription')}
          className="lg:col-span-5"
          contentClassName="flex flex-col"
        >
          {data ? (
            <BarChart
              data={data.distribution}
              xKey="score"
              className="h-full min-h-64"
              highlight={3}
              series={[{ key: 'people', label: t('performance.people') }]}
            />
          ) : (
            <Skeleton className="h-64" />
          )}
        </SectionCard>
      </div>

      <SectionCard
        title={t('performance.pending')}
        description={t('performance.pendingDescription')}
        flush
      >
        <ul className="grid divide-y border-t md:grid-cols-2 md:divide-y-0">
          {data?.pending.map((person) => (
            <li
              key={person.id}
              className="flex items-center gap-3 border-b px-6 py-3.5 md:odd:border-r"
            >
              <UserCell
                name={person.name}
                secondary={t('performance.reviewer', { name: person.reviewer })}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => notify.success(t('performance.reminded', { name: person.reviewer }))}
              >
                <BellRing /> {t('performance.remind')}
              </Button>
            </li>
          ))}
        </ul>
      </SectionCard>
    </Page>
  );
}
