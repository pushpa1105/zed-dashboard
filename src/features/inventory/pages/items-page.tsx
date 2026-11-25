import { Download, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { notify } from '@/core/notify/notify';
import { useNavigate, useSearchParams } from '@/core/router/router';
import { exportTableToCsv } from '@/shared/components/data-table/csv';
import { DataTable } from '@/shared/components/data-table/data-table';
import { DataTableBulkBar } from '@/shared/components/data-table/data-table-bulk-bar';
import { DataTableFacetedFilter } from '@/shared/components/data-table/data-table-faceted-filter';
import { DataTablePagination } from '@/shared/components/data-table/data-table-pagination';
import {
  DataTableToolbar,
  type FilterChip,
} from '@/shared/components/data-table/data-table-toolbar';
import { DataTableViewOptions } from '@/shared/components/data-table/data-table-view-options';
import type { Density } from '@/shared/components/data-table/density';
import { DensityToggle } from '@/shared/components/data-table/density-toggle';
import { useDataTable } from '@/shared/components/data-table/use-data-table';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

import { itemsQuery, useItems } from '../api/inventory-api';
import { AdjustStockDialog } from '../components/adjust-stock-dialog';
import { ErrorPanel } from '../components/error-panel';
import { useItemColumns } from '../components/item-columns';
import { qty, usd } from '../lib/format';
import {
  STOCK_STATUSES,
  WAREHOUSE_CODES,
  type ItemRow,
  type StockStatus,
} from '../model/inventory';
import { inventoryRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ request }) => {
    const warehouse = new URL(request.url).searchParams.get('warehouse') ?? undefined;
    await queryClient.prefetchQuery(itemsQuery(warehouse));
    return null;
  };

const EMPTY: ItemRow[] = [];

/**
 * Stock table: every SKU with on hand / reserved / available, filterable by
 * category and stock status, pinnable columns, bulk stock adjustments.
 */
