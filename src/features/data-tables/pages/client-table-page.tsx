import type {
  ColumnOrderState,
  ColumnPinningState,
  ColumnVisibilityState,
  GroupingState,
  SortingState,
} from '@tanstack/react-table';
import { ChevronsDownUp, ChevronsUpDown, Download } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { notify } from '@/core/notify/notify';
import { AdvancedFilterBuilder } from '@/shared/components/data-table/advanced-filter-builder';
import { exportTableToCsv } from '@/shared/components/data-table/csv';
import { DataTable } from '@/shared/components/data-table/data-table';
import { DataTableBulkBar } from '@/shared/components/data-table/data-table-bulk-bar';
import { DataTableFacetedFilter } from '@/shared/components/data-table/data-table-faceted-filter';
import { DataTableSavedViews } from '@/shared/components/data-table/data-table-saved-views';
import {
  DataTableToolbar,
  type FilterChip,
} from '@/shared/components/data-table/data-table-toolbar';
import { DataTableViewOptions } from '@/shared/components/data-table/data-table-view-options';
import type { Density } from '@/shared/components/data-table/density';
import { DensityToggle } from '@/shared/components/data-table/density-toggle';
import {
  applyFilterTree,
  countActiveRules,
  createFilterGroup,
  type FilterField,
  type FilterGroup,
} from '@/shared/components/data-table/filter-tree';
import { useDataTable } from '@/shared/components/data-table/use-data-table';
import { useSavedViews } from '@/shared/components/data-table/use-saved-views';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

import { formatCurrency, formatNumber } from '../components/format';
import { TablesNav } from '../components/tables-nav';
import { useTransactionColumns } from '../components/transaction-columns';
import { useTableLabels } from '../hooks/use-table-labels';
import { ORDER_CHANNELS, ORDER_COUNTRIES, ORDER_STATUSES, type OrderStatus } from '../model/order';
import { generateTransactions, type Transaction } from '../model/transaction';

const ROW_COUNT = 10_000;
const GROUPABLE = ['status', 'channel', 'country'] as const;

type ViewState = {
  sorting: SortingState;
  columnVisibility: ColumnVisibilityState;
  columnOrder: ColumnOrderState;
  columnPinning: ColumnPinningState;
  grouping: GroupingState;
  filters: FilterGroup;
  density: Density;
};

