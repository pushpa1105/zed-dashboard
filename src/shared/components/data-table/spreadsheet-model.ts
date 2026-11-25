/**
 * Pure helpers behind <Spreadsheet>: cell types, range math, TSV copy/paste
 * and value coercion. No React here, so they are easy to test.
 */

export type SheetCellType = 'text' | 'number' | 'select' | 'date' | 'checkbox' | 'formula';

export type SheetRow = Record<string, unknown>;

export type SheetColumn<Row extends SheetRow> = {
  key: Extract<keyof Row, string>;
  label: string;
  type: SheetCellType;
  /** Allowed values for `select` cells. */
  options?: readonly string[];
  /** Column width in px (default 140). */
  width?: number;
  /** Read-only computed value for `formula` columns. */
  compute?: (row: Row) => number;
  /** Display formatting (numbers, currency, dates). */
  format?: (value: unknown, row: Row) => string;
  /** Show a column total in the footer (number and formula columns). */
  total?: boolean;
  readOnly?: boolean;
};

export type CellPos = { row: number; col: number };
export type CellRange = { anchor: CellPos; focus: CellPos };
export type Bounds = { top: number; left: number; bottom: number; right: number };

export const bounds = ({ anchor, focus }: CellRange): Bounds => ({
  top: Math.min(anchor.row, focus.row),
  bottom: Math.max(anchor.row, focus.row),
  left: Math.min(anchor.col, focus.col),
  right: Math.max(anchor.col, focus.col),
});

export const inBounds = (b: Bounds, row: number, col: number) =>
  row >= b.top && row <= b.bottom && col >= b.left && col <= b.right;

export const clampPos = (pos: CellPos, rows: number, cols: number): CellPos => ({
  row: Math.max(0, Math.min(rows - 1, pos.row)),
  col: Math.max(0, Math.min(cols - 1, pos.col)),
});

export const isEditable = <Row extends SheetRow>(column: SheetColumn<Row>) =>
  column.type !== 'formula' && !column.readOnly;

/** The value a cell holds (formula columns are computed). */
export function cellValue<Row extends SheetRow>(row: Row, column: SheetColumn<Row>): unknown {
  return column.type === 'formula' ? (column.compute?.(row) ?? 0) : row[column.key];
}

/** Plain text for copying a cell. */
export function cellText<Row extends SheetRow>(row: Row, column: SheetColumn<Row>): string {
  const value = cellValue(row, column);
  if (column.type === 'checkbox') return value ? 'TRUE' : 'FALSE';
  if (value === null || value === undefined) return '';
  if (column.type === 'number' || column.type === 'formula') {
    const n = Number(value);
    return Number.isFinite(n) ? String(Math.round(n * 100) / 100) : '';
  }
  return String(value);
}

/**
 * Converts typed or pasted text into a cell value. Returns `undefined` when
 * the text is not valid for the column (the cell is then left unchanged).
 */
export function coerce<Row extends SheetRow>(text: string, column: SheetColumn<Row>): unknown {
  const raw = text.trim();
  switch (column.type) {
    case 'number': {
      if (raw === '') return null;
      const n = Number(raw.replace(/[$€£,\s]/g, '').replace(/^\((.*)\)$/, '-$1'));
      return Number.isFinite(n) ? n : undefined;
    }
    case 'checkbox':
      if (/^(true|yes|y|1|x|✓)$/i.test(raw)) return true;
      if (/^(false|no|n|0|)$/i.test(raw)) return false;
      return undefined;
    case 'select': {
      if (raw === '') return '';
      return column.options?.find((o) => o.toLowerCase() === raw.toLowerCase());
    }
    case 'date': {
      if (raw === '') return '';
      const iso = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
      const dmy = raw.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/);
      const value =
        iso ?? (dmy ? `${dmy[3]}-${dmy[2]!.padStart(2, '0')}-${dmy[1]!.padStart(2, '0')}` : null);
      return value && !Number.isNaN(Date.parse(value)) ? value : undefined;
    }
    case 'formula':
      return undefined;
    default:
      return text;
  }
}

/** Serializes a range as tab-separated values (rows by newline), like spreadsheets do. */
export function toTsv<Row extends SheetRow>(
  rows: Row[],
  columns: SheetColumn<Row>[],
  range: CellRange,
): string {
  const b = bounds(range);
  const lines: string[] = [];
  for (let r = b.top; r <= b.bottom; r++) {
    const row = rows[r];
    if (!row) continue;
    const cells: string[] = [];
    for (let c = b.left; c <= b.right; c++) {
      const column = columns[c];
      cells.push(column ? cellText(row, column).replace(/[\t\n]/g, ' ') : '');
    }
    lines.push(cells.join('\t'));
  }
  return lines.join('\n');
}

/** Parses clipboard text into a grid. Handles CRLF and a trailing newline. */
export function parseTsv(text: string): string[][] {
  const normalized = text.replace(/\r\n?/g, '\n').replace(/\n$/, '');
  if (normalized === '') return [['']];
  return normalized.split('\n').map((line) => line.split('\t'));
}

/**
 * Writes a pasted grid starting at `at`. A single value pasted onto a larger
 * selection fills the whole selection. Cells outside the sheet, formula
 * columns and invalid values are skipped. Returns the new rows and the
 * number of cells written.
 */
export function applyPaste<Row extends SheetRow>(
  rows: Row[],
  columns: SheetColumn<Row>[],
  selection: CellRange,
  grid: string[][],
): { rows: Row[]; written: number } {
  const b = bounds(selection);
  const single = grid.length === 1 && grid[0]!.length === 1;
  const height = single ? b.bottom - b.top + 1 : grid.length;
  const width = single ? b.right - b.left + 1 : Math.max(...grid.map((line) => line.length));
  const next = rows.slice();
  let written = 0;

  for (let dr = 0; dr < height; dr++) {
    const r = b.top + dr;
    if (r >= rows.length) break;
    let row: Row | null = null;
    for (let dc = 0; dc < width; dc++) {
      const c = b.left + dc;
      const column = columns[c];
      if (!column || !isEditable(column)) continue;
      const text = single ? grid[0]![0]! : grid[dr]?.[dc];
      if (text === undefined) continue;
      const value = coerce(text, column);
      if (value === undefined) continue;
      row ??= { ...next[r]! };
      (row as SheetRow)[column.key] = value;
      written++;
    }
    if (row) next[r] = row;
  }
  return { rows: next, written };
}

/** Clears every editable cell in a range (checkboxes become false). */
export function clearRange<Row extends SheetRow>(
  rows: Row[],
  columns: SheetColumn<Row>[],
  range: CellRange,
): Row[] {
  const b = bounds(range);
  return rows.map((row, r) => {
    if (r < b.top || r > b.bottom) return row;
    const next = { ...row } as SheetRow;
    for (let c = b.left; c <= b.right; c++) {
      const column = columns[c];
      if (!column || !isEditable(column)) continue;
      next[column.key] = column.type === 'checkbox' ? false : column.type === 'number' ? null : '';
    }
    return next as Row;
  });
}

/** Spreadsheet-style column letters: 0 → A, 25 → Z, 26 → AA. */
export function columnLetter(index: number): string {
  let n = index + 1;
  let out = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}
