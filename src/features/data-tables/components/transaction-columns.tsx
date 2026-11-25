import { useMemo } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { createSelectColumn } from '@/shared/components/data-table/column-factories';
import { DataTableColumnHeader } from '@/shared/components/data-table/data-table-column-header';
import { EditableCell } from '@/shared/components/data-table/editable-cell';
import { createDataTableColumnHelper } from '@/shared/components/data-table/features';
import { formatDate } from '@/shared/lib/format';

import { useTableLabels } from '../hooks/use-table-labels';
import { ORDER_STATUSES, type OrderStatus } from '../model/order';
import type { Transaction } from '../model/transaction';

import { formatCurrency, formatNumber } from './format';
import { OrderStatusBadge } from './order-badges';

const helper = createDataTableColumnHelper<Transaction>();

/** Columns for the client-side table: groupable, aggregated and editable in place. */
export function useTransactionColumns(onEdit: (id: string, patch: Partial<Transaction>) => void) {
  const { t, i18n } = useTranslation('data-tables');
  const { header: labels } = useTableLabels();

  return useMemo(() => {
    const money = (n: number) => formatCurrency(n, i18n.language);
    const statusOptions = ORDER_STATUSES.map((s) => ({ value: s, label: t(`status.${s}`) }));

    return helper.columns([
      createSelectColumn<Transaction>({ label: t('select') }),
      helper.accessor('reference', {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('columns.reference')} labels={labels} />
        ),
        meta: { label: t('columns.reference') },
        size: 130,
        enableGrouping: false,
        cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span>,
      }),
      helper.accessor('customer', {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('columns.customer')} labels={labels} />
        ),
        meta: { label: t('columns.customer') },
        size: 190,
        enableGrouping: false,
        cell: ({ row, getValue }) => (
          <EditableCell
            type="text"
            label={t('columns.customer')}
            value={getValue()}
            onCommit={(customer) => onEdit(row.original.id, { customer })}
          />
        ),
      }),
      helper.accessor('status', {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('columns.status')} labels={labels} />
        ),
        meta: { label: t('columns.status') },
        size: 150,
        filterFn: 'arrIncludesSome',
        cell: ({ row, getValue }) => (
          <EditableCell
            type="select"
            label={t('columns.status')}
            value={getValue()}
            options={statusOptions}
            display={<OrderStatusBadge status={getValue()} />}
            onCommit={(status) => onEdit(row.original.id, { status: status as OrderStatus })}
          />
        ),
        aggregatedCell: () => null,
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
        aggregatedCell: () => null,
      }),
      helper.accessor('country', {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('columns.country')} labels={labels} />
        ),
        meta: { label: t('columns.country') },
        size: 150,
        aggregatedCell: () => null,
      }),
      helper.accessor('quantity', {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('columns.quantity')} labels={labels} />
        ),
        meta: { label: t('columns.quantity'), align: 'end' },
        size: 80,
        enableGrouping: false,
        aggregationFn: 'sum',
        aggregatedCell: (info) => (
          <span className="font-medium">
            {formatNumber(Number(info.getValue()), i18n.language)}
          </span>
        ),
      }),
      helper.accessor('amount', {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('columns.amount')} labels={labels} />
        ),
        meta: { label: t('columns.amount'), align: 'end' },
        size: 130,
        enableGrouping: false,
        aggregationFn: 'sum',
        aggregatedCell: (info) => (
          <span className="font-semibold">{money(Number(info.getValue()))}</span>
        ),
        cell: ({ row, getValue }) => (
          <EditableCell
            type="number"
            label={t('columns.amount')}
            value={getValue()}
            step={0.01}
            display={money(getValue())}
            onCommit={(amount) => onEdit(row.original.id, { amount })}
          />
        ),
      }),
      helper.accessor('date', {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('columns.date')} labels={labels} />
        ),
        meta: { label: t('columns.date') },
        size: 120,
        enableGrouping: false,
        sortFn: 'text',
        cell: (info) => (
          <span className="text-muted-foreground tabular-nums">
            {formatDate(info.getValue(), 'MMM D, YYYY')}
          </span>
        ),
        aggregatedCell: () => null,
      }),
      helper.accessor('notes', {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('columns.notes')} labels={labels} />
        ),
        meta: { label: t('columns.notes') },
        size: 200,
        enableGrouping: false,
        enableSorting: false,
        cell: ({ row, getValue }) => (
          <EditableCell
            type="text"
            label={t('columns.notes')}
            value={getValue()}
            display={getValue() || <span className="text-muted-foreground/60">—</span>}
            onCommit={(notes) => onEdit(row.original.id, { notes })}
          />
        ),
        aggregatedCell: () => null,
      }),
    ]);
  }, [t, i18n.language, labels, onEdit]);
}
