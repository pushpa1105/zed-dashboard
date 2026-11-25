import { CalendarCheck, Repeat, UserCheck, Users } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { LineChart } from '@/shared/components/charts/line-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';

import { retentionQuery, useRetention } from '../api/analytics-api';
import { CohortTable } from '../components/cohort-table';
import { QueryError } from '../components/query-error';
import { compact, percent, shortDate } from '../lib/format';
import { averageRetention } from '../lib/stats';
import {
  COHORT_COUNTS,
  RETENTION_SEGMENTS,
  type CohortCount,
  type RetentionSegment,
} from '../model/analytics';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(retentionQuery('all', '8'));
    return null;
  };

/** Weekly signup cohorts and how many of them come back. */
export default function RetentionPage() {
  const { t } = useTranslation('analytics');
  const [segment, setSegment] = useState<RetentionSegment>('all');
  const [count, setCount] = useState<CohortCount>('8');
  const [mode, setMode] = useState<'percent' | 'users'>('percent');
  const [picked, setPicked] = useState<string | null>(null);
  const query = useRetention(segment, count);
  const data = query.data;

  const average = data ? averageRetention(data.cohorts) : [];
  const selected = data?.cohorts.find((c) => c.week === picked) ?? data?.cohorts[0];
  const curve = average.map((avg, w) => ({
    week: t('retention.week', { n: w }),
    average: Math.round(avg * 10) / 10,
    cohort:
      selected?.retained[w] === undefined
        ? null
        : Math.round((selected.retained[w] / selected.size) * 1000) / 10,
  }));
  const at = (w: number) => percent(average[Math.min(w, average.length - 1)] ?? 0);

  return (
    <Page
      width="full"
      title={t('retention.title')}
      description={t('retention.description')}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Select value={segment} onValueChange={(v) => setSegment(v as RetentionSegment)}>
            <SelectTrigger className="w-44" aria-label={t('retention.segment')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {RETENTION_SEGMENTS.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`retention.segments.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <SegmentedControl
            value={count}
            onChange={setCount}
            aria-label={t('retention.cohorts')}
            options={COHORT_COUNTS.map((value) => ({
              value,
              label: t('retention.weeks', { count: Number(value) }),
            }))}
          />
        </div>
      }
    >
      {query.isError && !data ? (
        <QueryError onRetry={() => void query.refetch()} />
      ) : !data || !selected ? (
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Users}
              label={t('retention.kpis.users')}
              value={compact(data.cohorts.reduce((sum, c) => sum + c.size, 0))}
              hint={t('retention.kpis.usersHint', { count: Number(count) })}
            />
            <StatCard
              icon={UserCheck}
              color="var(--chart-2)"
              label={t('retention.kpis.week1')}
              value={at(1)}
            />
            <StatCard
              icon={CalendarCheck}
              color="var(--chart-3)"
              label={t('retention.kpis.week4')}
              value={at(4)}
            />
            <StatCard
              icon={Repeat}
              color="var(--chart-4)"
              label={t('retention.kpis.last', { n: average.length - 1 })}
              value={at(average.length - 1)}
            />
          </div>
          <SectionCard
            title={t('retention.table.title')}
            description={t('retention.table.description')}
            action={
              <SegmentedControl
                size="sm"
                value={mode}
                onChange={setMode}
                options={(['percent', 'users'] as const).map((value) => ({
                  value,
                  label: t(`retention.modes.${value}`),
                }))}
              />
            }
          >
            <CohortTable
              cohorts={data.cohorts}
              average={average}
              mode={mode}
              selected={selected.week}
              onSelect={setPicked}
            />
          </SectionCard>
          <SectionCard
            title={t('retention.curve.title')}
            description={t('retention.curve.description', { week: shortDate(selected.week) })}
          >
            <LineChart
              data={curve}
              xKey="week"
              curve="monotone"
              dots
              className="h-72"
              valueFormatter={(v) => percent(v, 0)}
              series={[
                { key: 'average', label: t('retention.curve.average') },
                {
                  key: 'cohort',
                  label: t('retention.curve.cohort', { week: shortDate(selected.week) }),
                },
              ]}
            />
          </SectionCard>
        </div>
      )}
    </Page>
  );
}
