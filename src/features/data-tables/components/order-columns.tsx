import { useMemo } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { createSelectColumn } from '@/shared/components/data-table/column-factories';
import { DataTableColumnHeader } from '@/shared/components/data-table/data-table-column-header';
import { createDataTableColumnHelper } from '@/shared/components/data-table/features';
import { formatDate, getInitials } from '@/shared/lib/format';

import { useTableLabels } from '../hooks/use-table-labels';
import type { Order } from '../model/order';

import { formatCurrency } from './format';
import { OrderStatusBadge, PaidBadge } from './order-badges';
import { OrderRowActions, type OrderActionHandlers } from './order-row-actions';

const helper = createDataTableColumnHelper<Order>();

/**
 * Column definitions for the orders table. Column ids equal the API's field
 * names, so `sorting` state maps straight onto the `sort` query param.
 */
export function useOrderColumns(handlers: OrderActionHandlers) {
  const { t, i18n } = useTranslation('data-tables');
  const { header: labels } = useTableLabels();
  const { onView, onSetStatus, onDelete } = handlers;

  return useMemo(() => {
    return helper.columns([
      createSelectColumn<Order>({ label: t('select') }),
      helper.accessor('number', {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('columns.number')} labels={labels} />
        ),
        meta: { label: t('columns.number') },
        size: 110,
        cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span>,
      }),
      helper.accessor('customerName', {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('columns.customer')} labels={labels} />
        ),
        meta: { label: t('columns.customer') },
        size: 250,
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[0.65rem] font-semibold text-primary">
              {getInitials(...row.original.customerName.split(' '))}
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate font-medium">{row.original.customerName}</p>
              <p className="truncate text-xs text-muted-foreground">{row.original.customerEmail}</p>
            </div>
          </div>
        ),
      }),
      helper.accessor('status', {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('columns.status')} labels={labels} />
        ),
        meta: { label: t('columns.status') },
        size: 130,
        cell: (info) => <OrderStatusBadge status={info.getValue()} />,
      }),
      helper.accessor('channel', {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('columns.channel')} labels={labels} />
        ),
        meta: { label: t('columns.channel') },
        size: 130,
        cell: (info) => (
          <span className="text-muted-foreground">{t(`channel.${info.getValue()}`)}</span>
        ),
      }),
      helper.accessor('country', {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('columns.country')} labels={labels} />
        ),
        meta: { label: t('columns.country') },
        size: 150,
      }),
      helper.accessor('items', {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('columns.items')} labels={labels} />
        ),
        meta: { label: t('columns.items'), align: 'end' },
        size: 90,
      }),
      helper.accessor('total', {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('columns.total')} labels={labels} />
        ),
        meta: { label: t('columns.total'), align: 'end' },
        size: 120,
        cell: (info) => (
          <span className="font-medium">{formatCurrency(info.getValue(), i18n.language)}</span>
        ),
      }),
      helper.accessor('paid', {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('columns.paid')} labels={labels} />
        ),
        meta: { label: t('columns.paid') },
        size: 110,
        cell: (info) => <PaidBadge paid={info.getValue()} />,
      }),
      helper.accessor('createdAt', {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('columns.createdAt')} labels={labels} />
        ),
        meta: { label: t('columns.createdAt') },
        size: 130,
        cell: (info) => (
          <span className="text-muted-foreground tabular-nums">
            {formatDate(info.getValue(), 'MMM D, YYYY')}
          </span>
        ),
      }),
      helper.accessor('assignee', {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('columns.assignee')} labels={labels} />
        ),
        meta: { label: t('columns.assignee') },
        size: 150,
        cell: (info) =>
          info.getValue() ?? <span className="text-muted-foreground">{t('unassigned')}</span>,
      }),
      helper.display({
        id: 'actions',
        size: 56,
        enableHiding: false,
        enableResizing: false,
        enableSorting: false,
        meta: { label: t('columns.actions'), align: 'end' },
        header: () => <span className="sr-only">{t('columns.actions')}</span>,
        cell: ({ row }) => (
          <OrderRowActions
            order={row.original}
            onView={onView}
            onSetStatus={onSetStatus}
            onDelete={onDelete}
          />
        ),
      }),
    ]);
  }, [t, i18n.language, labels, onView, onSetStatus, onDelete]);
}
