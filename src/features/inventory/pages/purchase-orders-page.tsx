import { CircleDollarSign, Clock, FilePen, Plus, Timer } from 'lucide-react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { useSearchParams } from '@/core/router/router';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { DataTable } from '@/shared/components/data-table/data-table';
import { DataTablePagination } from '@/shared/components/data-table/data-table-pagination';
import { DataTableToolbar } from '@/shared/components/data-table/data-table-toolbar';
import { useDataTable } from '@/shared/components/data-table/use-data-table';
import { Button } from '@/shared/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';

import { purchaseOrdersQuery, usePurchaseOrders } from '../api/inventory-api';
import { CreatePurchaseOrderDialog } from '../components/create-purchase-order-dialog';
import { ErrorPanel } from '../components/error-panel';
import { usePurchaseOrderColumns } from '../components/purchase-order-columns';
import { usdCompact } from '../lib/format';
import { isLatePo, isOpenPo } from '../lib/purchase-orders';
import { PO_STATUSES, type PurchaseOrder } from '../model/inventory';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(purchaseOrdersQuery());
    return null;
  };

const EMPTY: PurchaseOrder[] = [];

function Kpis({ orders }: { orders?: PurchaseOrder[] }) {
  const { t } = useTranslation('inventory', { keyPrefix: 'purchaseOrders.kpis' });
  const all = orders ?? EMPTY;
  const open = all.filter(isOpenPo);
  const received = all.filter((po) => po.deliveredOn);
  const onTime = received.filter((po) => po.deliveredOn! <= po.expected).length;
  const loading = !orders;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={CircleDollarSign}
        label={t('open')}
        value={usdCompact(open.reduce((s, po) => s + po.total, 0))}
        hint={t('openHint', { count: open.length })}
        loading={loading}
      />
      <StatCard
        icon={FilePen}
        color="var(--muted-foreground)"
        label={t('drafts')}
        value={all.filter((po) => po.status === 'draft').length}
        hint={t('draftsHint')}
        loading={loading}
      />
      <StatCard
        icon={Clock}
        color="var(--destructive)"
        label={t('overdue')}
        value={all.filter(isLatePo).length}
        hint={t('overdueHint')}
        loading={loading}
      />
      <StatCard
        icon={Timer}
        color="var(--success)"
        label={t('onTime')}
        value={received.length ? `${Math.round((onTime / received.length) * 100)}%` : '—'}
        hint={t('onTimeHint')}
        loading={loading}
      />
    </div>
  );
}

/** Purchase orders from draft to received, with status tabs, search and a create dialog. */
export default function PurchaseOrdersPage() {
  const { t } = useTranslation('inventory', { keyPrefix: 'purchaseOrders' });
  const orders = usePurchaseOrders();
  const columns = usePurchaseOrderColumns();
  const [params, setParams] = useSearchParams();

  const table = useDataTable<PurchaseOrder>({
    data: orders.data ?? EMPTY,
    columns,
    getRowId: (row) => row.id,
    globalFilterFn: 'includesString',
    initialState: { pagination: { pageIndex: 0, pageSize: 15 } },
  });
  const status =
    (
      table.state.columnFilters.find((f) => f.id === 'status')?.value as string[] | undefined
    )?.[0] ?? 'all';
  const countOf = (s: string) =>
    (orders.data ?? EMPTY).filter((po) => s === 'all' || po.status === s).length;

  const setCreating = (open: boolean) => setParams(open ? { new: '1' } : {}, { replace: true });

  return (
    <Page
      title={t('title')}
      description={t('description')}
      width="full"
      actions={
        <Button onClick={() => setCreating(true)}>
          <Plus /> {t('new')}
        </Button>
      }
    >
      {orders.isError ? (
        <ErrorPanel onRetry={() => void orders.refetch()} />
      ) : (
        <>
          <Kpis orders={orders.data} />
          <div className="space-y-3">
            <Tabs
              value={status}
              onValueChange={(value) =>
                table.getColumn('status')?.setFilterValue(value === 'all' ? undefined : [value])
              }
            >
              <TabsList
                aria-label={t('statusFilter')}
                className="scrollbar-none max-w-full justify-start overflow-x-auto"
              >
                {(['all', ...PO_STATUSES] as const).map((s) => (
                  <TabsTrigger key={s} value={s} className="gap-1.5">
                    {s === 'all' ? t('all') : t(`status.${s}`)}
                    <span className="text-xs text-muted-foreground tabular-nums">{countOf(s)}</span>
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
              loading={!orders.data}
              caption={t('title')}
              labels={{ emptyTitle: t('empty.title'), emptyDescription: t('empty.description') }}
            />
            <DataTablePagination table={table} />
          </div>
        </>
      )}
      <CreatePurchaseOrderDialog
        open={params.get('new') === '1'}
        onOpenChange={setCreating}
        supplierId={params.get('supplier') ?? undefined}
      />
    </Page>
  );
}
