import { CircleDollarSign, PackageSearch, ShoppingCart, TimerOff } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { notify } from '@/core/notify/notify';
import { useNavigate } from '@/core/router/router';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { DataTable } from '@/shared/components/data-table/data-table';
import { DataTableBulkBar } from '@/shared/components/data-table/data-table-bulk-bar';
import { DataTablePagination } from '@/shared/components/data-table/data-table-pagination';
import { useDataTable } from '@/shared/components/data-table/use-data-table';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { Button } from '@/shared/ui/button';

import { reorderPlanQuery, useCreatePurchaseOrders, useReorderPlan } from '../api/inventory-api';
import { ErrorPanel } from '../components/error-panel';
import { useReorderColumns, type PlanRow } from '../components/reorder-columns';
import { inDays, isoDate, usd } from '../lib/format';
import type { PurchaseOrderInput, ReorderLine } from '../model/inventory';
import { inventoryRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(reorderPlanQuery());
    return null;
  };

const HORIZONS = ['14', '30', '60'] as const;
const EMPTY: PlanRow[] = [];

/**
 * Covers usage until the order lands plus `horizon` days after it, net of what
 * is already available or on order, and never below the item's reorder quantity.
 */
function plan(line: ReorderLine, horizon: number): PlanRow {
  const need = line.dailyUsage * (line.leadTimeDays + horizon) - line.available - line.onOrder;
  const suggested = Math.max(line.reorderQty, Math.ceil(need / 10) * 10);
  return {
    ...line,
    daysLeft: Math.floor(Math.max(0, line.available) / line.dailyUsage),
    suggested,
    cost: Math.round(suggested * line.unitCost),
  };
}

/** One draft PO per supplier, shipping to the main DC. */
function draftOrders(rows: PlanRow[]): PurchaseOrderInput[] {
  const bySupplier = new Map<string, PlanRow[]>();
  for (const row of rows) {
    bySupplier.set(row.supplierId, [...(bySupplier.get(row.supplierId) ?? []), row]);
  }
  return [...bySupplier.values()].map((lines) => ({
    supplierId: lines[0]!.supplierId,
    warehouse: 'RNO',
    expected: isoDate(inDays(lines[0]!.leadTimeDays)),
    status: 'draft',
    lines: lines.map((l) => ({ sku: l.sku, quantity: l.suggested, unitCost: l.unitCost })),
  }));
}

/** Items below their reorder point with usage-based order quantities; turns a selection into POs. */
export default function ReorderPage() {
  const { t } = useTranslation('inventory', { keyPrefix: 'reorder' });
  const navigate = useNavigate();
  const reorder = useReorderPlan();
  const create = useCreatePurchaseOrders();
  const columns = useReorderColumns();
  const [horizon, setHorizon] = useState<(typeof HORIZONS)[number]>('30');
  const rows = useMemo(
    () => reorder.data?.map((line) => plan(line, Number(horizon))) ?? EMPTY,
    [reorder.data, horizon],
  );

  const table = useDataTable<PlanRow>({
    data: rows,
    columns,
    getRowId: (row) => row.sku,
    initialState: {
      sorting: [{ id: 'daysLeft', desc: false }],
      pagination: { pageIndex: 0, pageSize: 20 },
    },
  });
  const selected = table.getSelectedRowModel().rows.map((r) => r.original);
  const loading = !reorder.data;

  const createOrders = () => {
    const orders = draftOrders(selected);
    create.mutate(orders, {
      onSuccess: () => {
        notify.success(t('created', { count: orders.length }));
        table.resetRowSelection();
        void navigate(inventoryRoutes.purchaseOrders.href());
      },
    });
  };

  return (
    <Page
      title={t('title')}
      description={t('description')}
      width="full"
      actions={
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted-foreground sm:inline">{t('horizon')}</span>
          <SegmentedControl
            aria-label={t('horizon')}
            size="sm"
            value={horizon}
            onChange={setHorizon}
            options={HORIZONS.map((h) => ({
              value: h,
              label: t('horizonOption', { count: Number(h) }),
            }))}
          />
        </div>
      }
    >
      {reorder.isError ? (
        <ErrorPanel onRetry={() => void reorder.refetch()} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              icon={PackageSearch}
              label={t('kpis.items')}
              value={rows.length}
              hint={t('kpis.suppliers', { count: new Set(rows.map((r) => r.supplierId)).size })}
              loading={loading}
            />
            <StatCard
              icon={TimerOff}
              color="var(--destructive)"
              label={t('kpis.stockouts')}
              value={rows.filter((r) => r.daysLeft < r.leadTimeDays).length}
              hint={t('kpis.stockoutsHint')}
              loading={loading}
            />
            <StatCard
              icon={CircleDollarSign}
              color="var(--chart-2)"
              label={t('kpis.cost')}
              value={usd(rows.reduce((s, r) => s + r.cost, 0))}
              loading={loading}
            />
          </div>
          <div className="space-y-2">
            <DataTable
              table={table}
              loading={loading}
              caption={t('title')}
              onRowClick={(row) => row.toggleSelected()}
              labels={{ emptyTitle: t('empty.title'), emptyDescription: t('empty.description') }}
            />
            <DataTablePagination table={table} />
            <p className="text-xs text-muted-foreground">{t('formula')}</p>
          </div>
        </>
      )}

      <DataTableBulkBar
        count={selected.length}
        onClear={() => table.resetRowSelection()}
        label={(count) => t('selected', { count })}
        clearLabel={t('clear')}
      >
        <Button variant="ghost" size="sm" disabled={create.isPending} onClick={createOrders}>
          <ShoppingCart /> {t('createPO')}
        </Button>
      </DataTableBulkBar>
    </Page>
  );
}
