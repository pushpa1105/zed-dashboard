import { useMemo } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Link } from '@/core/router/router';
import { createDataTableColumnHelper } from '@/shared/components/data-table/features';
import { StatusBadge } from '@/shared/components/display/status-badge';

import { qty, usd } from '../lib/format';
import type { SlowMover } from '../model/stock';
import { inventoryRoutes } from '../routes';

import { sortable } from './sortable-header';

const helper = createDataTableColumnHelper<SlowMover>();

/** Columns of the slow-moving and dead stock table. */
export function useValuationColumns() {
  const { t } = useTranslation('inventory', { keyPrefix: 'valuation.slow' });

  return useMemo(
    () =>
      helper.columns([
        helper.accessor('name', {
          ...sortable(t('columns.item')),
          size: 260,
          cell: ({ row, getValue }) => (
            <div className="min-w-0">
              <Link
                to={inventoryRoutes.item.href({ sku: row.original.sku })}
                className="block truncate font-medium hover:underline"
              >
                {getValue()}
              </Link>
              <p className="font-mono text-xs text-muted-foreground">{row.original.sku}</p>
            </div>
          ),
        }),
        helper.accessor('category', { ...sortable(t('columns.category')), size: 160 }),
        helper.accessor('onHand', {
          ...sortable(t('columns.onHand'), 'end'),
          size: 110,
          cell: ({ getValue }) => qty(getValue()),
        }),
        helper.accessor('value', {
          ...sortable(t('columns.value'), 'end'),
          size: 120,
          cell: ({ getValue }) => <span className="font-medium">{usd(getValue())}</span>,
        }),
        helper.accessor('daysSinceSale', {
          ...sortable(t('columns.lastSale'), 'end'),
          size: 130,
          cell: ({ getValue }) => {
            const days = getValue();
            return days === null ? t('never') : t('daysAgo', { count: days });
          },
        }),
        helper.accessor('coverDays', {
          ...sortable(t('columns.cover'), 'end'),
          size: 120,
          cell: ({ getValue }) => t('days', { count: getValue() }),
        }),
        helper.accessor('class', {
          ...sortable(t('columns.class')),
          size: 120,
          cell: ({ getValue }) => (
            <StatusBadge
              status={getValue()}
              tone={getValue() === 'dead' ? 'danger' : 'warning'}
              label={t(`classes.${getValue()}`)}
            />
          ),
        }),
      ]),
    [t],
  );
}
