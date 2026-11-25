import type { Column } from '@tanstack/react-table';
import { useMemo } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Link } from '@/core/router/router';
import { DataTableColumnHeader } from '@/shared/components/data-table/data-table-column-header';
import {
  createDataTableColumnHelper,
  type DataTableFeatures,
} from '@/shared/components/data-table/features';
import { UserCell } from '@/shared/components/display/user-cell';

import { money, shortDate } from '../lib/format';
import type { Quote } from '../model/quotes';
import { crmRoutes } from '../routes';

import { CompanyMark, QuoteExpiry, QuoteStatusBadge } from './crm-parts';

const helper = createDataTableColumnHelper<Quote>();

export function useQuoteColumns() {
  const { t } = useTranslation('crm');
  return useMemo(() => {
    const titled = (title: string, align?: 'end') => ({
      header: <V,>({ column }: { column: Column<DataTableFeatures, Quote, V> }) => (
        <DataTableColumnHeader column={column} title={title} />
      ),
      meta: { label: title, align },
    });
    return helper.columns([
      helper.accessor('number', {
        ...titled(t('quotes.columns.quote')),
        size: 280,
        cell: ({ row }) => (
          <div className="min-w-0">
            <Link
              to={crmRoutes.quote.href({ quoteId: row.original.id })}
              className="block truncate font-medium hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {row.original.number}
            </Link>
            <span className="block truncate text-xs text-muted-foreground">
              {row.original.title}
            </span>
          </div>
        ),
      }),
      helper.accessor('company', {
        ...titled(t('quotes.columns.company')),
        size: 220,
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-3">
            <CompanyMark name={row.original.company} className="size-8" />
            <div className="min-w-0 leading-tight">
              <p className="truncate">{row.original.company}</p>
              <p className="truncate text-xs text-muted-foreground">{row.original.contact}</p>
            </div>
          </div>
        ),
      }),
      helper.accessor('status', {
        ...titled(t('quotes.columns.status')),
        size: 120,
        cell: (info) => <QuoteStatusBadge status={info.getValue()} />,
      }),
      helper.accessor('total', {
        ...titled(t('quotes.columns.total'), 'end'),
        size: 120,
        cell: (info) => <span className="font-medium tabular-nums">{money(info.getValue())}</span>,
      }),
      helper.accessor('validUntil', {
        ...titled(t('quotes.columns.validUntil')),
        size: 130,
        cell: ({ row }) => <QuoteExpiry quote={row.original} />,
      }),
      helper.accessor('owner', {
        ...titled(t('quotes.columns.owner')),
        size: 170,
        filterFn: 'arrIncludesSome',
        cell: (info) => <UserCell name={info.getValue()} size="xs" />,
      }),
      helper.accessor('createdAt', {
        ...titled(t('quotes.columns.createdAt')),
        size: 110,
        cell: (info) => (
          <span className="text-muted-foreground tabular-nums">{shortDate(info.getValue())}</span>
        ),
      }),
    ]);
  }, [t]);
}
