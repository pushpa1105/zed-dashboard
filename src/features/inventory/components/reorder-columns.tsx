import { useMemo } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Link } from '@/core/router/router';
import { createSelectColumn } from '@/shared/components/data-table/column-factories';
import { createDataTableColumnHelper } from '@/shared/components/data-table/features';
import { cn } from '@/shared/lib/cn';

import { qty, usd } from '../lib/format';
import type { ReorderLine } from '../model/inventory';
import { inventoryRoutes } from '../routes';

import { sortable } from './sortable-header';

export type PlanRow = ReorderLine & { daysLeft: number; suggested: number; cost: number };

const helper = createDataTableColumnHelper<PlanRow>();

/** Columns of the reorder planner: stock position, usage, lead time and the suggestion. */
export function useReorderColumns() {
  const { t } = useTranslation('inventory', { keyPrefix: 'reorder' });

  return useMemo(
    () =>
      helper.columns([
        createSelectColumn<PlanRow>({ label: t('columns.select') }),
        helper.accessor('name', {
          ...sortable(t('columns.item')),
          size: 260,
          cell: ({ row, getValue }) => (
            <div className="min-w-0">
              <Link
                to={inventoryRoutes.item.href({ sku: row.original.sku })}
                onClick={(e) => e.stopPropagation()}
                className="block truncate font-medium hover:underline"
              >
                {getValue()}
              </Link>
              <Link
                to={inventoryRoutes.supplier.href({ supplierId: row.original.supplierId })}
                onClick={(e) => e.stopPropagation()}
                className="block truncate text-xs text-muted-foreground hover:underline"
              >
                {row.original.supplier}
              </Link>
            </div>
          ),
        }),
        helper.accessor('available', {
          ...sortable(t('columns.available'), 'end'),
          size: 120,
          cell: ({ row, getValue }) => (
            <span className="tabular-nums">
              <span className={cn('font-medium', getValue() <= 0 && 'text-destructive')}>
                {qty(getValue())}
              </span>
              <span className="text-xs text-muted-foreground">
                {' '}
                / {qty(row.original.reorderPoint)}
              </span>
            </span>
          ),
        }),
        helper.accessor('onOrder', {
          ...sortable(t('columns.onOrder'), 'end'),
          size: 100,
          cell: ({ getValue }) => <span className="text-muted-foreground">{qty(getValue())}</span>,
        }),
        helper.accessor('dailyUsage', {
          ...sortable(t('columns.usage'), 'end'),
          size: 110,
          cell: ({ getValue }) => t('perDay', { value: getValue() }),
        }),
        helper.accessor('daysLeft', {
          ...sortable(t('columns.cover'), 'end'),
          size: 110,
          cell: ({ row, getValue }) => (
            <span
              className={cn(
                getValue() < row.original.leadTimeDays && 'font-medium text-destructive',
              )}
            >
              {t('days', { count: getValue() })}
            </span>
          ),
        }),
        helper.accessor('leadTimeDays', {
          ...sortable(t('columns.lead'), 'end'),
          size: 100,
          cell: ({ getValue }) => (
            <span className="text-muted-foreground">{t('days', { count: getValue() })}</span>
          ),
        }),
        helper.accessor('suggested', {
          ...sortable(t('columns.suggested'), 'end'),
          size: 130,
          cell: ({ getValue }) => <span className="font-semibold">{qty(getValue())}</span>,
        }),
        helper.accessor('cost', {
          ...sortable(t('columns.cost'), 'end'),
          size: 110,
          cell: ({ getValue }) => usd(getValue()),
        }),
      ]),
    [t],
  );
}
