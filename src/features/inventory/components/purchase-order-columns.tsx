import { useMemo } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Link } from '@/core/router/router';
import { createDataTableColumnHelper } from '@/shared/components/data-table/features';
import { cn } from '@/shared/lib/cn';
import { Progress } from '@/shared/ui/progress';

import { qty, shortDate, usd } from '../lib/format';
import { isLatePo } from '../lib/purchase-orders';
import type { PurchaseOrder } from '../model/inventory';
import { inventoryRoutes } from '../routes';

import { PoStatusBadge } from './po-status-badge';
import { SendPoButton } from './send-po-button';
import { sortable } from './sortable-header';

const helper = createDataTableColumnHelper<PurchaseOrder>();

const orderedUnits = (po: PurchaseOrder) => po.lines.reduce((s, l) => s + l.quantity, 0);
const receivedUnits = (po: PurchaseOrder) => po.lines.reduce((s, l) => s + l.received, 0);

/** Purchase order table columns, shared by the PO list and the supplier page. */
export function usePurchaseOrderColumns() {
  const { t } = useTranslation('inventory', { keyPrefix: 'purchaseOrders' });

  return useMemo(
    () =>
      helper.columns([
        helper.accessor('id', {
          ...sortable(t('columns.id')),
          size: 120,
          cell: ({ row, getValue }) => (
            <div>
              <p className="font-mono text-xs font-medium">{getValue()}</p>
              <p className="text-xs text-muted-foreground">
                {t('lines', { count: row.original.lines.length })}
              </p>
            </div>
          ),
        }),
        helper.accessor('supplier', {
          ...sortable(t('columns.supplier')),
          size: 220,
          cell: ({ row, getValue }) => (
            <Link
              to={inventoryRoutes.supplier.href({ supplierId: row.original.supplierId })}
              onClick={(e) => e.stopPropagation()}
              className="font-medium hover:underline"
            >
              {getValue()}
            </Link>
          ),
        }),
        helper.accessor('warehouse', {
          ...sortable(t('columns.warehouse')),
          size: 100,
          cell: ({ getValue }) => <span className="font-mono text-xs">{getValue()}</span>,
        }),
        helper.accessor('created', {
          ...sortable(t('columns.created')),
          size: 110,
          cell: ({ getValue }) => (
            <span className="text-muted-foreground">{shortDate(getValue())}</span>
          ),
        }),
        helper.accessor('expected', {
          ...sortable(t('columns.expected')),
          size: 130,
          cell: ({ row, getValue }) => {
            const late = isLatePo(row.original);
            return (
              <span className={late ? 'font-medium text-destructive' : 'text-muted-foreground'}>
                {shortDate(getValue())}
                {late && ` · ${t('late')}`}
              </span>
            );
          },
        }),
        helper.accessor((po) => receivedUnits(po) / orderedUnits(po), {
          id: 'progress',
          ...sortable(t('columns.progress')),
          size: 160,
          cell: ({ row, getValue }) => (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground tabular-nums">
                {qty(receivedUnits(row.original))} / {qty(orderedUnits(row.original))}
              </p>
              <Progress
                value={Number(getValue()) * 100}
                aria-label={t('columns.progress')}
                className={cn('h-1.5', row.original.status === 'draft' && 'opacity-40')}
              />
            </div>
          ),
        }),
        helper.accessor('total', {
          ...sortable(t('columns.total'), 'end'),
          size: 120,
          cell: ({ getValue }) => <span className="font-medium">{usd(getValue())}</span>,
        }),
        helper.accessor('status', {
          ...sortable(t('columns.status')),
          size: 160,
          filterFn: 'arrIncludesSome',
          cell: ({ getValue }) => <PoStatusBadge status={getValue()} />,
        }),
        helper.display({
          id: 'actions',
          header: () => <span className="sr-only">{t('columns.actions')}</span>,
          size: 100,
          enableSorting: false,
          cell: ({ row }) =>
            row.original.status === 'draft' && <SendPoButton id={row.original.id} />,
        }),
      ]),
    [t],
  );
}
