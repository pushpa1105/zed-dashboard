import { Archive, Boxes, CircleDollarSign, Download, Snail } from 'lucide-react';
import type { ReactNode } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { notify } from '@/core/notify/notify';
import { useSearchParams } from '@/core/router/router';
import { AreaChart } from '@/shared/components/charts/area-chart';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { DonutChart } from '@/shared/components/charts/donut-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { exportTableToCsv } from '@/shared/components/data-table/csv';
import { DataTable } from '@/shared/components/data-table/data-table';
import { DataTablePagination } from '@/shared/components/data-table/data-table-pagination';
import { useDataTable } from '@/shared/components/data-table/use-data-table';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { useValuation, valuationQuery } from '../api/stock-api';
import { ErrorPanel } from '../components/error-panel';
import { useValuationColumns } from '../components/valuation-columns';
import { lastMonths, qty, usd, usdCompact } from '../lib/format';
import { oneOf } from '../lib/params';
import { VALUATION_METHODS, type SlowMover, type Valuation } from '../model/stock';

const methodOf = (params: URLSearchParams) =>
  oneOf(VALUATION_METHODS, params.get('method'), 'fifo');

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ request }) => {
    await queryClient.prefetchQuery(valuationQuery(methodOf(new URL(request.url).searchParams)));
    return null;
  };

const EMPTY: SlowMover[] = [];
/** Five categorical slots; any further category falls back to a neutral tone. */
const categoryColor = (i: number) => (i < 5 ? `var(--chart-${i + 1})` : 'var(--muted-foreground)');
const sum = (rows: SlowMover[]) => rows.reduce((s, r) => s + r.value, 0);

function Kpis({ data }: { data?: Valuation }) {
  const { t } = useTranslation('inventory', { keyPrefix: 'valuation.kpis' });
  const slow = data?.slowMovers.filter((r) => r.class === 'slow') ?? EMPTY;
  const dead = data?.slowMovers.filter((r) => r.class === 'dead') ?? EMPTY;
  const quarterAgo = data?.trend.at(-4);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        variant="accent"
        icon={CircleDollarSign}
        label={t('value')}
        value={data ? usd(data.total) : '—'}
        delta={data && quarterAgo ? ((data.total - quarterAgo) / quarterAgo) * 100 : undefined}
        hint={t('vsQuarter')}
        sparkline={data?.trend}
        loading={!data}
      />
      <StatCard
        icon={Boxes}
        color="var(--chart-2)"
        label={t('units')}
        value={data ? qty(data.units) : '—'}
        hint={data ? t('skus', { count: data.skuCount }) : undefined}
        loading={!data}
      />
      <StatCard
        icon={Snail}
        color="var(--warning)"
        label={t('slow')}
        value={usd(sum(slow))}
        hint={t('items', { count: slow.length })}
        loading={!data}
      />
      <StatCard
        icon={Archive}
        color="var(--destructive)"
        label={t('dead')}
        value={usd(sum(dead))}
        hint={t('items', { count: dead.length })}
        loading={!data}
      />
    </div>
  );
}

/** Inventory value by method, warehouse and category, its trend, and stock that isn't selling. */
export default function ValuationPage() {
  const { t } = useTranslation('inventory', { keyPrefix: 'valuation' });
  const [params, setParams] = useSearchParams();
  const method = methodOf(params);
  const valuation = useValuation(method);
  const data = valuation.data;
  const columns = useValuationColumns();

  const table = useDataTable<SlowMover>({
    data: data?.slowMovers ?? EMPTY,
    columns,
    getRowId: (row) => row.sku,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });

  const chart = (className: string, render: (data: Valuation) => ReactNode) =>
    data ? render(data) : <Skeleton className={`${className} w-full`} />;

  return (
    <Page
      title={t('title')}
      description={t('description')}
      width="full"
      actions={
        <SegmentedControl
          aria-label={t('method')}
          size="sm"
          value={method}
          onChange={(value) => setParams({ method: value }, { replace: true })}
          options={VALUATION_METHODS.map((m) => ({ value: m, label: t(`methods.${m}`) }))}
        />
      }
    >
      {valuation.isError ? (
        <ErrorPanel onRetry={() => void valuation.refetch()} />
      ) : (
        <>
          <Kpis data={data} />

          <div className="grid gap-6 xl:grid-cols-3">
            <SectionCard
              className="xl:col-span-2"
              title={t('trend.title')}
              description={t('trend.description', { method: t(`methods.${method}`) })}
            >
              {chart('h-72', (d) => (
                <AreaChart
                  className="h-72"
                  data={lastMonths(d.trend.length).map((month, i) => ({
                    month,
                    value: d.trend[i]!,
                  }))}
                  xKey="month"
                  series={[{ key: 'value', label: t('trend.value') }]}
                  valueFormatter={usdCompact}
                />
              ))}
            </SectionCard>
            <SectionCard title={t('categories.title')} description={t('categories.description')}>
              {chart('h-72', (d) => (
                <DonutChart
                  className="h-72"
                  legend="bottom"
                  centerValue={usdCompact(d.total)}
                  centerLabel={t('categories.total')}
                  valueFormatter={usdCompact}
                  data={d.categories.map((c, i) => ({
                    key: c.name,
                    label: c.name,
                    value: c.value,
                    color: categoryColor(i),
                  }))}
                />
              ))}
            </SectionCard>
          </div>

          <SectionCard title={t('warehouses.title')} description={t('warehouses.description')}>
            {chart('h-80', (d) => (
              <BarChart
                className="h-80"
                mode="stacked"
                legend
                data={d.warehouses.map((w) => ({ warehouse: w.code, ...w.byCategory }))}
                xKey="warehouse"
                series={d.categories.map((c, i) => ({
                  key: c.name,
                  label: c.name,
                  color: categoryColor(i),
                }))}
                valueFormatter={usdCompact}
              />
            ))}
          </SectionCard>

          <SectionCard
            title={t('slow.title')}
            description={t('slow.description')}
            action={
              <Button
                variant="outline"
                size="sm"
                disabled={!data?.slowMovers.length}
                onClick={() => {
                  exportTableToCsv(table, { filename: `slow-moving-stock-${method}.csv` });
                  notify.success(t('slow.exported', { count: data?.slowMovers.length ?? 0 }));
                }}
              >
                <Download /> {t('slow.export')}
              </Button>
            }
          >
            <div className="space-y-3">
              <DataTable
                table={table}
                loading={!data}
                refreshing={valuation.isPlaceholderData}
                caption={t('slow.title')}
                labels={{
                  emptyTitle: t('slow.empty.title'),
                  emptyDescription: t('slow.empty.description'),
                }}
              />
              <DataTablePagination table={table} />
            </div>
          </SectionCard>
        </>
      )}
    </Page>
  );
}
