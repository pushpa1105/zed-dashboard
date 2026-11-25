import { ChevronRight, ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import { useMemo } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { DataTable } from '@/shared/components/data-table/data-table';
import { createDataTableColumnHelper } from '@/shared/components/data-table/features';
import {
  countLeaves,
  parentIds,
  rollUp,
  type TreeRow,
} from '@/shared/components/data-table/tree-data';
import { useDataTable } from '@/shared/components/data-table/use-data-table';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

import { formatCurrency } from '../components/format';
import { TablesNav } from '../components/tables-nav';
import { COST_CENTERS, type CostCenter } from '../model/showcase-data';

const usd = (n: number) => formatCurrency(Math.round(n)).replace(/\.00$/, '');

type Node = TreeRow<CostCenter>;
const helper = createDataTableColumnHelper<Node>();
const DATA = rollUp(COST_CENTERS, ['headcount', 'budget', 'actual']);
const PARENTS = parentIds(DATA);
const sumTop = (key: 'headcount' | 'budget' | 'actual') =>
  DATA.reduce((sum, node) => sum + node[key], 0);

/** Cost centers as a hierarchy: indent guides, expand all, totals rolled up to parents. */
export default function TreeTablePage() {
  const { t } = useTranslation('data-tables');

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('name', {
          header: t('tree.cols.name'),
          size: 280,
          meta: { label: t('tree.cols.name') },
          footer: () => t('tree.total'),
          cell: ({ row, getValue }) => {
            const canExpand = row.getCanExpand();
            return (
              <div className="flex h-full items-center">
                {Array.from({ length: row.depth }, (_, i) => (
                  <span
                    key={i}
                    aria-hidden
                    className="-my-2.5 ml-2.5 h-12 w-4 shrink-0 border-l border-dashed border-border"
                  />
                ))}
                {canExpand ? (
                  <button
                    type="button"
                    aria-label={t('tree.toggle', { name: getValue() })}
                    aria-expanded={row.getIsExpanded()}
                    onClick={row.getToggleExpandedHandler()}
                    className="mr-1.5 flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <ChevronRight
                      className={cn(
                        'size-4 transition-transform',
                        row.getIsExpanded() && 'rotate-90',
                      )}
                    />
                  </button>
                ) : (
                  <span className="mr-1.5 flex size-6 shrink-0 items-center justify-center">
                    <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                  </span>
                )}
                <span
                  className={cn(
                    'truncate',
                    canExpand && 'font-semibold',
                    row.depth === 0 && 'text-[0.9375rem]',
                  )}
                >
                  {getValue()}
                </span>
                {canExpand && (
                  <span className="ml-2 rounded-full bg-muted px-1.5 text-xs text-muted-foreground tabular-nums">
                    {countLeaves(row.original)}
                  </span>
                )}
              </div>
            );
          },
        }),
        helper.accessor('owner', {
          header: t('tree.cols.owner'),
          size: 170,
          meta: { label: t('tree.cols.owner') },
          cell: (info) => <span className="text-muted-foreground">{info.getValue()}</span>,
        }),
        helper.accessor('headcount', {
          header: t('tree.cols.headcount'),
          size: 110,
          meta: { label: t('tree.cols.headcount'), align: 'end' },
          footer: () => sumTop('headcount'),
        }),
        helper.accessor('budget', {
          header: t('tree.cols.budget'),
          size: 150,
          meta: { label: t('tree.cols.budget'), align: 'end' },
          cell: (info) => usd(info.getValue()),
          footer: () => usd(sumTop('budget')),
        }),
        helper.accessor('actual', {
          header: t('tree.cols.actual'),
          size: 150,
          meta: { label: t('tree.cols.actual'), align: 'end' },
          cell: (info) => usd(info.getValue()),
          footer: () => usd(sumTop('actual')),
        }),
        helper.display({
          id: 'variance',
          header: t('tree.cols.variance'),
          size: 140,
          meta: { label: t('tree.cols.variance'), align: 'end' },
          cell: ({ row }) => {
            const diff = row.original.budget - row.original.actual;
            return (
              <span className={cn('font-medium', diff < 0 ? 'text-destructive' : 'text-success')}>
                {diff < 0 ? '−' : '+'}
                {usd(Math.abs(diff))}
              </span>
            );
          },
          footer: () => {
            const diff = sumTop('budget') - sumTop('actual');
            return (
              <span className={diff < 0 ? 'text-destructive' : 'text-success'}>
                {diff < 0 ? '−' : '+'}
                {usd(Math.abs(diff))}
              </span>
            );
          },
        }),
        helper.display({
          id: 'burn',
          header: t('tree.cols.burn'),
          size: 180,
          meta: { label: t('tree.cols.burn') },
          cell: ({ row }) => {
            const pct = Math.round((row.original.actual / row.original.budget) * 100);
            return (
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      pct > 100 ? 'bg-destructive' : 'bg-primary',
                    )}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
                  {pct}%
                </span>
              </div>
            );
          },
        }),
      ]),
    [t],
  );

  const table = useDataTable<Node>({
    data: DATA,
    columns,
    getRowId: (row) => row.id,
    getSubRows: (row) => row.children,
    manualPagination: true,
    enableColumnResizing: true,
    initialState: { expanded: { eng: true, 'eng-product': true, gtm: true } },
  });

  const expandAll = () => table.setExpanded(Object.fromEntries(PARENTS.map((id) => [id, true])));

  return (
    <Page
      title={t('tree.title')}
      description={t('tree.description')}
      width="full"
      actions={
        <>
          <Button variant="outline" onClick={expandAll}>
            <ChevronsUpDown /> {t('tree.expandAll')}
          </Button>
          <Button variant="outline" onClick={() => table.setExpanded({})}>
            <ChevronsDownUp /> {t('tree.collapseAll')}
          </Button>
        </>
      }
    >
      <TablesNav />
      <DataTable
        table={table}
        showFooter
        caption={t('tree.title')}
        rowClassName={(row) => (row.depth === 0 ? '[&>td]:bg-muted/40' : undefined)}
      />
      <p className="text-xs text-muted-foreground">{t('tree.note')}</p>
    </Page>
  );
}
