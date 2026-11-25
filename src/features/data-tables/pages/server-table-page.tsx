import {
  functionalUpdate,
  type RowSelectionState,
  type SortingState,
  type Updater,
} from '@tanstack/react-table';
import { Download, Trash2, Truck } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { notify } from '@/core/notify/notify';
import { AdvancedFilterBuilder } from '@/shared/components/data-table/advanced-filter-builder';
import { exportTableToCsv } from '@/shared/components/data-table/csv';
import { DataTable } from '@/shared/components/data-table/data-table';
import { DataTableBulkBar } from '@/shared/components/data-table/data-table-bulk-bar';
import { DataTableDateRangeFilter } from '@/shared/components/data-table/data-table-date-range-filter';
import { DataTableFacetedFilter } from '@/shared/components/data-table/data-table-faceted-filter';
import { DataTableNumberRangeFilter } from '@/shared/components/data-table/data-table-number-range-filter';
import { DataTablePagination } from '@/shared/components/data-table/data-table-pagination';
import { DataTableSavedViews } from '@/shared/components/data-table/data-table-saved-views';
import {
  DataTableToolbar,
  type FilterChip,
} from '@/shared/components/data-table/data-table-toolbar';
import { DataTableViewOptions } from '@/shared/components/data-table/data-table-view-options';
import type { Density } from '@/shared/components/data-table/density';
import { DensityToggle } from '@/shared/components/data-table/density-toggle';
import { countActiveRules } from '@/shared/components/data-table/filter-tree';
import { useDataTable } from '@/shared/components/data-table/use-data-table';
import { useSavedViews } from '@/shared/components/data-table/use-saved-views';
import { formatDate } from '@/shared/lib/format';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { Button } from '@/shared/ui/button';

import { ordersQuery, useDeleteOrders, useOrders, useSetOrdersStatus } from '../api/orders-queries';
import { formatCurrency } from '../components/format';
import { useOrderColumns } from '../components/order-columns';
import { OrderDetailSheet } from '../components/order-detail-sheet';
import { useOrderFilterFields } from '../components/order-filter-fields';
import { TablesNav } from '../components/tables-nav';
import { useFilterTreeParam } from '../hooks/use-filter-tree-param';
import { useOrdersSearch } from '../hooks/use-orders-search';
import { useTableLabels } from '../hooks/use-table-labels';
import {
  ORDER_CHANNELS,
  ORDER_STATUSES,
  ordersSearchSchema,
  type Order,
  type OrderStatus,
} from '../model/order';

const EMPTY: Order[] = [];

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ request }) => {
    const params = new URL(request.url).searchParams;
    await queryClient.prefetchQuery(
      ordersQuery(ordersSearchSchema.parse(Object.fromEntries(params))),
    );
    return null;
  };

const parseSort = (sort: string): SortingState =>
  sort
    .split(',')
    .filter(Boolean)
    .map((part) => {
      const [id = '', dir] = part.split(':');
      return { id, desc: dir === 'desc' };
    });

const serializeSort = (sorting: SortingState) =>
  sorting.map((s) => `${s.id}:${s.desc ? 'desc' : 'asc'}`).join(',');

const csv = (value: string) => value.split(',').filter(Boolean);

