import { useMemo } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Link } from '@/core/router/router';
import { createDataTableColumnHelper } from '@/shared/components/data-table/features';
import { StatusBadge } from '@/shared/components/display/status-badge';

import { qty, shortDate, usd } from '../lib/format';
import type { Batch } from '../model/stock';
import { inventoryRoutes } from '../routes';

import { ExpiryBadge, QuarantineButton } from './batch-cells';
import { sortable } from './sortable-header';

const helper = createDataTableColumnHelper<Batch>();

/** Columns of the batch table: lot, item, location, quantity, dates and expiry. */
export function useBatchColumns() {
  const { t } = useTranslation('inventory', { keyPrefix: 'batches' });

  return useMemo(
    () =>
      helper.columns([
        helper.accessor('id', {
          ...sortable(t('columns.batch')),
          size: 130,
          cell: ({ getValue }) => <span className="font-mono text-xs">{getValue()}</span>,
        }),
        helper.accessor('name', {
          ...sortable(t('columns.item')),
          size: 240,
          cell: ({ row, getValue }) => (
            <div className="min-w-0">
              <Link
                to={inventoryRoutes.item.href({ sku: row.original.sku })}
                className="block truncate font-medium hover:underline"
              >
                {getValue()}
              </Link>
              <p className="truncate text-xs text-muted-foreground">{row.original.supplier}</p>
            </div>
          ),
        }),
        helper.accessor((row) => `${row.warehouse} · ${row.bin}`, {
          id: 'location',
          ...sortable(t('columns.location')),
          size: 130,
          cell: ({ getValue }) => <span className="font-mono text-xs">{getValue()}</span>,
        }),
        helper.accessor('quantity', {
          ...sortable(t('columns.quantity'), 'end'),
          size: 100,
          cell: ({ getValue }) => qty(getValue()),
        }),
        helper.accessor((row) => Math.round(row.quantity * row.unitCost), {
          id: 'value',
          ...sortable(t('columns.value'), 'end'),
          size: 110,
          cell: ({ getValue }) => usd(getValue()),
        }),
        helper.accessor('received', {
          ...sortable(t('columns.received')),
          size: 110,
          cell: ({ getValue }) => shortDate(getValue()),
        }),
        helper.accessor('expires', {
          ...sortable(t('columns.expires')),
          size: 110,
          cell: ({ getValue }) => shortDate(getValue()),
        }),
        helper.accessor('daysLeft', {
          ...sortable(t('columns.daysLeft')),
          size: 140,
          cell: ({ getValue }) => <ExpiryBadge daysLeft={getValue()} />,
        }),
        helper.accessor('status', {
          ...sortable(t('columns.status')),
          size: 120,
          cell: ({ getValue }) => (
            <StatusBadge
              status={getValue()}
              tone={getValue() === 'quarantined' ? 'warning' : 'neutral'}
              label={t(`status.${getValue()}`)}
              variant="dot"
            />
          ),
        }),
        helper.display({
          id: 'actions',
          header: () => <span className="sr-only">{t('columns.actions')}</span>,
          size: 140,
          enableSorting: false,
          cell: ({ row }) => <QuarantineButton batch={row.original} />,
        }),
      ]),
    [t],
  );
}
