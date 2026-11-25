import { Check, Redo2, Undo2 } from 'lucide-react';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

import {
  applyPaste,
  bounds,
  cellText,
  cellValue,
  clampPos,
  clearRange,
  coerce,
  columnLetter,
  inBounds,
  isEditable,
  parseTsv,
  toTsv,
  type CellPos,
  type CellRange,
  type SheetColumn,
  type SheetRow,
} from './spreadsheet-model';

export type SpreadsheetProps<Row extends SheetRow> = {
  columns: SheetColumn<Row>[];
  rows: Row[];
  onChange: (rows: Row[]) => void;
  getRowId: (row: Row) => string;
  /** Data columns that stay visible when scrolling sideways (after the row numbers). */
  frozenColumns?: number;
  /** Height of the scroll area. */
  height?: number | string;
  /** Show the A/B/C letters above the headers. */
  showLetters?: boolean;
  /** Text for the toolbar and the accessible grid name. */
  labels?: {
    grid?: string;
    undo?: string;
    redo?: string;
    total?: string;
    selection?: (cells: number, sum: number | null) => string;
    hint?: string;
  };
  className?: string;
};

type Editing = { pos: CellPos; draft: string } | null;
const ROW_NUMBER_WIDTH = 48;
const MAX_HISTORY = 100;

/**
 * Editable grid with spreadsheet ergonomics:
 * - Arrows / Tab / Enter to move; Shift+arrows or Shift+click to extend a range; drag to select.
 * - Type to replace, Enter / F2 / double-click to edit, Esc to cancel, Space toggles checkboxes.
 * - Ctrl+C / Ctrl+V copy and paste ranges as TSV (works with Excel and Google Sheets).
 * - Delete clears; Ctrl+Z / Ctrl+Y undo and redo.
 * - Frozen header and first column(s), computed formula columns, footer totals.
 */
