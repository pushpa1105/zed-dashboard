import { useMemo } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Link } from '@/core/router/router';
import { createDataTableColumnHelper } from '@/shared/components/data-table/features';
import { cn } from '@/shared/lib/cn';

import { dateTime, signed } from '../lib/format';
import type { MovementRow } from '../model/inventory';
import { inventoryRoutes } from '../routes';

import { MovementType } from './movement-type';
import { sortable } from './sortable-header';

const helper = createDataTableColumnHelper<MovementRow>();

/** Columns of the stock movement ledger. */
export function useMovementColumns() {
  const { t } = useTranslation('inventory');

  return useMemo(
    () =>
      helper.columns([
        helper.accessor('at', {
          ...sortable(t('item.ledger.when')),
          size: 150,
          cell: ({ getValue }) => (
            <span className="whitespace-nowrap text-muted-foreground">{dateTime(getValue())}</span>
          ),
        }),
        helper.accessor('type', {
          ...sortable(t('item.ledger.type')),
          size: 160,
          cell: ({ row, getValue }) => (
            <MovementType type={getValue()} quantity={row.original.quantity} />
          ),
        }),
        helper.accessor('name', {
          ...sortable(t('movements.item')),
          size: 240,
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
        helper.accessor('warehouse', {
          ...sortable(t('item.ledger.warehouse')),
          size: 90,
          cell: ({ getValue }) => <span className="font-mono text-xs">{getValue()}</span>,
        }),
        helper.accessor('reference', {
          ...sortable(t('item.ledger.reference')),
          size: 170,
          cell: ({ getValue }) => <span className="text-muted-foreground">{getValue()}</span>,
        }),
        helper.accessor('user', {
          ...sortable(t('item.ledger.user')),
          size: 140,
          cell: ({ getValue }) => <span className="text-muted-foreground">{getValue()}</span>,
        }),
        helper.accessor('quantity', {
          ...sortable(t('item.ledger.quantity'), 'end'),
          size: 100,
          cell: ({ getValue }) => (
            <span className={cn('font-medium tabular-nums', getValue() >= 0 && 'text-success')}>
              {signed(getValue())}
            </span>
          ),
        }),
      ]),
    [t],
  );
}
