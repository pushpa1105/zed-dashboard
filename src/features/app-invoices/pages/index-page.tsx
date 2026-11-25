import { AlertCircle, CheckCircle2, FilePen, Plus, ReceiptText, Send } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link, useNavigate, useSearchParams } from '@/core/router/router';
import { EmptyState } from '@/shared/components/display/empty-state';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { SearchInput } from '@/shared/components/forms/search-input';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { cn } from '@/shared/lib/cn';
import { formatDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';

import { listQuery, useInvoices } from '../api/invoices-api';
import { INVOICE_STATUSES, INVOICE_TONES, money, type InvoiceStatus } from '../model/invoice';
import { appInvoicesRoutes } from '../routes';

const DAY = 86_400_000;
const TILES: Array<{ status: InvoiceStatus; icon: typeof Send }> = [
  { status: 'sent', icon: Send },
  { status: 'overdue', icon: AlertCircle },
  { status: 'paid', icon: CheckCircle2 },
  { status: 'draft', icon: FilePen },
];

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ request }) => {
    const status = new URL(request.url).searchParams.get('status') ?? 'all';
    await queryClient.prefetchQuery(listQuery({ status, q: '' }));
    return null;
  };

function DueCell({ due, status, now }: { due: number; status: InvoiceStatus; now: number }) {
  const { t } = useTranslation('app-invoices');
  const days = Math.round((due - now) / DAY);
  return (
    <div>
      <p className="tabular-nums">{formatDate(due, 'MMM D, YYYY')}</p>
      {(status === 'sent' || status === 'overdue') && (
        <p className={cn('text-xs', days < 0 ? 'text-destructive' : 'text-muted-foreground')}>
          {days < 0
            ? t('list.daysLate', { count: -days })
            : days === 0
              ? t('list.dueToday')
              : t('list.dueIn', { count: days })}
        </p>
      )}
    </div>
  );
}

/** Invoices: totals per status, status tabs, search and the list. */
export default function InvoicesPage() {
  const { t } = useTranslation('app-invoices');
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? 'all';
  const [query, setQuery] = useState('');
  // One clock reading per visit keeps "due in" labels stable across re-renders.
  const [now] = useState(() => Date.now());
  const q = useDebounce(query, 250);
  const list = useInvoices({ status, q });
  const rows = list.data?.data ?? [];
  const byStatus = list.data?.byStatus;

  const setStatus = (next: string) => setParams(next === 'all' ? {} : { status: next });

  return (
    <Page
      title={t('title')}
      description={t('description')}
      width="full"
      actions={
        <Button asChild>
          <Link to={appInvoicesRoutes.create.href()}>
            <Plus /> {t('list.new')}
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {TILES.map(({ status: s, icon: Icon }) => {
          const stat = byStatus?.find((b) => b.status === s);
          const active = status === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(active ? 'all' : s)}
              aria-pressed={active}
              className={cn(
                'flex items-start gap-4 rounded-xl border bg-card p-5 text-left shadow-xs transition-colors hover:border-primary/40',
                active && 'border-primary ring-2 ring-primary/15',
              )}
            >
              <span
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-lg [&>svg]:size-[1.15rem]',
                  s === 'overdue'
                    ? 'bg-destructive/10 text-destructive'
                    : s === 'paid'
                      ? 'bg-success/10 text-success'
                      : 'bg-primary/10 text-primary',
                )}
              >
                <Icon />
              </span>
              <span className="min-w-0 space-y-1">
                <span className="block text-sm text-muted-foreground">{t(`tiles.${s}`)}</span>
                {stat ? (
                  <span className="block text-xl font-semibold tracking-tight tabular-nums">
                    {money(stat.amount)}
                  </span>
                ) : (
                  <Skeleton className="h-7 w-24" />
                )}
                <span className="block text-xs text-muted-foreground">
                  {t('tiles.count', { count: stat?.count ?? 0 })}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <div className="flex flex-wrap items-center gap-3 border-b p-4">
          <Tabs value={status} onValueChange={setStatus}>
            <TabsList>
              <TabsTrigger value="all">{t('status.all')}</TabsTrigger>
              {INVOICE_STATUSES.map((s) => (
                <TabsTrigger key={s} value={s}>
                  {t(`status.${s}`)}
                  {byStatus && (
                    <span className="ml-1 text-xs text-muted-foreground tabular-nums">
                      {byStatus.find((b) => b.status === s)?.count}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={t('list.search')}
            containerClassName="ml-auto w-full sm:w-72"
          />
        </div>

        {list.isPending ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title={t('list.emptyTitle')}
            description={t('list.emptyHint')}
            variant="plain"
            className="py-16"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">{t('columns.number')}</TableHead>
                <TableHead>{t('columns.customer')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('columns.issued')}</TableHead>
                <TableHead className="hidden sm:table-cell">{t('columns.due')}</TableHead>
                <TableHead>{t('columns.status')}</TableHead>
                <TableHead className="pr-4 text-right">{t('columns.amount')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((invoice) => (
                <TableRow
                  key={invoice.id}
                  className="cursor-pointer"
                  onClick={() =>
                    void navigate(appInvoicesRoutes.detail.href({ invoiceId: invoice.id }))
                  }
                >
                  <TableCell className="pl-4 font-mono text-xs font-medium">
                    <Link
                      to={appInvoicesRoutes.detail.href({ invoiceId: invoice.id })}
                      className="hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {invoice.number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <InitialsAvatar name={invoice.customer.name} shape="square" />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{invoice.customer.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {invoice.customer.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground tabular-nums md:table-cell">
                    {formatDate(invoice.issueDate, 'MMM D, YYYY')}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <DueCell due={invoice.dueDate} status={invoice.status} now={now} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={invoice.status}
                      tone={INVOICE_TONES[invoice.status]}
                      label={t(`status.${invoice.status}`)}
                    />
                  </TableCell>
                  <TableCell className="pr-4 text-right font-medium tabular-nums">
                    {money(invoice.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </Page>
  );
}
