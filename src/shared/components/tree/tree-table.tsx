import { ChevronRight, ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import { Fragment, useState, type ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

export type TreeTableRow<T> = T & { id: string; children?: Array<TreeTableRow<T>> };

export type TreeTableColumn<T> = {
  key: string;
  header: ReactNode;
  /** Cell content. The first column also gets the indent and expander. */
  render: (row: TreeTableRow<T>, depth: number) => ReactNode;
  align?: 'left' | 'right';
  className?: string;
};

export type TreeTableProps<T> = {
  rows: Array<TreeTableRow<T>>;
  columns: Array<TreeTableColumn<T>>;
  defaultExpanded?: string[];
  /** Shows "Expand all / Collapse all" above the table. */
  toolbar?: boolean;
  labels?: { expandAll?: string; collapseAll?: string };
  className?: string;
};

const allParentIds = <T,>(rows: Array<TreeTableRow<T>>): string[] =>
  rows.flatMap((r) => (r.children?.length ? [r.id, ...allParentIds(r.children)] : []));

/**
 * Table whose rows nest (accounts, budgets, categories, BOMs). Parents expand
 * in place; the first column carries the indent and the expander.
 */
export function TreeTable<T>({
  rows,
  columns,
  defaultExpanded = [],
  toolbar,
  labels,
  className,
}: TreeTableProps<T>) {
  const [expanded, setExpanded] = useState(() => new Set(defaultExpanded));
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const renderRows = (list: Array<TreeTableRow<T>>, depth: number): ReactNode =>
    list.map((row) => {
      const parent = Boolean(row.children?.length);
      const open = expanded.has(row.id);
      return (
        <Fragment key={row.id}>
          <TableRow className={cn(depth === 0 && parent && 'bg-muted/30 font-medium')}>
            {columns.map((col, i) => (
              <TableCell
                key={col.key}
                className={cn(col.align === 'right' && 'text-right tabular-nums', col.className)}
              >
                {i === 0 ? (
                  <span
                    className="flex items-center gap-1.5"
                    style={{ paddingLeft: `${depth * 1.25}rem` }}
                  >
                    <button
                      type="button"
                      aria-label={open ? 'Collapse' : 'Expand'}
                      aria-expanded={parent ? open : undefined}
                      onClick={() => parent && toggle(row.id)}
                      className={cn(
                        'flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground',
                        !parent && 'invisible',
                      )}
                    >
                      <ChevronRight
                        className={cn('size-3.5 transition-transform', open && 'rotate-90')}
                      />
                    </button>
                    {col.render(row, depth)}
                  </span>
                ) : (
                  col.render(row, depth)
                )}
              </TableCell>
            ))}
          </TableRow>
          {parent && open && renderRows(row.children!, depth + 1)}
        </Fragment>
      );
    });

  return (
    <div className={cn('space-y-3', className)}>
      {toolbar && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded(new Set(allParentIds(rows)))}
          >
            <ChevronsUpDown /> {labels?.expandAll ?? 'Expand all'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setExpanded(new Set())}>
            <ChevronsDownUp /> {labels?.collapseAll ?? 'Collapse all'}
          </Button>
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(col.align === 'right' && 'text-right', col.className)}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>{renderRows(rows, 0)}</TableBody>
        </Table>
      </div>
    </div>
  );
}
