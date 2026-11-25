import { Mail } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { createExpandColumn } from '@/shared/components/data-table/column-factories';
import { DataTable } from '@/shared/components/data-table/data-table';
import { DataTableColumnHeader } from '@/shared/components/data-table/data-table-column-header';
import { createDataTableColumnHelper } from '@/shared/components/data-table/features';
import { useDataTable } from '@/shared/components/data-table/use-data-table';
import { cn } from '@/shared/lib/cn';
import { getInitials } from '@/shared/lib/format';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { formatCurrency } from '../components/format';
import { TablesNav } from '../components/tables-nav';
import { useTableLabels } from '../hooks/use-table-labels';
import { seedAccounts, type Account, type AccountInvoice } from '../model/showcase-data';

const helper = createDataTableColumnHelper<Account>();

const INVOICE_TONE: Record<AccountInvoice['status'], string> = {
  paid: 'bg-success/10 text-success',
  open: 'bg-info/10 text-info',
  overdue: 'bg-destructive/10 text-destructive',
};

function AccountDetail({ account }: { account: Account }) {
  const { t } = useTranslation('data-tables');
  const outstanding = account.invoices
    .filter((i) => i.status !== 'paid')
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="grid gap-6 px-6 py-5 lg:grid-cols-[1fr_18rem]">
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-semibold">{t('masterDetail.invoices')}</h3>
          <span className="text-xs text-muted-foreground">
            {t('masterDetail.outstanding', { amount: formatCurrency(outstanding) })}
          </span>
        </div>
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('masterDetail.cols.invoice')}</TableHead>
                <TableHead>{t('masterDetail.cols.issued')}</TableHead>
                <TableHead>{t('masterDetail.cols.due')}</TableHead>
                <TableHead>{t('masterDetail.cols.status')}</TableHead>
                <TableHead className="text-right">{t('masterDetail.cols.amount')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {account.invoices.map((invoice) => (
                <TableRow key={invoice.number}>
                  <TableCell className="font-mono text-xs">{invoice.number}</TableCell>
                  <TableCell className="text-muted-foreground">{invoice.issued}</TableCell>
                  <TableCell className="text-muted-foreground">{invoice.due}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        INVOICE_TONE[invoice.status],
                      )}
                    >
                      {t(`masterDetail.invoiceStatus.${invoice.status}`)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(invoice.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">{t('masterDetail.contacts')}</h3>
        <ul className="divide-y rounded-lg border bg-card">
          {account.contacts.map((contact) => {
            const [first = '', last = ''] = contact.name.split(' ');
            return (
              <li key={contact.email} className="flex items-center gap-3 px-3 py-2.5">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary/10 text-xs text-primary">
                    {getInitials(first, last)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{contact.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{contact.role}</p>
                </div>
                <a
                  href={`mailto:${contact.email}`}
                  aria-label={t('masterDetail.email', { name: contact.name })}
                  className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Mail className="size-4" />
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/** Accounts list whose rows expand into a panel with nested invoices and contacts. */
export default function MasterDetailPage() {
  const { t } = useTranslation('data-tables');
  const { header: headerLabels } = useTableLabels();
  const [data] = useState(seedAccounts);

  const columns = useMemo(
    () =>
      helper.columns([
        createExpandColumn<Account>({ label: t('expand') }),
        helper.accessor('name', {
          header: ({ column }) => (
            <DataTableColumnHeader
              column={column}
              title={t('masterDetail.cols.account')}
              labels={headerLabels}
            />
          ),
          size: 240,
          meta: { label: t('masterDetail.cols.account') },
          cell: ({ row, getValue }) => (
            <div className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                {getValue().slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium">{getValue()}</p>
                <p className="text-xs text-muted-foreground">
                  {t('masterDetail.contactsCount', { count: row.original.contacts.length })}
                </p>
              </div>
            </div>
          ),
        }),
        helper.accessor('plan', {
          header: ({ column }) => (
            <DataTableColumnHeader
              column={column}
              title={t('masterDetail.cols.plan')}
              labels={headerLabels}
            />
          ),
          size: 120,
          meta: { label: t('masterDetail.cols.plan') },
          cell: (info) => (
            <Badge variant={info.getValue() === 'Scale' ? 'default' : 'secondary'}>
              {info.getValue()}
            </Badge>
          ),
        }),
        helper.accessor('seats', {
          header: ({ column }) => (
            <DataTableColumnHeader
              column={column}
              title={t('masterDetail.cols.seats')}
              labels={headerLabels}
            />
          ),
          size: 100,
          meta: { label: t('masterDetail.cols.seats'), align: 'end' },
        }),
        helper.accessor('mrr', {
          header: ({ column }) => (
            <DataTableColumnHeader
              column={column}
              title={t('masterDetail.cols.mrr')}
              labels={headerLabels}
            />
          ),
          size: 130,
          meta: { label: t('masterDetail.cols.mrr'), align: 'end' },
          cell: (info) => formatCurrency(info.getValue()),
        }),
        helper.accessor('health', {
          header: ({ column }) => (
            <DataTableColumnHeader
              column={column}
              title={t('masterDetail.cols.health')}
              labels={headerLabels}
            />
          ),
          size: 170,
          meta: { label: t('masterDetail.cols.health') },
          cell: (info) => {
            const v = info.getValue();
            const tone = v >= 75 ? 'bg-success' : v >= 55 ? 'bg-warning' : 'bg-destructive';
            return (
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className={cn('h-full rounded-full', tone)} style={{ width: `${v}%` }} />
                </div>
                <span className="w-8 text-right text-xs tabular-nums">{v}</span>
              </div>
            );
          },
        }),
        helper.accessor('renewal', {
          header: ({ column }) => (
            <DataTableColumnHeader
              column={column}
              title={t('masterDetail.cols.renewal')}
              labels={headerLabels}
            />
          ),
          size: 130,
          meta: { label: t('masterDetail.cols.renewal') },
          cell: (info) => <span className="text-muted-foreground">{info.getValue()}</span>,
        }),
        helper.display({
          id: 'open',
          header: t('masterDetail.cols.openInvoices'),
          size: 130,
          meta: { label: t('masterDetail.cols.openInvoices'), align: 'end' },
          cell: ({ row }) => {
            const overdue = row.original.invoices.filter((i) => i.status === 'overdue').length;
            const open = row.original.invoices.filter((i) => i.status === 'open').length;
            if (!overdue && !open) return <span className="text-muted-foreground">—</span>;
            return (
              <span className={cn('font-medium', overdue ? 'text-destructive' : 'text-info')}>
                {overdue
                  ? t('masterDetail.overdueCount', { count: overdue })
                  : t('masterDetail.openCount', { count: open })}
              </span>
            );
          },
        }),
      ]),
    [t, headerLabels],
  );

  const table = useDataTable<Account>({
    data,
    columns,
    getRowId: (row) => row.id,
    getRowCanExpand: () => true,
    manualPagination: true,
    initialState: { expanded: { 'acc-1': true }, sorting: [{ id: 'mrr', desc: true }] },
  });

  return (
    <Page title={t('masterDetail.title')} description={t('masterDetail.description')} width="full">
      <TablesNav />
      <DataTable
        table={table}
        caption={t('masterDetail.title')}
        onRowClick={(row) => row.toggleExpanded()}
        renderDetail={(row) => <AccountDetail account={row.original} />}
      />
    </Page>
  );
}
