import {
  aggregationFn_count,
  aggregationFn_max,
  aggregationFn_mean,
  aggregationFn_min,
  aggregationFn_sum,
  columnFacetingFeature,
  columnFilteringFeature,
  columnGroupingFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createExpandedRowModel,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createGroupedRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_arrIncludesSome,
  filterFn_includesString,
  filterFn_inNumberRange,
  globalFilteringFeature,
  metaHelper,
  rowAggregationFeature,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
} from '@tanstack/react-table';
import type {
  ReactTable,
  Cell,
  Column,
  ColumnDef,
  Header,
  Row,
  TableState,
} from '@tanstack/react-table';

/** Per-column metadata understood by the data-table kit. */
export type DataTableColumnMeta = {
  /** Human label (menus, CSV headers, filter builder). Falls back to the column id. */
  label?: string;
  /** Horizontal alignment of header and cells. */
  align?: 'start' | 'center' | 'end';
  /** Extra classes for every body cell of the column. */
  cellClassName?: string;
};

/**
 * The single feature registry shared by every data table. It registers all
 * features the kit renders (sorting, filtering, faceting, grouping,
 * aggregation, expanding, pagination, selection, pinning, sizing, resizing,
 * ordering, visibility). In server mode the `manual*` flags bypass the client
 * row models, so one registry serves both modes.
 */
export const dataTableFeatures = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: {
    includesString: filterFn_includesString,
    inNumberRange: filterFn_inNumberRange,
    arrIncludesSome: filterFn_arrIncludesSome,
  },
  columnFacetingFeature,
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  columnGroupingFeature,
  groupedRowModel: createGroupedRowModel(),
  rowAggregationFeature,
  aggregationFns: {
    sum: aggregationFn_sum,
    mean: aggregationFn_mean,
    count: aggregationFn_count,
    min: aggregationFn_min,
    max: aggregationFn_max,
  },
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    basic: sortFn_basic,
    datetime: sortFn_datetime,
    text: sortFn_text,
  },
  rowExpandingFeature,
  expandedRowModel: createExpandedRowModel(),
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  rowSelectionFeature,
  columnVisibilityFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnSizingFeature,
  columnResizingFeature,
  columnMeta: metaHelper<DataTableColumnMeta>(),
});

export type DataTableFeatures = typeof dataTableFeatures;
export type DataTableState = TableState<DataTableFeatures>;
export type DataTableInstance<TData extends object> = ReactTable<DataTableFeatures, TData>;
export type DataTableColumn<TData extends object> = Column<DataTableFeatures, TData, unknown>;
export type DataTableRow<TData extends object> = Row<DataTableFeatures, TData>;
export type DataTableHeader<TData extends object> = Header<DataTableFeatures, TData, unknown>;
export type DataTableCell<TData extends object> = Cell<DataTableFeatures, TData, unknown>;

/** Column definitions as produced by `helper.columns([...])`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- mirrors ColumnHelper.columns(), which keeps per-column value types
export type DataTableColumnDef<TData extends object> = ColumnDef<DataTableFeatures, TData, any>;

/** Typed column helper bound to the kit's feature registry. */
export const createDataTableColumnHelper = <TData extends object>() =>
  createColumnHelper<DataTableFeatures, TData>();

/** Label for a column: `meta.label`, a string header, or the id. */
export function getColumnLabel<TData extends object, TValue = unknown>(
  column: Column<DataTableFeatures, TData, TValue>,
): string {
  const header = column.columnDef.header;
  return column.columnDef.meta?.label ?? (typeof header === 'string' ? header : column.id);
}
