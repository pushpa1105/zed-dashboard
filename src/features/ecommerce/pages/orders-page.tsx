import {
  functionalUpdate,
  type RowSelectionState,
  type SortingState,
  type Updater,
} from '@tanstack/react-table';
import { Ban, Download, PackageCheck, Truck } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { useNavigate, useSearchParams } from '@/core/router/router';
import { createSelectColumn } from '@/shared/components/data-table/column-factories';
import { exportTableToCsv } from '@/shared/components/data-table/csv';
import { DataTable } from '@/shared/components/data-table/data-table';
import { DataTableBulkBar } from '@/shared/components/data-table/data-table-bulk-bar';
import { DataTableColumnHeader } from '@/shared/components/data-table/data-table-column-header';
import { DataTableFacetedFilter } from '@/shared/components/data-table/data-table-faceted-filter';
import { DataTablePagination } from '@/shared/components/data-table/data-table-pagination';
import { DataTableToolbar } from '@/shared/components/data-table/data-table-toolbar';
import { DataTableViewOptions } from '@/shared/components/data-table/data-table-view-options';
import { createDataTableColumnHelper } from '@/shared/components/data-table/features';
import { useDataTable } from '@/shared/components/data-table/use-data-table';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { formatDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';

import { ordersQuery, useOrders, useSetOrderStatus } from '../api/store-api';
import { CountTabs } from '../components/count-tabs';
import { OrderStatusBadge, PaymentBadge } from '../components/store-badges';
import { formatMoney } from '../lib/money';
import {
  ORDER_CHANNELS,
  ORDER_TABS,
  ordersSearchSchema,
  PAYMENT_STATES,
  type OrderSummary,
  type OrdersSearch,
} from '../model/store';
import { ecommerceRoutes } from '../routes';

const EMPTY: OrderSummary[] = [];
const helper = createDataTableColumnHelper<OrderSummary>();

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ request }) => {
    const params = Object.fromEntries(new URL(request.url).searchParams);
    await queryClient.prefetchQuery(ordersQuery(ordersSearchSchema.parse(params)));
    return null;
  };

const csv = (value: string) => value.split(',').filter(Boolean);

