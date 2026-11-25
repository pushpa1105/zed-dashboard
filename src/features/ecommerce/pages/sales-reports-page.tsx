import { Banknote, ChartColumn, Download, Package, ReceiptText, ShoppingBag } from 'lucide-react';
import { useMemo } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { useSearchParams } from '@/core/router/router';
import { AreaChart } from '@/shared/components/charts/area-chart';
import { DonutChart } from '@/shared/components/charts/donut-chart';
import { MeterList } from '@/shared/components/dashboard/meter-list';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { downloadFile, toCsv } from '@/shared/components/data-table/csv';
import { DataTableFacetedFilter } from '@/shared/components/data-table/data-table-faceted-filter';
import { EmptyState } from '@/shared/components/display/empty-state';
import { ErrorState } from '@/shared/components/display/error-state';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { cn } from '@/shared/lib/cn';
import { formatDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { salesReportQuery, useSalesReport } from '../api/reports-api';
import { ReportProductsCard } from '../components/report-products-card';
import { StatCards } from '../components/stat-cards';
import { formatMoney } from '../lib/money';
import {
  REPORT_PERIODS,
  salesReportSearchSchema,
  type SalesReport,
  type SalesReportSearch,
} from '../model/reports';
import { ORDER_CHANNELS } from '../model/store';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ request }) => {
    const params = Object.fromEntries(new URL(request.url).searchParams);
    await queryClient.prefetchQuery(salesReportQuery(salesReportSearchSchema.parse(params)));
    return null;
  };

const SUMMARY = [
  { key: 'revenue', icon: Banknote, color: 'var(--chart-1)', currency: true },
  { key: 'orders', icon: ReceiptText, color: 'var(--chart-2)', currency: false },
  { key: 'units', icon: Package, color: 'var(--chart-3)', currency: false },
  { key: 'aov', icon: ShoppingBag, color: 'var(--chart-4)', currency: true },
] as const;

type Channel = (typeof ORDER_CHANNELS)[number];
const CHANNEL_COLOR: Record<Channel, string> = {
  online: 'var(--chart-1)',
  pos: 'var(--chart-2)',
  marketplace: 'var(--chart-3)',
  social: 'var(--chart-4)',
};

/** Revenue by channel over time, by category and by product for the selected period. */
export default function SalesReportsPage() {
  const { t, i18n } = useTranslation('ecommerce');
  const [params, setParams] = useSearchParams();
  const search = useMemo(() => salesReportSearchSchema.parse(Object.fromEntries(params)), [params]);
  const report = useSalesReport(search);
  const data = report.data;
  const money = (n: number) => formatMoney(n, i18n.language, 0);
  const channelLabel = (channel: Channel) => t(`channel.${channel}`);

  const update = (patch: Partial<SalesReportSearch>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(patch)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        return next;
      },
      { replace: true },
    );

  const exportCsv = (products: SalesReport['products']) =>
    downloadFile(
      `sales-by-product-${search.period}.csv`,
      toCsv(
        (['product', 'category', 'units', 'orders', 'revenue'] as const).map((c) =>
          t(`reports.col.${c}`),
        ),
        products.map((p) => [p.name, p.category, p.units, p.orders, p.revenue]),
      ),
    );

  return (
    <Page
      width="full"
      title={t('reports.title')}
      description={t('reports.description')}
      actions={
        <Button variant="outline" disabled={!data} onClick={() => data && exportCsv(data.products)}>
          <Download /> {t('reports.export')}
        </Button>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          value={search.period}
          onChange={(period) => update({ period })}
          aria-label={t('reports.period')}
          options={REPORT_PERIODS.map((value) => ({ value, label: t(`reports.periods.${value}`) }))}
        />
        <DataTableFacetedFilter
          title={t('reports.channel')}
          value={search.channel.split(',').filter(Boolean)}
          onChange={(v) => update({ channel: v.join(',') })}
          options={ORDER_CHANNELS.map((value) => ({ value, label: channelLabel(value) }))}
        />
      </div>

      <StatCards
        loading={!data}
        items={SUMMARY.map(({ key, icon, color, currency }) => {
          const metric = data?.summary[key];
          return {
            key,
            icon,
            color,
            variant: 'default',
            label: t(`reports.summary.${key}`),
            value:
              metric &&
              (currency ? money(metric.value) : metric.value.toLocaleString(i18n.language)),
            delta: metric?.delta,
            hint: t('reports.vsPrevious'),
          };
        })}
      />

      {report.isError ? (
        <ErrorState title={t('common.error')} onRetry={() => void report.refetch()} />
      ) : !data ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 rounded-xl lg:col-span-2" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      ) : !data.products.length ? (
        <EmptyState
          icon={ChartColumn}
          title={t('reports.empty.title')}
          description={t('reports.empty.description')}
        />
      ) : (
        <div
          className={cn(
            'grid items-start gap-6 lg:grid-cols-3',
            report.isPlaceholderData && 'opacity-70',
          )}
        >
          <SectionCard
            className="min-w-0 lg:col-span-2"
            title={t('reports.trend.title')}
            description={t('reports.trend.description')}
          >
            <AreaChart
              data={data.daily}
              xKey="day"
              stacked
              series={data.channels.map(({ channel }) => ({
                key: channel,
                label: channelLabel(channel),
                color: CHANNEL_COLOR[channel],
              }))}
              xFormatter={(day) => formatDate(day, 'MMM D')}
              valueFormatter={money}
              legend
              className="h-72"
            />
          </SectionCard>
          <SectionCard
            title={t('reports.channels.title')}
            description={t('reports.channels.description')}
          >
            <DonutChart
              data={data.channels.map(({ channel, revenue }) => ({
                key: channel,
                label: channelLabel(channel),
                value: revenue,
                color: CHANNEL_COLOR[channel],
              }))}
              legend="bottom"
              valueFormatter={money}
              centerValue={money(data.summary.revenue.value)}
              centerLabel={t('reports.summary.revenue')}
              className="gap-4"
            />
          </SectionCard>
          <ReportProductsCard products={data.products} />
          <SectionCard
            title={t('reports.categories.title')}
            description={t('reports.categories.description')}
          >
            <MeterList
              items={data.categories.map((c) => ({
                key: c.id,
                label: c.name,
                value: c.revenue,
                max: data.categories[0]!.revenue,
                display: `${money(c.revenue)} · ${t('reports.units', { count: c.units })}`,
              }))}
            />
          </SectionCard>
        </div>
      )}
    </Page>
  );
}
