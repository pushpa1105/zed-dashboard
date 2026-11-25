import { useMemo } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Link } from '@/core/router/router';
import { createSelectColumn } from '@/shared/components/data-table/column-factories';
import { DataTableColumnHeader } from '@/shared/components/data-table/data-table-column-header';
import { createDataTableColumnHelper } from '@/shared/components/data-table/features';
import { cn } from '@/shared/lib/cn';

import { qty, shortDate, usd, usdCents } from '../lib/format';
import type { ItemRow } from '../model/inventory';
import { inventoryRoutes } from '../routes';

import { StockStatusBadge } from './stock-status-badge';

const helper = createDataTableColumnHelper<ItemRow>();

/** Column set for the stock table: pinnable, sortable, resizable, hideable. */
export function useItemColumns() {
  const { t } = useTranslation('inventory', { keyPrefix: 'items.columns' });

  return useMemo(() => {
    return helper.columns([
      createSelectColumn<ItemRow>({ label: t('select') }),
      helper.accessor('sku', {
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('sku')} />,
        meta: { label: t('sku') },
        size: 136,
        enableGrouping: false,
        cell: ({ getValue }) => (
          <Link
            to={inventoryRoutes.item.href({ sku: getValue() })}
            onClick={(e) => e.stopPropagation()}
            className="font-mono text-xs font-medium hover:underline"
          >
            {getValue()}
          </Link>
        ),
      }),
      helper.accessor('name', {
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('name')} />,
        meta: { label: t('name') },
        size: 220,
        cell: ({ row, getValue }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{getValue()}</p>
            <p className="truncate text-xs text-muted-foreground">{row.original.supplier}</p>
          </div>
        ),
      }),
      helper.accessor('category', {
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('category')} />,
        meta: { label: t('category') },
        size: 140,
        filterFn: 'arrIncludesSome',
        cell: ({ getValue }) => <span className="text-muted-foreground">{getValue()}</span>,
      }),
      helper.accessor('onHand', {
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('onHand')} />,
        meta: { label: t('onHand'), align: 'end' },
        size: 100,
        cell: ({ getValue }) => qty(getValue()),
      }),
      helper.accessor('reserved', {
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('reserved')} />,
        meta: { label: t('reserved'), align: 'end' },
        size: 110,
        cell: ({ getValue }) => <span className="text-muted-foreground">{qty(getValue())}</span>,
      }),
      helper.accessor('available', {
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('available')} />,
        meta: { label: t('available'), align: 'end' },
        size: 110,
        cell: ({ row, getValue }) => (
          <span
            className={cn(
              'font-semibold',
              row.original.status === 'out' && 'text-destructive',
              row.original.status === 'low' && 'text-warning-foreground dark:text-warning',
            )}
          >
            {qty(getValue())}
          </span>
        ),
      }),
      helper.accessor('reorderPoint', {
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('reorderPoint')} />,
        meta: { label: t('reorderPoint'), align: 'end' },
        size: 120,
        cell: ({ getValue }) => <span className="text-muted-foreground">{qty(getValue())}</span>,
      }),
      helper.accessor('status', {
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('status')} />,
        meta: { label: t('status') },
        size: 120,
        filterFn: 'arrIncludesSome',
        cell: ({ getValue }) => <StockStatusBadge status={getValue()} />,
      }),
      helper.accessor('location', {
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('location')} />,
        meta: { label: t('location') },
        size: 150,
        cell: ({ getValue }) => <span className="font-mono text-xs">{getValue()}</span>,
      }),
      helper.accessor('unitCost', {
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('unitCost')} />,
        meta: { label: t('unitCost'), align: 'end' },
        size: 110,
        cell: ({ getValue }) => usdCents(getValue()),
      }),
      helper.accessor((row) => row.onHand * row.unitCost, {
        id: 'value',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('value')} />,
        meta: { label: t('value'), align: 'end' },
        size: 120,
        cell: ({ getValue }) => <span className="font-medium">{usd(Number(getValue()))}</span>,
      }),
      helper.accessor('lastMovement', {
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('lastMovement')} />,
        meta: { label: t('lastMovement') },
        size: 130,
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{shortDate(getValue())}</span>
        ),
      }),
    ]);
  }, [t]);
}