/** Orders list: status tabs with live counts, server-side search/filter/sort, bulk actions. */
export default function OrdersPage() {
  const { t, i18n } = useTranslation('ecommerce');
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const search = useMemo(() => ordersSearchSchema.parse(Object.fromEntries(params)), [params]);
  const orders = useOrders(search);
  const setStatus = useSetOrderStatus();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const update = (patch: Partial<OrdersSearch>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries({ page: 1, ...patch })) {
          if (value === '' || value === undefined || (key === 'status' && value === 'all')) {
            next.delete(key);
          } else next.set(key, String(value));
        }
        return next;
      },
      { replace: true },
    );

  const sorting = useMemo<SortingState>(() => {
    const [id = 'createdAt', dir] = search.sort.split(':');
    return [{ id, desc: dir !== 'asc' }];
  }, [search.sort]);
  const pagination = { pageIndex: search.page - 1, pageSize: search.pageSize };

  const columns = useMemo(
    () =>
      helper.columns([
        createSelectColumn<OrderSummary>({ label: t('orders.select') }),
        helper.accessor('number', {
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t('orders.col.order')} />
          ),
          meta: { label: t('orders.col.order') },
          size: 100,
          cell: (info) => <span className="font-medium tabular-nums">{info.getValue()}</span>,
        }),
        helper.accessor('createdAt', {
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t('orders.col.date')} />
          ),
          meta: { label: t('orders.col.date') },
          size: 150,
          cell: (info) => (
            <span className="text-muted-foreground tabular-nums">
              {formatDate(info.getValue(), 'MMM D, h:mm A')}
            </span>
          ),
        }),
        helper.accessor('customerName', {
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t('orders.col.customer')} />
          ),
          meta: { label: t('orders.col.customer') },
          size: 230,
          cell: ({ row }) => (
            <div className="flex min-w-0 items-center gap-2.5">
              <InitialsAvatar name={row.original.customerName} size="xs" />
              <div className="min-w-0 leading-tight">
                <p className="truncate font-medium">{row.original.customerName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {row.original.customerEmail}
                </p>
              </div>
            </div>
          ),
        }),
        helper.accessor('channel', {
          header: () => t('orders.col.channel'),
          enableSorting: false,
          meta: { label: t('orders.col.channel') },
          size: 130,
          cell: (info) => (
            <span className="text-muted-foreground">{t(`channel.${info.getValue()}`)}</span>
          ),
        }),
        helper.accessor('payment', {
          header: () => t('orders.col.payment'),
          enableSorting: false,
          meta: { label: t('orders.col.payment') },
          size: 160,
          cell: (info) => <PaymentBadge payment={info.getValue()} />,
        }),
        helper.accessor('status', {
          header: () => t('orders.col.fulfilment'),
          enableSorting: false,
          meta: { label: t('orders.col.fulfilment') },
          size: 140,
          cell: (info) => <OrderStatusBadge status={info.getValue()} />,
        }),
        helper.accessor('itemCount', {
          header: () => t('orders.col.items'),
          enableSorting: false,
          meta: { label: t('orders.col.items'), align: 'end' },
          size: 80,
        }),
        helper.accessor('total', {
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t('orders.col.total')} />
          ),
          meta: { label: t('orders.col.total'), align: 'end' },
          size: 120,
          cell: (info) => (
            <span className="font-medium tabular-nums">
              {formatMoney(info.getValue(), i18n.language)}
            </span>
          ),
        }),
      ]),
    [t, i18n.language],
  );

  const table = useDataTable<OrderSummary>({
    mode: 'server',
    data: orders.data?.data ?? EMPTY,
    columns,
    rowCount: orders.data?.meta.total ?? 0,
    getRowId: (row) => row.id,
    enableGrouping: false,
    initialState: { columnPinning: { start: ['select', 'number'], end: [] } },
    state: { sorting, pagination, rowSelection },
    onSortingChange: (updater: Updater<SortingState>) => {
      const [first] = functionalUpdate(updater, sorting);
      update({ sort: first ? `${first.id}:${first.desc ? 'desc' : 'asc'}` : '' });
    },
    onPaginationChange: (updater) => {
      const next = functionalUpdate(updater, pagination);
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          p.set('page', String(next.pageIndex + 1));
          p.set('pageSize', String(next.pageSize));
          return p;
        },
        { replace: true },
      );
    },
    onRowSelectionChange: setRowSelection,
  });

  const counts = orders.data?.counts;
  const selectedIds = Object.keys(rowSelection);
  const bulk = (status: 'processing' | 'shipped' | 'cancelled') =>
    setStatus.mutate({ ids: selectedIds, status }, { onSuccess: () => setRowSelection({}) });

  return (
    <Page
      width="full"
      title={t('orders.title')}
      description={t('orders.description')}
      actions={
        <Button
          variant="outline"
          onClick={() => exportTableToCsv(table, { filename: `orders-${search.status}.csv` })}
        >
          <Download /> {t('orders.export')}
        </Button>
      }
    >
      <div className="space-y-4">
        <CountTabs
          value={search.status}
          onChange={(status) => {
            setRowSelection({});
            update({ status });
          }}
          tabs={ORDER_TABS.map((tab) => ({
            value: tab,
            label: t(`orders.tabs.${tab}`),
            count: counts?.[tab],
          }))}
        />

        <DataTableToolbar
          search={search.q}
          onSearchChange={(q) => update({ q })}
          searchPlaceholder={t('orders.search')}
          onReset={() => setParams(new URLSearchParams(), { replace: true })}
          resetLabel={t('orders.reset')}
          actions={<DataTableViewOptions table={table} label={t('orders.columns')} />}
        >
          <DataTableFacetedFilter
            title={t('orders.col.channel')}
            value={csv(search.channel)}
            onChange={(v) => update({ channel: v.join(',') })}
            options={ORDER_CHANNELS.map((c) => ({ value: c, label: t(`channel.${c}`) }))}
          />
          <DataTableFacetedFilter
            title={t('orders.col.payment')}
            value={csv(search.payment)}
            onChange={(v) => update({ payment: v.join(',') })}
            options={PAYMENT_STATES.map((p) => ({ value: p, label: t(`payment.${p}`) }))}
          />
        </DataTableToolbar>

        <DataTable
          table={table}
          caption={t('orders.title')}
          loading={orders.isPending}
          refreshing={orders.isPlaceholderData}
          error={orders.isError ? t('common.error') : undefined}
          onRetry={() => void orders.refetch()}
          onRowClick={(row) =>
            void navigate(ecommerceRoutes.order.href({ orderId: row.original.id }))
          }
          labels={{
            emptyTitle: t('orders.empty.title'),
            emptyDescription: t('orders.empty.description'),
          }}
        />
        <DataTablePagination table={table} pageSizes={[10, 20, 50]} />
      </div>

      <DataTableBulkBar
        count={selectedIds.length}
        onClear={() => setRowSelection({})}
        label={(count) => t('orders.bulk.selected', { count })}
        clearLabel={t('orders.bulk.clear')}
      >
        <Button
          variant="ghost"
          size="sm"
          disabled={setStatus.isPending}
          onClick={() => bulk('processing')}
        >
          <PackageCheck /> {t('orders.bulk.process')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={setStatus.isPending}
          onClick={() => bulk('shipped')}
        >
          <Truck /> {t('orders.bulk.ship')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          disabled={setStatus.isPending}
          onClick={() => bulk('cancelled')}
        >
          <Ban /> {t('orders.bulk.cancel')}
        </Button>
      </DataTableBulkBar>
    </Page>
  );
}