/** 10,000 rows held in the browser: everything runs client-side, rows are virtualized. */
export default function ClientTablePage() {
  const { t, i18n } = useTranslation('data-tables');
  const labels = useTableLabels();
  const savedViews = useSavedViews<ViewState>('data-tables:transactions');

  const [rows, setRows] = useState(() => generateTransactions(ROW_COUNT));
  const [tree, setTree] = useState<FilterGroup>(() => createFilterGroup());
  const [density, setDensity] = useState<Density>('compact');
  const [activeView, setActiveView] = useState<string | null>(null);

  const fields = useMemo<FilterField[]>(
    () => [
      { id: 'reference', label: t('columns.reference'), type: 'text' },
      { id: 'customer', label: t('columns.customer'), type: 'text' },
      {
        id: 'status',
        label: t('columns.status'),
        type: 'enum',
        options: ORDER_STATUSES.map((s) => ({ value: s, label: t(`status.${s}`) })),
      },
      {
        id: 'channel',
        label: t('columns.channel'),
        type: 'enum',
        options: ORDER_CHANNELS.map((c) => ({ value: c, label: t(`channel.${c}`) })),
      },
      {
        id: 'country',
        label: t('columns.country'),
        type: 'enum',
        options: ORDER_COUNTRIES.map((c) => ({ value: c, label: c })),
      },
      { id: 'amount', label: t('columns.amount'), type: 'number' },
      { id: 'quantity', label: t('columns.quantity'), type: 'number' },
      { id: 'date', label: t('columns.date'), type: 'date' },
      { id: 'notes', label: t('columns.notes'), type: 'text' },
    ],
    [t],
  );

  const data = useMemo(() => applyFilterTree(rows, tree, fields), [rows, tree, fields]);

  const onEdit = useCallback((id: string, patch: Partial<Transaction>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }, []);
  const columns = useTransactionColumns(onEdit);

  const table = useDataTable<Transaction>({
    data,
    columns,
    getRowId: (row) => row.id,
    // Show every row: the virtualizer renders only what is on screen.
    manualPagination: true,
    globalFilterFn: 'includesString',
    autoResetExpanded: false,
    initialState: {
      columnPinning: { start: ['select', 'reference'], end: [] },
      sorting: [{ id: 'date', desc: true }],
    },
  });

  const { grouping, globalFilter, columnFilters, rowSelection } = table.state;
  const statusColumn = table.getColumn('status');
  const statusFilter = (columnFilters.find((f) => f.id === 'status')?.value as string[]) ?? [];
  const statusCounts = statusColumn?.getFacetedUniqueValues();
  const filteredRows = table.getFilteredRowModel().rows;
  const totalAmount = filteredRows.reduce((sum, row) => sum + row.original.amount, 0);
  const advancedCount = countActiveRules(tree, fields);
  const selectedCount = Object.keys(rowSelection).length;

  const chipCandidates: Array<FilterChip | false> = [
    statusFilter.length > 0 && {
      id: 'status',
      label: t('chips.status', {
        value: statusFilter.map((s) => t(`status.${s as OrderStatus}`)).join(', '),
      }),
      onRemove: () => statusColumn?.setFilterValue(undefined),
    },
    advancedCount > 0 && {
      id: 'filters',
      label: t('chips.filters', { count: advancedCount }),
      onRemove: () => setTree(createFilterGroup()),
    },
  ];
  const chips = chipCandidates.filter((c): c is FilterChip => !!c);

  const currentView = (): ViewState => ({
    sorting: table.state.sorting,
    columnVisibility: table.state.columnVisibility,
    columnOrder: table.state.columnOrder,
    columnPinning: table.state.columnPinning,
    grouping,
    filters: tree,
    density,
  });

  const applyView = (state: ViewState) => {
    table.setSorting(state.sorting);
    table.setColumnVisibility(state.columnVisibility);
    table.setColumnOrder(state.columnOrder);
    table.setColumnPinning(state.columnPinning);
    table.setGrouping(state.grouping);
    setTree(state.filters);
    setDensity(state.density);
  };

  return (
    <Page title={t('title')} description={t('description')} width="full">
      <TablesNav />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">{t('client.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('client.description')}</p>
        </div>
        <p className="text-sm text-muted-foreground tabular-nums">
          {t('client.summary', {
            rows: formatNumber(filteredRows.length, i18n.language),
            amount: formatCurrency(totalAmount, i18n.language),
          })}
        </p>
      </div>

      <DataTableToolbar
        search={(globalFilter as string | undefined) ?? ''}
        onSearchChange={(value) => table.setGlobalFilter(value)}
        searchPlaceholder={t('toolbar.searchRows')}
        chips={chips}
        onReset={() => {
          table.resetGlobalFilter();
          table.resetColumnFilters();
          setTree(createFilterGroup());
        }}
        resetLabel={t('toolbar.reset')}
        actions={
          <>
            <DataTableSavedViews
              views={savedViews.views}
              activeId={activeView}
              labels={labels.views}
              onApply={(view) => {
                applyView(view.state);
                setActiveView(view.id);
              }}
              onSave={(name) => {
                setActiveView(savedViews.save(name, currentView()).id);
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
              onClick={() => {
                exportTableToCsv(table, { filename: 'transactions.csv' });
                notify.success(t('toast.exported', { count: filteredRows.length }));
              }}
            >
              <Download /> {t('toolbar.export')}
            </Button>
          </>
        }
      >
        <DataTableFacetedFilter
          title={t('columns.status')}
          value={statusFilter}
          onChange={(value) => statusColumn?.setFilterValue(value.length ? value : undefined)}
          options={ORDER_STATUSES.map((s) => ({
            value: s,
            label: t(`status.${s}`),
            count: statusCounts?.get(s) ?? 0,
          }))}
        />
        <AdvancedFilterBuilder
          fields={fields}
          value={tree}
          onChange={setTree}
          labels={labels.filterBuilder}
        />
        <Select
          value={grouping[0] ?? 'none'}
          onValueChange={(value) => table.setGrouping(value === 'none' ? [] : [value])}
        >
          <SelectTrigger size="sm" className="w-44" aria-label={t('client.groupBy')}>
            <span className="text-muted-foreground">{t('client.groupBy')}:</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t('client.groupNone')}</SelectItem>
            {GROUPABLE.map((id) => (
              <SelectItem key={id} value={id}>
                {t(`columns.${id}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {grouping.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.toggleAllRowsExpanded(!table.getIsSomeRowsExpanded())}
          >
            {table.getIsSomeRowsExpanded() ? <ChevronsDownUp /> : <ChevronsUpDown />}
            {table.getIsSomeRowsExpanded() ? t('client.collapseAll') : t('client.expandAll')}
          </Button>
        )}
      </DataTableToolbar>

      <DataTable
        table={table}
        density={density}
        striped
        virtualized
        reorderableColumns
        maxHeight="calc(100svh - 19rem)"
        caption={t('client.title')}
        labels={{ emptyTitle: t('empty.title'), emptyDescription: t('empty.description') }}
      />

      <DataTableBulkBar
        count={selectedCount}
        onClear={() => table.resetRowSelection()}
        label={(count) => t('bulk.selected', { count })}
        clearLabel={t('bulk.clear')}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            exportTableToCsv(table, { filename: 'transactions-selection.csv', selectedOnly: true })
          }
        >
          <Download /> {t('bulk.export')}
        </Button>
      </DataTableBulkBar>
    </Page>
  );
}
