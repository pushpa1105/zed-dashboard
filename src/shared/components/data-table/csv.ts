import { getColumnLabel, type DataTableInstance } from './features';

const escape = (value: unknown) => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Serializes rows to CSV (RFC 4180 quoting). */
export function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map((r) => r.map(escape).join(',')).join('\r\n');
}

/** Triggers a browser download of `content`. */
export function downloadFile(filename: string, content: string, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob(['﻿', content], { type }));
  const link = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Exports the visible data columns of a table. By default every filtered and
 * sorted row (not only the current page); `selectedOnly` restricts it to the
 * selection.
 */
export function exportTableToCsv<TData extends object>(
  table: DataTableInstance<TData>,
  {
    filename = 'export.csv',
    selectedOnly = false,
  }: { filename?: string; selectedOnly?: boolean } = {},
) {
  const columns = table.getVisibleLeafColumns().filter((c) => c.accessorFn);
  const model = selectedOnly ? table.getSelectedRowModel() : table.getSortedRowModel();
  const rows = model.flatRows.filter((row) => !row.getIsGrouped());
  const csv = toCsv(
    columns.map((c) => getColumnLabel(c)),
    rows.map((row) => columns.map((c) => row.getValue(c.id))),
  );
  downloadFile(filename, csv);
}