export function Spreadsheet<Row extends SheetRow>({
  columns,
  rows,
  onChange,
  getRowId,
  frozenColumns = 1,
  height = 520,
  showLetters = true,
  labels,
  className,
}: SpreadsheetProps<Row>) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState<CellRange>({
    anchor: { row: 0, col: 0 },
    focus: { row: 0, col: 0 },
  });
  const [editing, setEditing] = useState<Editing>(null);
  const [past, setPast] = useState<Row[][]>([]);
  const [future, setFuture] = useState<Row[][]>([]);
  const dragging = useRef(false);

  const active = range.focus;
  const b = bounds(range);

  // Sticky offsets for the frozen columns.
  const leftOffsets = useMemo(() => {
    const offsets: number[] = [];
    let x = ROW_NUMBER_WIDTH;
    columns.forEach((col, i) => {
      offsets.push(x);
      if (i < frozenColumns) x += col.width ?? 140;
    });
    return offsets;
  }, [columns, frozenColumns]);

  const commit = (next: Row[]) => {
    setPast((p) => [...p.slice(-MAX_HISTORY + 1), rows]);
    setFuture([]);
    onChange(next);
  };
  const undo = () => {
    const prev = past.at(-1);
    if (!prev) return;
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [rows, ...f]);
    onChange(prev);
  };
  const redo = () => {
    const next = future[0];
    if (!next) return;
    setFuture((f) => f.slice(1));
    setPast((p) => [...p, rows]);
    onChange(next);
  };

  const select = (pos: CellPos, extend = false) => {
    const clamped = clampPos(pos, rows.length, columns.length);
    setRange((r) =>
      extend ? { anchor: r.anchor, focus: clamped } : { anchor: clamped, focus: clamped },
    );
  };

  const setCell = (pos: CellPos, text: string) => {
    const column = columns[pos.col];
    if (!column || !isEditable(column)) return;
    const value = coerce(text, column);
    if (value === undefined) return;
    const next = rows.slice();
    next[pos.row] = { ...next[pos.row]!, [column.key]: value };
    commit(next);
  };

  const startEdit = (pos: CellPos, initial?: string) => {
    const column = columns[pos.col];
    const row = rows[pos.row];
    if (!column || !row || !isEditable(column)) return;
    if (column.type === 'checkbox') {
      commit(rows.map((r, i) => (i === pos.row ? { ...r, [column.key]: !r[column.key] } : r)));
      return;
    }
    setEditing({ pos, draft: initial ?? cellText(row, column) });
  };

  const finishEdit = (move?: CellPos) => {
    if (editing) setCell(editing.pos, editing.draft);
    setEditing(null);
    if (move) select(move);
    gridRef.current?.focus();
  };

  // Keep the active cell in view.
  useEffect(() => {
    gridRef.current
      ?.querySelector(`[data-cell="${active.row}:${active.col}"]`)
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [active.row, active.col]);

  useEffect(() => {
    const up = () => (dragging.current = false);
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (editing) return;
    const mod = e.ctrlKey || e.metaKey;
    const key = e.key;
    const move = (dr: number, dc: number) => {
      e.preventDefault();
      select({ row: active.row + dr, col: active.col + dc }, e.shiftKey);
    };
    if (mod && key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
      return;
    }
    if (mod && key.toLowerCase() === 'y') {
      e.preventDefault();
      redo();
      return;
    }
    if (mod && key.toLowerCase() === 'a') {
      e.preventDefault();
      setRange({
        anchor: { row: 0, col: 0 },
        focus: { row: rows.length - 1, col: columns.length - 1 },
      });
      return;
    }
    switch (key) {
      case 'ArrowUp':
        return move(-1, 0);
      case 'ArrowDown':
        return move(1, 0);
      case 'ArrowLeft':
        return move(0, -1);
      case 'ArrowRight':
        return move(0, 1);
      case 'Tab':
        return move(0, e.shiftKey ? -1 : 1);
      case 'Home':
        e.preventDefault();
        return select({ row: mod ? 0 : active.row, col: 0 });
      case 'End':
        e.preventDefault();
        return select({ row: mod ? rows.length - 1 : active.row, col: columns.length - 1 });
      case 'Enter':
      case 'F2':
        e.preventDefault();
        return startEdit(active);
      case ' ':
        if (columns[active.col]?.type === 'checkbox') {
          e.preventDefault();
          startEdit(active);
        }
        return;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        commit(clearRange(rows, columns, range));
        return;
      default:
        if (!mod && key.length === 1) {
          const column = columns[active.col];
          if (
            column &&
            isEditable(column) &&
            column.type !== 'checkbox' &&
            column.type !== 'select'
          ) {
            e.preventDefault();
            startEdit(active, key);
          }
        }
    }
  };

  const onCopy = (e: ClipboardEvent<HTMLDivElement>) => {
    if (editing) return;
    e.preventDefault();
    e.clipboardData.setData('text/plain', toTsv(rows, columns, range));
  };
  const onPaste = (e: ClipboardEvent<HTMLDivElement>) => {
    if (editing) return;
    e.preventDefault();
    const grid = parseTsv(e.clipboardData.getData('text/plain'));
    const result = applyPaste(rows, columns, range, grid);
    if (result.written > 0) commit(result.rows);
    if (grid.length > 1 || (grid[0]?.length ?? 0) > 1) {
      setRange({
        anchor: { row: b.top, col: b.left },
        focus: clampPos(
          {
            row: b.top + grid.length - 1,
            col: b.left + Math.max(...grid.map((l) => l.length)) - 1,
          },
          rows.length,
          columns.length,
        ),
      });
    }
  };

  // Selection summary (count + sum of numeric cells), like a spreadsheet status bar.
  const summary = useMemo(() => {
    let cells = 0;
    let sum = 0;
    let numeric = 0;
    for (let r = b.top; r <= b.bottom; r++) {
      for (let c = b.left; c <= b.right; c++) {
        const row = rows[r];
        const column = columns[c];
        if (!row || !column) continue;
        cells++;
        const value = cellValue(row, column);
        if ((column.type === 'number' || column.type === 'formula') && typeof value === 'number') {
          sum += value;
          numeric++;
        }
      }
    }
    return { cells, sum: numeric ? sum : null };
  }, [rows, columns, b.top, b.bottom, b.left, b.right]);

  const stickyStyle = (col: number, extra?: CSSProperties): CSSProperties =>
    col < frozenColumns
      ? { position: 'sticky', left: leftOffsets[col], zIndex: 2, ...extra }
      : { ...extra };

  const showTotals = columns.some((c) => c.total);

  return (
    <div className={cn('overflow-hidden rounded-lg border bg-card', className)}>
      <div className="flex flex-wrap items-center gap-2 border-b bg-muted/30 px-2 py-1.5">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={undo}
          disabled={!past.length}
          aria-label={labels?.undo ?? 'Undo'}
        >
          <Undo2 />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={redo}
          disabled={!future.length}
          aria-label={labels?.redo ?? 'Redo'}
        >
          <Redo2 />
        </Button>
        <span className="mx-1 h-5 w-px bg-border" />
        <span className="flex h-7 min-w-14 items-center justify-center rounded-md border bg-background px-2 font-mono text-xs">
          {columnLetter(active.col)}
          {active.row + 1}
        </span>
        <span className="min-w-0 flex-1 truncate px-1 font-mono text-xs text-muted-foreground">
          {rows[active.row] && columns[active.col]
            ? cellText(rows[active.row]!, columns[active.col]!)
            : ''}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {labels?.selection
            ? labels.selection(summary.cells, summary.sum)
            : `${summary.cells} cells${summary.sum !== null ? ` · Sum ${summary.sum.toLocaleString()}` : ''}`}
        </span>
      </div>
      <div
        ref={gridRef}
        role="grid"
        aria-label={labels?.grid ?? 'Spreadsheet'}
        aria-rowcount={rows.length + 1}
        aria-colcount={columns.length}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onCopy={onCopy}
        onPaste={onPaste}
        className="relative overflow-auto outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-inset"
        style={{ height }}
      >
        <table
          className="border-separate border-spacing-0 text-sm"
          style={{ tableLayout: 'fixed' }}
        >
          <colgroup>
            <col style={{ width: ROW_NUMBER_WIDTH }} />
            {columns.map((c) => (
              <col key={c.key} style={{ width: c.width ?? 140 }} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-20">
            {showLetters && (
              <tr>
                <th className="sticky left-0 z-30 h-6 border-r border-b bg-muted" />
                {columns.map((c, i) => (
                  <th
                    key={c.key}
                    style={stickyStyle(i, { zIndex: i < frozenColumns ? 30 : undefined })}
                    className={cn(
                      'h-6 border-r border-b bg-muted text-center font-mono text-[0.6875rem] font-normal text-muted-foreground',
                      i >= b.left && i <= b.right && 'bg-primary/10 text-primary',
                    )}
                  >
                    {columnLetter(i)}
                  </th>
                ))}
              </tr>
            )}
            <tr role="row">
              <th className="sticky left-0 z-30 h-10 border-r border-b bg-card" />
              {columns.map((c, i) => (
                <th
                  key={c.key}
                  role="columnheader"
                  style={stickyStyle(i, { zIndex: i < frozenColumns ? 30 : undefined })}
                  className={cn(
                    'h-10 truncate border-r border-b bg-card px-3 text-left text-xs font-medium text-muted-foreground',
                    (c.type === 'number' || c.type === 'formula') && 'text-right',
                    c.type === 'formula' && 'italic',
                    i === frozenColumns - 1 && 'shadow-[inset_-1px_0_0_var(--border)]',
                  )}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={getRowId(row)} role="row">
                <th
                  scope="row"
                  className={cn(
                    'sticky left-0 z-10 h-9 border-r border-b bg-muted/60 text-center font-mono text-[0.6875rem] font-normal text-muted-foreground',
                    r >= b.top && r <= b.bottom && 'bg-primary/10 text-primary',
                  )}
                >
                  {r + 1}
                </th>
                {columns.map((column, c) => {
                  const selected = inBounds(b, r, c);
                  const isActive = active.row === r && active.col === c;
                  const isEditing = editing?.pos.row === r && editing.pos.col === c;
                  const value = cellValue(row, column);
                  const numeric = column.type === 'number' || column.type === 'formula';
                  return (
                    <td
                      key={column.key}
                      role="gridcell"
                      aria-selected={selected}
                      aria-readonly={!isEditable(column) || undefined}
                      data-cell={`${r}:${c}`}
                      style={stickyStyle(c)}
                      onMouseDown={(e) => {
                        if (isEditing) return;
                        e.preventDefault();
                        gridRef.current?.focus();
                        if (editing) finishEdit();
                        dragging.current = true;
                        select({ row: r, col: c }, e.shiftKey);
                      }}
                      onMouseEnter={() => {
                        if (dragging.current) select({ row: r, col: c }, true);
                      }}
                      onDoubleClick={() => startEdit({ row: r, col: c })}
                      className={cn(
                        'relative h-9 truncate border-r border-b bg-card px-3 select-none',
                        numeric && 'text-right tabular-nums',
                        column.type === 'formula' && 'bg-muted/40 text-muted-foreground',
                        selected && 'bg-[color-mix(in_srgb,var(--primary)_9%,var(--card))]',
                        c === frozenColumns - 1 && 'shadow-[inset_-1px_0_0_var(--border)]',
                        c < frozenColumns && 'font-medium',
                      )}
                    >
                      {isEditing ? (
                        column.type === 'select' ? (
                          <select
                            autoFocus
                            value={editing.draft}
                            onChange={(e) => {
                              setCell({ row: r, col: c }, e.target.value);
                              setEditing(null);
                              gridRef.current?.focus();
                            }}
                            onBlur={() => finishEdit()}
                            onKeyDown={(e) =>
                              e.key === 'Escape' && (setEditing(null), gridRef.current?.focus())
                            }
                            className="absolute inset-0 w-full bg-background px-2 text-sm outline-2 -outline-offset-2 outline-primary"
                          >
                            {column.options?.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            autoFocus
                            type={column.type === 'date' ? 'date' : 'text'}
                            inputMode={column.type === 'number' ? 'decimal' : undefined}
                            value={editing.draft}
                            onChange={(e) =>
                              setEditing({ pos: editing.pos, draft: e.target.value })
                            }
                            onBlur={() => finishEdit()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                finishEdit({ row: r + (e.shiftKey ? -1 : 1), col: c });
                              } else if (e.key === 'Tab') {
                                e.preventDefault();
                                finishEdit({ row: r, col: c + (e.shiftKey ? -1 : 1) });
                              } else if (e.key === 'Escape') {
                                setEditing(null);
                                gridRef.current?.focus();
                              }
                            }}
                            className={cn(
                              'absolute inset-0 w-full bg-background px-3 text-sm outline-2 -outline-offset-2 outline-primary',
                              numeric && 'text-right tabular-nums',
                            )}
                          />
                        )
                      ) : column.type === 'checkbox' ? (
                        <span
                          className={cn(
                            'mx-auto flex size-4 items-center justify-center rounded-[4px] border',
                            value
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-input',
                          )}
                        >
                          {value ? <Check className="size-3" /> : null}
                        </span>
                      ) : column.format ? (
                        column.format(value, row)
                      ) : (
                        cellText(row, column)
                      )}
                      {isActive && !isEditing && (
                        <span
                          aria-hidden
                          className="pointer-events-none absolute inset-0 outline-2 -outline-offset-2 outline-primary"
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          {showTotals && (
            <tfoot className="sticky bottom-0 z-20">
              <tr>
                <th className="sticky left-0 z-30 h-10 border-t border-r bg-muted text-[0.6875rem] font-medium text-muted-foreground">
                  Σ
                </th>
                {columns.map((column, c) => {
                  const total = column.total
                    ? rows.reduce((sum, row) => sum + (Number(cellValue(row, column)) || 0), 0)
                    : null;
                  return (
                    <td
                      key={column.key}
                      style={stickyStyle(c, { zIndex: c < frozenColumns ? 30 : undefined })}
                      className={cn(
                        'h-10 truncate border-t border-r bg-muted px-3 font-semibold',
                        total !== null && 'text-right tabular-nums',
                      )}
                    >
                      {c === 0 && total === null
                        ? (labels?.total ?? 'Total')
                        : total !== null
                          ? column.format
                            ? column.format(total, rows[0]!)
                            : total.toLocaleString()
                          : null}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {labels?.hint && (
        <p className="border-t bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          {labels.hint}
        </p>
      )}
    </div>
  );
}
