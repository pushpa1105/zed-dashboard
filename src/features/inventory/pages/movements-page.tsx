import { Download } from 'lucide-react';
import { useMemo } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { notify } from '@/core/notify/notify';
import { useSearchParams } from '@/core/router/router';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';
import { exportTableToCsv } from '@/shared/components/data-table/csv';
import { DataTable } from '@/shared/components/data-table/data-table';
import { DataTableDateRangeFilter } from '@/shared/components/data-table/data-table-date-range-filter';
import { DataTablePagination } from '@/shared/components/data-table/data-table-pagination';
import { useDataTable } from '@/shared/components/data-table/use-data-table';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';

import { movementsQuery, useMovements } from '../api/inventory-api';
import { ErrorPanel } from '../components/error-panel';
import { useMovementColumns } from '../components/movement-columns';
import { qty, qtyCompact, shortDate, signed } from '../lib/format';
import {
  MOVEMENT_TYPES,
  WAREHOUSE_CODES,
  type Movement,
  type MovementFilters,
  type MovementRow,
} from '../model/inventory';

const FILTER_KEYS = ['type', 'warehouse', 'from', 'to'] as const;

const filtersOf = (params: URLSearchParams): MovementFilters =>
  Object.fromEntries(
    FILTER_KEYS.flatMap((key) => (params.get(key) ? [[key, params.get(key)]] : [])),
  ) as MovementFilters;

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ request }) => {
    await queryClient.prefetchQuery(movementsQuery(filtersOf(new URL(request.url).searchParams)));
    return null;
  };

const GROUP: Record<Movement['type'], 'receipts' | 'sales' | 'transfers' | 'adjustments'> = {
  receipt: 'receipts',
  shipment: 'sales',
  'transfer-in': 'transfers',
  'transfer-out': 'transfers',
  adjustment: 'adjustments',
  count: 'adjustments',
};
const SERIES = [
  { key: 'receipts', color: 'var(--chart-2)' },
  { key: 'sales', color: 'var(--chart-1)' },
  { key: 'transfers', color: 'var(--chart-4)' },
  { key: 'adjustments', color: 'var(--chart-3)' },
] as const;

/** Monday of the movement's week, as `YYYY-MM-DD`. */
const weekOf = (at: string) => {
  const d = new Date(at.slice(0, 10));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};

function weeklyUnits(rows: MovementRow[]) {
  const weeks = new Map<string, Record<string, number>>();
  for (const m of rows) {
    const week = weeks.get(weekOf(m.at)) ?? { receipts: 0, sales: 0, transfers: 0, adjustments: 0 };
    week[GROUP[m.type]]! += Math.abs(m.quantity);
    weeks.set(weekOf(m.at), week);
  }
  return [...weeks.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, units]) => ({ week: shortDate(week), ...units }));
}

const EMPTY: MovementRow[] = [];

/** Audit ledger of every stock movement with filters, weekly trend and CSV export. */
export default function MovementsPage() {
  const { t } = useTranslation('inventory', { keyPrefix: 'movements' });
  const { t: tType } = useTranslation('inventory', { keyPrefix: 'item.ledger.types' });
  const [params, setParams] = useSearchParams();
  const filters = filtersOf(params);
  const movements = useMovements(filters);
  const rows = movements.data ?? EMPTY;
  const columns = useMovementColumns();
  const trend = useMemo(() => weeklyUnits(rows), [rows]);

  const table = useDataTable<MovementRow>({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    initialState: { pagination: { pageIndex: 0, pageSize: 25 } },
  });

  const setFilters = (next: MovementFilters) => {
    const merged = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) {
      if (value) merged.set(key, value);
      else merged.delete(key);
    }
    setParams(merged, { replace: true });
  };

  const inbound = rows.reduce((s, m) => s + Math.max(0, m.quantity), 0);
  const outbound = rows.reduce((s, m) => s + Math.max(0, -m.quantity), 0);

  const filterSelect = (key: 'type' | 'warehouse', options: readonly string[], all: string) => (
    <Select
      value={filters[key] ?? 'all'}
      onValueChange={(value) => setFilters({ [key]: value === 'all' ? undefined : value })}
    >
      <SelectTrigger size="sm" className="w-44" aria-label={t(key)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{all}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {key === 'type' ? tType(option as Movement['type']) : option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <Page title={t('title')} description={t('description')} width="full">
      <div className="flex flex-wrap items-center gap-2">
        {filterSelect('type', MOVEMENT_TYPES, t('allTypes'))}
        {filterSelect('warehouse', WAREHOUSE_CODES, t('allWarehouses'))}
        <DataTableDateRangeFilter
          title={t('dates')}
          value={{ from: filters.from, to: filters.to }}
          onChange={({ from, to }) => setFilters({ from, to })}
          clearLabel={t('clear')}
          presets={[
            { label: t('presets.week'), days: 7 },
            { label: t('presets.month'), days: 30 },
            { label: t('presets.quarter'), days: 90 },
          ]}
        />
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          disabled={!rows.length}
          onClick={() => {
            exportTableToCsv(table, { filename: 'stock-movements.csv' });
            notify.success(t('exported', { count: rows.length }));
          }}
        >
          <Download /> {t('export')}
        </Button>
      </div>

      {movements.isError ? (
        <ErrorPanel onRetry={() => void movements.refetch()} />
      ) : (
        <>
          <SectionCard title={t('trend.title')} description={t('trend.description')}>
            <StatStrip
              className="mb-4 border-b pb-2"
              items={(
                [
                  ['count', qty(rows.length)],
                  ['inbound', qty(inbound)],
                  ['outbound', qty(outbound)],
                  ['net', signed(inbound - outbound)],
                ] as const
              ).map(([key, value]) => ({
                key,
                label: t(`kpis.${key}`),
                value: movements.data ? value : '—',
              }))}
            />
            {movements.data ? (
              <BarChart
                className="h-72"
                data={trend}
                xKey="week"
                mode="stacked"
                series={SERIES.map((s) => ({ ...s, label: t(`trend.${s.key}`) }))}
                valueFormatter={qtyCompact}
              />
            ) : (
              <Skeleton className="h-72 w-full" />
            )}
          </SectionCard>

          <div className="space-y-3">
            <DataTable
              table={table}
              loading={!movements.data}
              refreshing={movements.isPlaceholderData}
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
