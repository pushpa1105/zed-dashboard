import { ArrowRight, Zap } from 'lucide-react';
import { useMemo } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { DataTableColumnHeader } from '@/shared/components/data-table/data-table-column-header';
import { createDataTableColumnHelper } from '@/shared/components/data-table/features';

import { fmtDateTime, fmtDuration, fmtKg } from '../lib/format';
import type { Shipment } from '../model/logistics';

import { ShipmentStatusBadge } from './badges';

const helper = createDataTableColumnHelper<Shipment>();

/** Column definitions for the shipments table. */
export function useShipmentColumns() {
  const { t, i18n } = useTranslation('logistics');

  return useMemo(() => {
    const labels = {
      asc: t('table.asc'),
      desc: t('table.desc'),
      clearSort: t('table.clearSort'),
      hide: t('table.hide'),
      pinStart: t('table.pinStart'),
      pinEnd: t('table.pinEnd'),
      unpin: t('table.unpin'),
    };

    return helper.columns([
      helper.accessor('id', {
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('shipments.columns.id')}
            labels={labels}
          />
        ),
        meta: { label: t('shipments.columns.id') },
        size: 130,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-medium">{row.original.id}</span>
            {row.original.priority && (
              <Zap
                className="size-3.5 fill-warning text-warning"
                aria-label={t('shipments.priority')}
              />
            )}
          </div>
        ),
      }),
      helper.accessor('customer', {
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('shipments.columns.customer')}
            labels={labels}
          />
        ),
        meta: { label: t('shipments.columns.customer') },
        size: 200,
        cell: ({ row }) => (
          <div className="min-w-0 leading-tight">
            <p className="truncate font-medium">{row.original.customer}</p>
            <p className="truncate font-mono text-xs text-muted-foreground">
              {row.original.reference}
            </p>
          </div>
        ),
      }),
      helper.accessor((row) => `${row.origin} ${row.destination}`, {
        id: 'route',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('shipments.columns.route')}
            labels={labels}
          />
        ),
        meta: { label: t('shipments.columns.route') },
        size: 230,
        cell: ({ row }) => (
          <span className="flex items-center gap-1.5 truncate">
            {row.original.origin}
            <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
            {row.original.destination}
          </span>
        ),
      }),
      helper.accessor('status', {
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('shipments.columns.status')}
            labels={labels}
          />
        ),
        meta: { label: t('shipments.columns.status') },
        size: 150,
        filterFn: 'arrIncludesSome',
        cell: (info) => <ShipmentStatusBadge status={info.getValue()} />,
      }),
      helper.accessor('mode', {
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('shipments.columns.mode')}
            labels={labels}
          />
        ),
        meta: { label: t('shipments.columns.mode') },
        size: 100,
        filterFn: 'arrIncludesSome',
        cell: (info) => (
          <span className="text-muted-foreground">{t(`mode.${info.getValue()}`)}</span>
        ),
      }),
      helper.accessor('carrier', {
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('shipments.columns.carrier')}
            labels={labels}
          />
        ),
        meta: { label: t('shipments.columns.carrier') },
        size: 160,
        cell: (info) => <span className="truncate">{info.getValue()}</span>,
      }),
      helper.accessor('progress', {
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('shipments.columns.progress')}
            labels={labels}
          />
        ),
        meta: { label: t('shipments.columns.progress') },
        size: 150,
        cell: ({ row }) => {
          const value = row.original.progress;
          const late = row.original.status === 'exception';
          return (
            <div className="flex items-center gap-2.5">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={
                    late ? 'h-full rounded-full bg-destructive' : 'h-full rounded-full bg-primary'
                  }
                  style={{ width: `${Math.round(value * 100)}%` }}
                />
              </div>
              <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">
                {Math.round(value * 100)}%
              </span>
            </div>
          );
        },
      }),
      helper.accessor('eta', {
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('shipments.columns.eta')}
            labels={labels}
          />
        ),
        meta: { label: t('shipments.columns.eta') },
        size: 150,
        sortFn: 'datetime',
        cell: ({ row }) => (
          <div className="leading-tight">
            <p className="tabular-nums">{fmtDateTime(row.original.eta)}</p>
            {row.original.delayMinutes > 0 && row.original.status !== 'delivered' && (
              <p className="text-xs text-destructive">
                {t('shipments.late', { value: fmtDuration(row.original.delayMinutes) })}
              </p>
            )}
          </div>
        ),
      }),
      helper.accessor('weightKg', {
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('shipments.columns.load')}
            labels={labels}
          />
        ),
        meta: { label: t('shipments.columns.load'), align: 'end' },
        size: 130,
        cell: ({ row }) => (
          <div className="text-right leading-tight tabular-nums">
            <p>{fmtKg(row.original.weightKg, i18n.language)}</p>
            <p className="text-xs text-muted-foreground">
              {t('shipments.pallets', { count: row.original.pallets })}
            </p>
          </div>
        ),
      }),
    ]);
  }, [t, i18n.language]);
}
