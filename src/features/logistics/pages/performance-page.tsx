import { Boxes, Download, Euro, Gauge, Route, Timer } from 'lucide-react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { notify } from '@/core/notify/notify';
import { useEnumParam } from '@/core/router/search-params';
import { AreaChart } from '@/shared/components/charts/area-chart';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { LineChart } from '@/shared/components/charts/line-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { downloadFile, toCsv } from '@/shared/components/data-table/csv';
import { EmptyState } from '@/shared/components/display/empty-state';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { formatDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';

import { performanceQuery, usePerformance } from '../api/partners-api';
import { LanePerformanceTable } from '../components/lane-performance-table';
import { QueryBoundary } from '../components/query-state';
import { DashboardSkeleton, StatGrid } from '../components/stat-grid';
import { fmtCurrency, fmtNumber, fmtPct } from '../lib/format';
import { pctChange } from '../lib/math';
import {
  ON_TIME_TARGET,
  PERIODS,
  type LanePerformance,
  type Performance,
  type Period,
} from '../model/performance';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ request }) => {
    const period = new URL(request.url).searchParams.get('period');
    await queryClient.prefetchQuery(performanceQuery(PERIODS.find((p) => p === period) ?? '30d'));
    return null;
  };

const CSV_FIELDS = [
  'origin',
  'destination',
  'mode',
  'distanceKm',
  'shipments',
  'onTimePct',
  'transitHours',
  'costPerShipment',
  'utilisationPct',
] as const satisfies ReadonlyArray<keyof LanePerformance>;

function Kpis({ report }: { report: Performance }) {
  const { t, i18n } = useTranslation('logistics');
  const { current, previous } = report;
  const delta = (key: keyof typeof current) => pctChange(current[key], previous[key]);
  const hint = t('performance.kpi.vsPrevious');
  return (
    <StatGrid>
      <StatCard
        label={t('performance.kpi.onTime')}
        value={fmtPct(current.onTimePct, i18n.language)}
        icon={Timer}
        color="var(--success)"
        delta={delta('onTimePct')}
        hint={hint}
      />
      <StatCard
        label={t('performance.kpi.cost')}
        value={fmtCurrency(current.costPerShipment, i18n.language)}
        icon={Euro}
        color="var(--chart-2)"
        delta={delta('costPerShipment')}
        invert
        hint={hint}
      />
      <StatCard
        label={t('performance.kpi.utilisation')}
        value={fmtPct(current.utilisationPct, i18n.language)}
        icon={Gauge}
        color="var(--chart-4)"
        delta={delta('utilisationPct')}
        hint={hint}
      />
      <StatCard
        label={t('performance.kpi.shipments')}
        value={fmtNumber(current.shipments, i18n.language)}
        icon={Boxes}
        delta={delta('shipments')}
        hint={hint}
      />
    </StatGrid>
  );
}

function Charts({ report, period }: { report: Performance; period: Period }) {
  const { t, i18n } = useTranslation('logistics');
  const pct = (v: number) => fmtPct(v, i18n.language);
  const data = report.series.map((p) => ({
    ...p,
    label: formatDate(p.date, period === '12m' ? 'MMM' : 'D MMM'),
  }));
  return (
    <div className="grid gap-4 md:gap-6 xl:grid-cols-3">
      <SectionCard title={t('performance.charts.onTime')} className="xl:col-span-2">
        <LineChart
          data={data}
          xKey="label"
          series={[{ key: 'onTimePct', label: t('performance.kpi.onTime') }]}
          curve="monotone"
          target={{ value: ON_TIME_TARGET, label: t('performance.charts.target') }}
          valueFormatter={pct}
          className="h-72"
        />
      </SectionCard>
      <SectionCard title={t('performance.charts.utilisation')}>
        <AreaChart
          data={data}
          xKey="label"
          series={[
            {
              key: 'utilisationPct',
              label: t('performance.kpi.utilisation'),
              color: 'var(--chart-4)',
            },
          ]}
          curve="monotone"
          valueFormatter={pct}
          className="h-72"
        />
      </SectionCard>
      <SectionCard title={t('performance.charts.cost')} className="xl:col-span-3">
        <BarChart
          data={data}
          xKey="label"
          series={[
            { key: 'costPerShipment', label: t('performance.kpi.cost'), color: 'var(--chart-2)' },
          ]}
          highlight="last"
          valueFormatter={(v) => fmtCurrency(v, i18n.language)}
          className="h-64"
        />
      </SectionCard>
    </div>
  );
}

export default function PerformancePage() {
  const { t } = useTranslation('logistics');
  const [period, setPeriod] = useEnumParam<Period>('period', PERIODS, '30d');
  const query = usePerformance(period);
  const lanes = [...(query.data?.lanes ?? [])].sort((a, b) => b.shipments - a.shipments);

  const exportCsv = () => {
    const csv = toCsv(
      CSV_FIELDS.map((f) => t(`performance.csv.${f}`)),
      lanes.map((lane) => CSV_FIELDS.map((f) => lane[f])),
    );
    downloadFile(`lane-performance-${period}.csv`, csv);
    notify.success(t('performance.exported'));
  };

  return (
    <Page
      title={t('performance.title')}
      description={t('performance.description')}
      width="full"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl<Period>
            value={period}
            onChange={setPeriod}
            aria-label={t('performance.period')}
            options={PERIODS.map((p) => ({ value: p, label: t(`performance.periods.${p}`) }))}
          />
          <Button variant="outline" disabled={!lanes.length} onClick={exportCsv}>
            <Download /> {t('table.export')}
          </Button>
        </div>
      }
    >
      <QueryBoundary query={query} skeleton={<DashboardSkeleton />}>
        {(report) => (
          <div className="space-y-6" aria-busy={query.isPlaceholderData}>
            <Kpis report={report} />
            <Charts report={report} period={period} />
            <SectionCard
              title={t('performance.lanes.title')}
              description={t('performance.lanes.description')}
              flush
            >
              {lanes.length ? (
                <LanePerformanceTable lanes={lanes} />
              ) : (
                <EmptyState
                  variant="plain"
                  icon={Route}
                  title={t('performance.lanes.emptyTitle')}
                  description={t('performance.lanes.emptyDescription')}
                  className="pb-8"
                />
              )}
            </SectionCard>
          </div>
        )}
      </QueryBoundary>
    </Page>
  );
}
