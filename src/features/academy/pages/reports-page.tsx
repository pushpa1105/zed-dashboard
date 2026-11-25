import { CheckCircle2, DollarSign, Download, Percent, UserPlus } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { AreaChart } from '@/shared/components/charts/area-chart';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { downloadFile, toCsv } from '@/shared/components/data-table/csv';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { reportsQuery, useReports } from '../api/teaching-api';
import { CourseLeaderboard } from '../components/course-leaderboard';
import { DropoffChart } from '../components/dropoff-chart';
import { QueryState } from '../components/query-state';
import { compact, money, rate } from '../lib/format';
import {
  REPORT_RANGES,
  type ReportRange,
  type Reports,
  type ReportTotals,
} from '../model/teaching';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(reportsQuery('30d'));
    return null;
  };

const sum = (rows: ReportTotals[], key: keyof ReportTotals) => rows.reduce((s, r) => s + r[key], 0);

/** Percent change with one decimal. */
const change = (now: number, before: number) =>
  before ? Math.round(((now - before) / before) * 1000) / 10 : 0;

const periodLabel = (range: ReportRange) => (iso: string) =>
  new Date(iso).toLocaleDateString(
    'en-US',
    range === '12m' ? { month: 'short' } : { month: 'short', day: 'numeric' },
  );

function exportCsv({ range, series }: Reports) {
  const csv = toCsv(
    ['period', 'enrolments', 'completions', 'revenue'],
    series.map((r) => [r.period.slice(0, 10), r.enrolments, r.completions, r.revenue]),
  );
  downloadFile(`academy-report-${range}.csv`, csv);
}

function ReportView({ report }: { report: Reports }) {
  const { t } = useTranslation('academy');
  const { series, previous } = report;
  const label = periodLabel(report.range);
  const totals = {
    enrolments: sum(series, 'enrolments'),
    completions: sum(series, 'completions'),
    revenue: sum(series, 'revenue'),
  };
  const completionRate = rate(totals.completions, totals.enrolments);
  const data = series.map((r) => ({ ...r, period: label(r.period) }));

  const stats = [
    {
      key: 'enrolments',
      icon: UserPlus,
      value: compact(totals.enrolments),
      delta: change(totals.enrolments, previous.enrolments),
      sparkline: series.map((r) => r.enrolments),
    },
    {
      key: 'completions',
      icon: CheckCircle2,
      value: compact(totals.completions),
      delta: change(totals.completions, previous.completions),
      sparkline: series.map((r) => r.completions),
    },
    {
      key: 'completionRate',
      icon: Percent,
      value: `${completionRate}%`,
      delta: change(completionRate, rate(previous.completions, previous.enrolments)),
      sparkline: series.map((r) => rate(r.completions, r.enrolments)),
    },
    {
      key: 'revenue',
      icon: DollarSign,
      value: money(totals.revenue),
      delta: change(totals.revenue, previous.revenue),
      sparkline: series.map((r) => r.revenue),
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ key, ...stat }) => (
          <StatCard
            key={key}
            label={t(`reports.metrics.${key}`)}
            hint={t('reports.vsPrevious')}
            {...stat}
          />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
        <SectionCard title={t('reports.trend.title')} description={t('reports.trend.description')}>
          <AreaChart
            data={data}
            xKey="period"
            series={[
              { key: 'enrolments', label: t('reports.metrics.enrolments') },
              { key: 'completions', label: t('reports.metrics.completions') },
            ]}
            className="h-72"
          />
        </SectionCard>
        <SectionCard
          title={t('reports.revenue.title')}
          description={t('reports.revenue.description')}
        >
          <BarChart
            data={data}
            xKey="period"
            series={[
              { key: 'revenue', label: t('reports.metrics.revenue'), color: 'var(--chart-3)' },
            ]}
            highlight="last"
            valueFormatter={money}
            className="h-72"
          />
        </SectionCard>
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[3fr_2fr]">
        <CourseLeaderboard courses={report.courses} />
        <DropoffChart courses={report.courses} dropoff={report.dropoff} />
      </div>
    </div>
  );
}

/** Enrolments, completions and revenue over time, which courses lead, and where learners stop. */
export default function ReportsPage() {
  const { t } = useTranslation('academy');
  const [range, setRange] = useState<ReportRange>('30d');
  const query = useReports(range);

  return (
    <Page
      width="full"
      title={t('reports.title')}
      description={t('reports.description')}
      actions={
        <>
          <SegmentedControl
            aria-label={t('reports.range')}
            value={range}
            onChange={setRange}
            options={REPORT_RANGES.map((value) => ({
              value,
              label: t(`reports.ranges.${value}`),
            }))}
          />
          <Button
            variant="outline"
            disabled={!query.data}
            onClick={() => query.data && exportCsv(query.data)}
          >
            <Download /> {t('reports.export')}
          </Button>
        </>
      }
    >
      <QueryState
        query={query}
        skeleton={
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-36 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-96 rounded-xl" />
          </div>
        }
      >
        {(report) => <ReportView report={report} />}
      </QueryState>
    </Page>
  );
}
