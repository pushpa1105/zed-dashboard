import { CalendarX2, Hourglass, Layers, ShieldAlert } from 'lucide-react';
import { useMemo } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { useSearchParams } from '@/core/router/router';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { MeterList } from '@/shared/components/dashboard/meter-list';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { DataTable } from '@/shared/components/data-table/data-table';
import { DataTablePagination } from '@/shared/components/data-table/data-table-pagination';
import { DataTableToolbar } from '@/shared/components/data-table/data-table-toolbar';
import { useDataTable } from '@/shared/components/data-table/use-data-table';
import { Skeleton } from '@/shared/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';

import { batchesQuery, useBatches } from '../api/stock-api';
import { useBatchColumns } from '../components/batch-columns';
import { ErrorPanel } from '../components/error-panel';
import { qty, usd, usdCompact } from '../lib/format';
import { oneOf } from '../lib/params';
import { WAREHOUSE_CODES } from '../model/inventory';
import { EXPIRY_WINDOWS, type Batch, type ExpiryWindow } from '../model/stock';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(batchesQuery());
    return null;
  };

const EMPTY: Batch[] = [];
const BUCKET_DAYS = 30;
const OUTLOOK_BUCKETS = 6;

const inWindow = (expiry: ExpiryWindow) => (b: Batch) =>
  expiry === 'expired' ? b.daysLeft < 0 : b.daysLeft >= 0 && b.daysLeft <= Number(expiry);
const valueOf = (batches: Batch[]) => batches.reduce((s, b) => s + b.quantity * b.unitCost, 0);

function Kpis({ batches }: { batches?: Batch[] }) {
  const { t } = useTranslation('inventory', { keyPrefix: 'batches.kpis' });
  const all = batches ?? EMPTY;
  const expired = all.filter(inWindow('expired'));
  const soon = all.filter(inWindow('30'));
  const quarantined = all.filter((b) => b.status === 'quarantined');
  const loading = !batches;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={Layers}
        label={t('lots')}
        value={all.length}
        hint={t('units', { units: qty(all.reduce((s, b) => s + b.quantity, 0)) })}
        loading={loading}
      />
      <StatCard
        icon={CalendarX2}
        color="var(--destructive)"
        label={t('expired')}
        value={usd(valueOf(expired))}
        hint={t('lotsHint', { count: expired.length })}
        loading={loading}
      />
      <StatCard
        icon={Hourglass}
        color="var(--warning)"
        label={t('soon')}
        value={usd(valueOf(soon))}
        hint={t('lotsHint', { count: soon.length })}
        loading={loading}
      />
      <StatCard
        icon={ShieldAlert}
        color="var(--info)"
        label={t('quarantined')}
        value={quarantined.length}
        hint={t('units', { units: qty(quarantined.reduce((s, b) => s + b.quantity, 0)) })}
        loading={loading}
      />
    </div>
  );
}

/** Value already expired, then value expiring in each of the next 30-day buckets. */
function useOutlook(batches: Batch[]) {
  const { t } = useTranslation('inventory', { keyPrefix: 'batches.outlook' });
  return useMemo(() => {
    const buckets = Array.from({ length: OUTLOOK_BUCKETS + 1 }, () => 0);
    for (const b of batches) {
      const i = b.daysLeft < 0 ? 0 : 1 + Math.floor(b.daysLeft / BUCKET_DAYS);
      if (i < buckets.length) buckets[i]! += b.quantity * b.unitCost;
    }
    return buckets.map((value, i) => ({
      bucket: i ? t('bucket', { from: (i - 1) * BUCKET_DAYS, to: i * BUCKET_DAYS }) : t('expired'),
      value: Math.round(value),
    }));
  }, [batches, t]);
}

/** Lot-tracked stock with expiry dates, at-risk value and a quarantine action per batch. */
export default function BatchesPage() {
  const { t } = useTranslation('inventory', { keyPrefix: 'batches' });
  const batches = useBatches();
  const all = batches.data ?? EMPTY;
  const columns = useBatchColumns();
  const outlook = useOutlook(all);
  const [params, setParams] = useSearchParams();
  const expiry = oneOf(EXPIRY_WINDOWS, params.get('window'), null);
  const rows = useMemo(() => (expiry ? all.filter(inWindow(expiry)) : all), [all, expiry]);

  const table = useDataTable<Batch>({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    globalFilterFn: 'includesString',
    initialState: {
      sorting: [{ id: 'daysLeft', desc: false }],
      pagination: { pageIndex: 0, pageSize: 20 },
    },
  });

  const atRisk = all.filter((b) => b.daysLeft <= 90);

  return (
    <Page title={t('title')} description={t('description')} width="full">
      {batches.isError ? (
        <ErrorPanel onRetry={() => void batches.refetch()} />
      ) : (
        <>
          <Kpis batches={batches.data} />

          <div className="grid gap-6 xl:grid-cols-3">
            <SectionCard
              className="xl:col-span-2"
              title={t('outlook.title')}
              description={t('outlook.description')}
            >
              {batches.data ? (
                <BarChart
                  className="h-64"
                  data={outlook}
                  xKey="bucket"
                  series={[{ key: 'value', label: t('outlook.value'), color: 'var(--chart-3)' }]}
                  highlight={0}
                  valueFormatter={usdCompact}
                />
              ) : (
                <Skeleton className="h-64 w-full" />
              )}
            </SectionCard>
            <SectionCard title={t('risk.title')} description={t('risk.description')}>
              {batches.data ? (
                <MeterList
                  items={WAREHOUSE_CODES.map((code) => {
                    const risk = valueOf(atRisk.filter((b) => b.warehouse === code));
                    return {
                      key: code,
                      label: code,
                      value: risk,
                      max: valueOf(all.filter((b) => b.warehouse === code)) || 1,
                      display: usdCompact(risk),
                      color: 'var(--warning)',
                    };
                  })}
                />
              ) : (
                <Skeleton className="h-56 w-full" />
              )}
            </SectionCard>
          </div>

          <div className="space-y-3">
            <Tabs
              value={expiry ?? 'all'}
              onValueChange={(value) =>
                setParams(value === 'all' ? {} : { window: value }, { replace: true })
              }
            >
              <TabsList
                aria-label={t('windowFilter')}
                className="scrollbar-none max-w-full justify-start overflow-x-auto"
              >
                {(['all', ...EXPIRY_WINDOWS] as const).map((w) => (
                  <TabsTrigger key={w} value={w} className="gap-1.5">
                    {t(`windows.${w}`)}
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {w === 'all' ? all.length : all.filter(inWindow(w)).length}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <DataTableToolbar
              search={(table.state.globalFilter as string | undefined) ?? ''}
              onSearchChange={(value) => table.setGlobalFilter(value)}
              searchPlaceholder={t('search')}
            />
            <DataTable
              table={table}
              loading={!batches.data}
              caption={t('table')}
              labels={{ emptyTitle: t('empty.title'), emptyDescription: t('empty.description') }}
            />
            <DataTablePagination table={table} />
          </div>
        </>
      )}
    </Page>
  );
}