export default function ItemsPage() {
  const { t } = useTranslation('inventory', { keyPrefix: 'items' });
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const warehouse = params.get('warehouse') ?? undefined;
  const items = useItems(warehouse);
  const columns = useItemColumns();
  const [density, setDensity] = useState<Density>('default');
  const [adjusting, setAdjusting] = useState(false);
  const initialStatus = params.get('status');

  const table = useDataTable<ItemRow>({
    data: items.data ?? EMPTY,
    columns,
    getRowId: (row) => row.sku,
    globalFilterFn: 'includesString',
    initialState: {
      columnPinning: { start: ['select', 'sku'], end: [] },
      columnVisibility: { unitCost: false, lastMovement: false, reserved: false, location: false },
      columnFilters:
        initialStatus && STOCK_STATUSES.includes(initialStatus as StockStatus)
          ? [{ id: 'status', value: initialStatus === 'low' ? ['low', 'out'] : [initialStatus] }]
          : [],
      pagination: { pageIndex: 0, pageSize: 20 },
      sorting: [{ id: 'available', desc: false }],
    },
  });

  const { globalFilter, columnFilters, rowSelection } = table.state;
  const filterOf = (id: string) =>
    (columnFilters.find((f) => f.id === id)?.value as string[]) ?? [];
  const categoryFilter = filterOf('category');
  const statusFilter = filterOf('status');
  const categoryCounts = table.getColumn('category')?.getFacetedUniqueValues();
  const statusCounts = table.getColumn('status')?.getFacetedUniqueValues();
  const categories = useMemo(
    () => [...new Set((items.data ?? []).map((i) => i.category))].sort(),
    [items.data],
  );
  const selected = Object.keys(rowSelection);
  const filtered = table.getFilteredRowModel().rows;
  const filteredValue = filtered.reduce((s, r) => s + r.original.onHand * r.original.unitCost, 0);

  const chips: FilterChip[] = [
    ...categoryFilter.map((c) => ({
      id: `category:${c}`,
      label: c,
      onRemove: () =>
        table
          .getColumn('category')
          ?.setFilterValue(
            categoryFilter.filter((x) => x !== c).length
              ? categoryFilter.filter((x) => x !== c)
              : undefined,
          ),
    })),
    ...statusFilter.map((s) => ({
      id: `status:${s}`,
      label: t(`statusLabel.${s as StockStatus}`),
      onRemove: () =>
        table
          .getColumn('status')
          ?.setFilterValue(
            statusFilter.filter((x) => x !== s).length
              ? statusFilter.filter((x) => x !== s)
              : undefined,
          ),
    })),
  ];

  return (
    <Page
      title={t('title')}
      description={
        items.data
          ? t('description', { count: filtered.length, value: usd(filteredValue) })
          : t('loading')
      }
      width="full"
      actions={
        <Select
          value={warehouse ?? 'all'}
          onValueChange={(value) => {
            const next = new URLSearchParams(params);
            if (value === 'all') next.delete('warehouse');
            else next.set('warehouse', value);
            setParams(next, { replace: true });
          }}
        >
          <SelectTrigger className="w-56" aria-label={t('warehouse')}>
            <span className="text-muted-foreground">{t('warehouse')}:</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="all">{t('allWarehouses')}</SelectItem>
            {WAREHOUSE_CODES.map((code) => (
              <SelectItem key={code} value={code}>
                {code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      {items.isError ? (
        <ErrorPanel onRetry={() => void items.refetch()} />
      ) : (
        <div className="space-y-3">
          <DataTableToolbar
            search={(globalFilter as string | undefined) ?? ''}
            onSearchChange={(value) => table.setGlobalFilter(value)}
            searchPlaceholder={t('search')}
            chips={chips}
            onReset={() => {
              table.resetGlobalFilter();
              table.resetColumnFilters();
            }}
            resetLabel={t('reset')}
            actions={
              <>
                <DataTableViewOptions
                  table={table}
                  label={t('columnsButton')}
                  resetLabel={t('reset')}
                />
                <DensityToggle
                  value={density}
                  onChange={setDensity}
                  labels={{
                    compact: t('density.compact'),
                    default: t('density.default'),
                    comfortable: t('density.comfortable'),
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    exportTableToCsv(table, { filename: 'inventory-items.csv' });
                    notify.success(t('exported', { count: filtered.length }));
                  }}
                >
                  <Download /> {t('export')}
                </Button>
              </>
            }
          >
            <DataTableFacetedFilter
              title={t('columns.category')}
              value={categoryFilter}
              onChange={(value) =>
                table.getColumn('category')?.setFilterValue(value.length ? value : undefined)
              }
              options={categories.map((c) => ({
                value: c,
                label: c,
                count: categoryCounts?.get(c) ?? 0,
              }))}
            />
            <DataTableFacetedFilter
              title={t('columns.status')}
              value={statusFilter}
              onChange={(value) =>
                table.getColumn('status')?.setFilterValue(value.length ? value : undefined)
              }
              options={STOCK_STATUSES.map((s) => ({
                value: s,
                label: t(`statusLabel.${s}`),
                count: statusCounts?.get(s) ?? 0,
              }))}
            />
          </DataTableToolbar>

          <DataTable
            table={table}
            density={density}
            loading={!items.data}
            refreshing={items.isPlaceholderData}
            reorderableColumns
            caption={t('title')}
            onRowClick={(row) =>
              void navigate(inventoryRoutes.item.href({ sku: row.original.sku }))
            }
            labels={{ emptyTitle: t('empty.title'), emptyDescription: t('empty.description') }}
          />
          <DataTablePagination table={table} />
        </div>
      )}

      <DataTableBulkBar
        count={selected.length}
        onClear={() => table.resetRowSelection()}
        label={(count) => t('bulk.selected', { count })}
        clearLabel={t('bulk.clear')}
      >
        <Button variant="ghost" size="sm" onClick={() => setAdjusting(true)}>
          <SlidersHorizontal /> {t('bulk.adjust')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            exportTableToCsv(table, { filename: 'inventory-selection.csv', selectedOnly: true })
          }
        >
          <Download /> {t('export')}
        </Button>
      </DataTableBulkBar>

      <AdjustStockDialog
        open={adjusting}
        onOpenChange={setAdjusting}
        skus={selected}
        defaultWarehouse={warehouse ?? 'RNO'}
        onDone={(count) => {
          table.resetRowSelection();
          notify.success(t('adjust.done', { count, units: qty(count) }));
        }}
      />
    </Page>
  );
}
