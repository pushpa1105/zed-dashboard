import { useState, type ReactNode } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { cn } from '@/shared/lib/cn';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group';

import type en from '../i18n/en.json';

export type SectionId = keyof typeof en.sections;

/** Grid that lays out demos; `cols` is the count at the widest breakpoint. */
export function ShowcaseGrid({
  cols = 2,
  className,
  children,
}: {
  cols?: 1 | 2 | 3;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'grid gap-4 md:gap-6',
        cols === 2 && 'lg:grid-cols-2',
        cols === 3 && 'md:grid-cols-2 xl:grid-cols-3',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** One component demo: a titled card whose title/description come from `sections.<id>`. */
export function Demo({
  id,
  action,
  className,
  contentClassName,
  children,
}: {
  id: SectionId;
  action?: ReactNode;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
}) {
  const { t } = useTranslation('ui-elements');
  return (
    <SectionCard
      title={t(`sections.${id}.title`)}
      description={t(`sections.${id}.description`)}
      action={action}
      className={className}
      contentClassName={contentClassName}
    >
      {children}
    </SectionCard>
  );
}

export type DataTableView = {
  columns: string[];
  rows: Array<Array<string | number>>;
};

/**
 * Chart demo with a Chart / Table switch. The table shows the exact data the
 * chart plots, so the chart is never the only way to read it.
 */
export function ChartDemo({
  id,
  table,
  className,
  children,
}: {
  id: SectionId;
  table: DataTableView;
  className?: string;
  children: ReactNode;
}) {
  const { t } = useTranslation('ui-elements');
  const [view, setView] = useState<'chart' | 'table'>('chart');

  return (
    <Demo
      id={id}
      className={className}
      action={
        <ToggleGroup
          type="single"
          size="sm"
          variant="outline"
          value={view}
          onValueChange={(value) => value && setView(value as 'chart' | 'table')}
        >
          <ToggleGroupItem value="chart" className="px-2.5 text-xs">
            {t('chartToggle.chart')}
          </ToggleGroupItem>
          <ToggleGroupItem value="table" className="px-2.5 text-xs">
            {t('chartToggle.table')}
          </ToggleGroupItem>
        </ToggleGroup>
      }
    >
      {view === 'chart' ? (
        children
      ) : (
        <div className="max-h-64 overflow-auto rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                {table.columns.map((c, i) => (
                  <TableHead key={c} className={cn(i > 0 && 'text-right')}>
                    {c}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.rows.map((row, r) => (
                <TableRow key={r}>
                  {row.map((cell, i) => (
                    <TableCell key={i} className={cn(i > 0 && 'text-right tabular-nums')}>
                      {typeof cell === 'number' ? cell.toLocaleString() : cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Demo>
  );
}
