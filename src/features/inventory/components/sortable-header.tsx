import type { Column } from '@tanstack/react-table';

import { DataTableColumnHeader } from '@/shared/components/data-table/data-table-column-header';
import type { DataTableFeatures } from '@/shared/components/data-table/features';

/** Header + meta for a sortable data-table column; the title doubles as menu/CSV label. */
export function sortable(title: string, align?: 'end') {
  return {
    header: <TData extends object, TValue>({
      column,
    }: {
      column: Column<DataTableFeatures, TData, TValue>;
    }) => <DataTableColumnHeader column={column} title={title} />,
    meta: { label: title, align },
  };
}