/** Orders: every filter, sort and page change is a server request; state lives in the URL. */
export default function ServerTablePage() {
  const { t, i18n } = useTranslation('data-tables');
  const labels = useTableLabels();
  const fields = useOrderFilterFields();
  const { search, update, reset, query, setQuery } = useOrdersSearch();
  const orders = useOrders(search);
  const setStatus = useSetOrdersStatus();
  const removeOrders = useDeleteOrders();
  const savedViews = useSavedViews<string>('data-tables:orders');

  const [density, setDensity] = useState<Density>('default');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [viewing, setViewing] = useState<Order | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string[] | null>(null);

  const [tree, setTree] = useFilterTreeParam(
    search.filters,
    useCallback((filters: string) => update({ filters }), [update]),
    fields,
  );

  const sorting = useMemo(() => parseSort(search.sort), [search.sort]);
  const pagination = useMemo(
    () => ({ pageIndex: search.page - 1, pageSize: search.pageSize }),
    [search.page, search.pageSize],
  );

  const onView = useCallback((order: Order) => setViewing(order), []);
  const onSetStatus = useCallback(
    (ids: string[], status: OrderStatus) =>
      setStatus.mutate({ ids, status }, { onSuccess: () => setRowSelection({}) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mutate is stable
    [],
  );
  const onDelete = useCallback((ids: string[]) => setPendingDelete(ids), []);
  const columns = useOrderColumns({ onView, onSetStatus, onDelete });

  const table = useDataTable<Order>({
    mode: 'server',
    data: orders.data?.data ?? EMPTY,
    columns,
    rowCount: orders.data?.meta.total ?? 0,
    getRowId: (row) => row.id,
    enableGrouping: false,
    initialState: {
      columnPinning: { start: ['select', 'number'], end: ['actions'] },
    },
    state: { sorting, pagination, rowSelection },
    onSortingChange: (updater: Updater<SortingState>) =>
      update({ sort: serializeSort(functionalUpdate(updater, sorting)) }),
    onPaginationChange: (updater) => {
      const next = functionalUpdate(updater, pagination);
      update({ page: next.pageIndex + 1, pageSize: next.pageSize });
    },
    onRowSelectionChange: setRowSelection,
  });

  const facets = orders.data?.facets;
  const statusFilter = csv(search.status);
  const channelFilter = csv(search.channel);
  const advancedCount = countActiveRules(tree, fields);
  const money = (n: number) => formatCurrency(n, i18n.language);

  const chipCandidates: Array<FilterChip | false | ''> = [
    search.q && {
      id: 'q',
      label: t('chips.search', { value: search.q }),
      onRemove: () => update({ q: '' }),
    },
    statusFilter.length > 0 && {
      id: 'status',
      label: t('chips.status', {
        value: statusFilter.map((s) => t(`status.${s as OrderStatus}`)).join(', '),
      }),
      onRemove: () => update({ status: '' }),
    },
    channelFilter.length > 0 && {
      id: 'channel',
      label: t('chips.channel', {
        value: channelFilter.map((c) => t(`channel.${c as Order['channel']}`)).join(', '),
      }),
      onRemove: () => update({ channel: '' }),
    },
    (search.from || search.to) && {
      id: 'date',
      label: t('chips.date', {
        value: `${search.from ? formatDate(search.from, 'MMM D') : '…'} – ${search.to ? formatDate(search.to, 'MMM D, YYYY') : '…'}`,
      }),
      onRemove: () => update({ from: '', to: '' }),
    },
    (search.min || search.max) && {
      id: 'total',
      label: t('chips.total', {
        value: `${search.min ? money(Number(search.min)) : '…'} – ${search.max ? money(Number(search.max)) : '…'}`,
      }),
      onRemove: () => update({ min: '', max: '' }),
    },
    advancedCount > 0 && {
      id: 'filters',
      label: t('chips.filters', { count: advancedCount }),
      onRemove: () => update({ filters: '' }),
    },
  ];
  const chips = chipCandidates.filter((chip): chip is FilterChip => !!chip);

  const selectedIds = Object.keys(rowSelection);

  return (
    <Page title={t('title')} description={t('description')} width="full">
      <TablesNav />
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">{t('server.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('server.description')}</p>
      </div>

      <DataTableToolbar
        search={search.q}
        onSearchChange={(q) => update({ q })}
        searchPlaceholder={t('toolbar.search')}
        chips={chips}
        onReset={reset}
        resetLabel={t('toolbar.reset')}
        actions={
          <>
            <DataTableSavedViews
              views={savedViews.views}
              activeId={savedViews.views.find((v) => v.state === query)?.id}
              labels={labels.views}
              onApply={(view) => setQuery(new URLSearchParams(view.state), { replace: true })}
              onSave={(name) => {
                savedViews.save(name, query);
                notify.success(t('views.saved', { name }));
              }}
              onRemove={savedViews.remove}
            />
            <DataTableViewOptions
              table={table}
              label={t('toolbar.columns')}
              resetLabel={t('toolbar.reset')}
            />
            <DensityToggle value={density} onChange={setDensity} labels={labels.density} />
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportTableToCsv(table, { filename: `orders-page-${search.page}.csv` })
              }
            >
              <Download /> {t('toolbar.export')}
            </Button>
          </>
        }
      >
        <DataTableFacetedFilter
          title={t('columns.status')}
          value={statusFilter}
          onChange={(v) => update({ status: v.join(',') })}
          options={ORDER_STATUSES.map((s) => ({
            value: s,
            label: t(`status.${s}`),
            count: facets?.status[s] ?? 0,
          }))}
        />
        <DataTableFacetedFilter
          title={t('columns.channel')}
          value={channelFilter}
          onChange={(v) => update({ channel: v.join(',') })}
          options={ORDER_CHANNELS.map((c) => ({
            value: c,
            label: t(`channel.${c}`),
            count: facets?.channel[c] ?? 0,
          }))}
        />
        <DataTableDateRangeFilter
          title={t('toolbar.dateRange')}
          value={{ from: search.from || undefined, to: search.to || undefined }}
          onChange={({ from, to }) => update({ from: from ?? '', to: to ?? '' })}
          presets={labels.presets}
          clearLabel={labels.range.clear}
        />
        <DataTableNumberRangeFilter
          title={t('toolbar.total')}
          value={{
            min: search.min ? Number(search.min) : undefined,
            max: search.max ? Number(search.max) : undefined,
          }}
          onChange={({ min, max }) =>
            update({ min: min?.toString() ?? '', max: max?.toString() ?? '' })
          }
          format={money}
          labels={labels.range}
        />
        <AdvancedFilterBuilder
          fields={fields}
          value={tree}
          onChange={setTree}
          labels={labels.filterBuilder}
        />
      </DataTableToolbar>

      <DataTable
        table={table}
        density={density}
        reorderableColumns
        maxHeight="calc(100svh - 20rem)"
        caption={t('server.title')}
        loading={orders.isPending}
        refreshing={orders.isPlaceholderData}
        error={orders.isError ? t('error.title') : undefined}
        onRetry={() => void orders.refetch()}
        onRowClick={(row) => setViewing(row.original)}
        labels={{
          emptyTitle: t('empty.title'),
          emptyDescription: t('empty.description'),
          retry: t('error.retry'),
        }}
      />

      <DataTablePagination table={table} labels={labels.pagination} pageSizes={[10, 20, 50, 100]} />

      <DataTableBulkBar
        count={selectedIds.length}
        onClear={() => setRowSelection({})}
        label={(count) => t('bulk.selected', { count })}
        clearLabel={t('bulk.clear')}
      >
        <Button
          variant="ghost"
          size="sm"
          disabled={setStatus.isPending}
          onClick={() => onSetStatus(selectedIds, 'shipped')}
        >
          <Truck /> {t('bulk.markShipped')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            exportTableToCsv(table, { filename: 'orders-selection.csv', selectedOnly: true });
            notify.success(t('toast.exported', { count: selectedIds.length }));
          }}
        >
          <Download /> {t('bulk.export')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => setPendingDelete(selectedIds)}
        >
          <Trash2 /> {t('bulk.delete')}
        </Button>
      </DataTableBulkBar>

      <OrderDetailSheet order={viewing} onOpenChange={(open) => !open && setViewing(null)} />

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('bulk.confirmTitle', { count: pendingDelete?.length ?? 0 })}
            </AlertDialogTitle>
            <AlertDialogDescription>{t('bulk.confirmDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('bulk.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (!pendingDelete) return;
                removeOrders.mutate(pendingDelete, {
                  onSuccess: () => {
                    setRowSelection({});
                    setPendingDelete(null);
                  },
                });
              }}
            >
              {t('bulk.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
}
