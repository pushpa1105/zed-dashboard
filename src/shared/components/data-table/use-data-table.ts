import { useTable, type TableOptions } from '@tanstack/react-table';

import { dataTableFeatures, type DataTableFeatures, type DataTableInstance } from './features';

export type UseDataTableOptions<TData extends object> = Omit<
  TableOptions<DataTableFeatures, TData>,
  'features'
> & {
  /**
   * `client` (default): the table sorts, filters, groups and paginates `data`.
   * `server`: `data` is already the current page; sorting, filtering and
   * pagination state are only reported (put them in your request) and
   * `rowCount` must be the server total.
   */
  mode?: 'client' | 'server';
};

/**
 * Creates a table instance on the kit's feature registry with sensible
 * defaults (live column resizing, pinning, multi-sort with shift-click).
 *
 * Every state slice is uncontrolled by default. Control any slice by passing
 * it in `state` together with its `on<Slice>Change` updater, e.g.
 * `state: { pagination }, onPaginationChange: setPagination`.
 *
 * Keep `data` and `columns` referentially stable (module constants, state or
 * `useMemo`); a new array on every render invalidates the row models.
 */
export function useDataTable<TData extends object>({
  mode = 'client',
  ...options
}: UseDataTableOptions<TData>): DataTableInstance<TData> {
  const server = mode === 'server';
  return useTable({
    features: dataTableFeatures,
    columnResizeMode: 'onChange',
    columnResizeDirection: 'ltr',
    enableColumnPinning: true,
    enableMultiSort: true,
    ...(server ? { manualPagination: true, manualSorting: true, manualFiltering: true } : {}),
    ...options,
  } as TableOptions<DataTableFeatures, TData>);
}
