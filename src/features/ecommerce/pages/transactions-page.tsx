import { CreditCard, HandCoins, Smartphone, Store, Wallet, type LucideIcon } from 'lucide-react';
import { useMemo } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link, useSearchParams } from '@/core/router/router';
import { AreaChart } from '@/shared/components/charts/area-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';
import { DataTableFacetedFilter } from '@/shared/components/data-table/data-table-faceted-filter';
import { DataTableToolbar } from '@/shared/components/data-table/data-table-toolbar';
import { EmptyState } from '@/shared/components/display/empty-state';
import { ErrorState } from '@/shared/components/display/error-state';
import { StatusBadge } from '@/shared/components/display/status-badge';
import type { Tone } from '@/shared/components/display/tone';
import { Pager } from '@/shared/components/pager';
import { cn } from '@/shared/lib/cn';
import { formatDate } from '@/shared/lib/format';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { payoutsQuery, transactionsQuery, useTransactions } from '../api/finance-api';
import { PayoutsCard } from '../components/payouts-card';
import { formatMoney } from '../lib/money';
import {
  PAYMENT_METHODS,
  TRANSACTION_STATUSES,
  transactionsSearchSchema,
  type Transaction,
  type TransactionsSearch,
} from '../model/finance';
import { ecommerceRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ request }) => {
    const params = Object.fromEntries(new URL(request.url).searchParams);
    await Promise.all([
      queryClient.prefetchQuery(transactionsQuery(transactionsSearchSchema.parse(params))),
      queryClient.prefetchQuery(payoutsQuery()),
    ]);
    return null;
  };

const STATUS_TONE: Record<Transaction['status'], Tone> = {
  succeeded: 'success',
  pending: 'warning',
  failed: 'danger',
};
const METHOD_ICON: Record<Transaction['method'], LucideIcon> = {
  card: CreditCard,
  apple_pay: Smartphone,
  paypal: Wallet,
  in_person: Store,
};
const csv = (value: string) => value.split(',').filter(Boolean);

function TransactionRow({ txn }: { txn: Transaction }) {
  const { t, i18n } = useTranslation('ecommerce');
  const money = (n: number) => formatMoney(n, i18n.language);
  const Icon = METHOD_ICON[txn.method];
  return (
    <TableRow>
      <TableCell className="pl-6 text-muted-foreground tabular-nums">
        {formatDate(txn.createdAt, 'MMM D, h:mm A')}
      </TableCell>
      <TableCell>
        <Link
          to={ecommerceRoutes.order.href({ orderId: txn.orderId })}
          className="font-medium hover:underline"
        >
          {t(`transactions.type.${txn.type}`)} · {txn.orderNumber}
        </Link>
        <p className="truncate text-xs text-muted-foreground">{txn.customerName}</p>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <span className="inline-flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" />
          {txn.card ?? t(`transactions.method.${txn.method}`)}
        </span>
      </TableCell>
      <TableCell>
        <StatusBadge
          status={txn.status}
          tone={STATUS_TONE[txn.status]}
          label={t(`transactions.status.${txn.status}`)}
        />
      </TableCell>
      <TableCell
        className={cn('text-right font-medium tabular-nums', txn.amount < 0 && 'text-destructive')}
      >
        {money(txn.amount)}
      </TableCell>
      <TableCell className="hidden text-right text-muted-foreground tabular-nums lg:table-cell">
        {money(txn.fee)}
      </TableCell>
      <TableCell className="hidden pr-6 text-right tabular-nums sm:table-cell">
        {money(txn.amount - txn.fee)}
      </TableCell>
    </TableRow>
  );
}

/** Payments ledger with filters, 30-day volume, and the payout schedule. */
export default function TransactionsPage() {
  const { t, i18n } = useTranslation('ecommerce');
  const [params, setParams] = useSearchParams();
  const search = useMemo(
    () => transactionsSearchSchema.parse(Object.fromEntries(params)),
    [params],
  );
  const txns = useTransactions(search);
  const data = txns.data;
  const money = (n: number) => formatMoney(n, i18n.language, 0);

  const update = (patch: Partial<TransactionsSearch>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries({ page: 1, ...patch })) {
          if (value === '' || value === 1) next.delete(key);
          else next.set(key, String(value));
        }
        return next;
      },
      { replace: true },
    );

  return (
    <Page width="full" title={t('transactions.title')} description={t('transactions.description')}>
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <SectionCard
          className="min-w-0 lg:col-span-2"
          title={t('transactions.volume')}
          description={t('transactions.volumeHint')}
        >
          {data ? (
            <>
              <StatStrip
                className="mb-4"
                items={(['gross', 'refunds', 'fees', 'net'] as const).map((key) => ({
                  key,
                  label: t(`transactions.summary.${key}`),
                  value: money(data.summary[key]),
                }))}
              />
              <AreaChart
                data={data.daily}
                xKey="day"
                series={[
                  { key: 'gross', label: t('transactions.summary.gross'), color: 'var(--chart-1)' },
                  { key: 'net', label: t('transactions.summary.net'), color: 'var(--chart-2)' },
                ]}
                xFormatter={(day) => formatDate(day, 'MMM D')}
                valueFormatter={money}
                className="h-64"
              />
            </>
          ) : (
            <Skeleton className="h-80" />
          )}
        </SectionCard>
        <PayoutsCard />
      </div>

      <div className="space-y-4">
        <DataTableToolbar
          onReset={() => setParams(new URLSearchParams(), { replace: true })}
          resetLabel={t('orders.reset')}
        >
          <DataTableFacetedFilter
            title={t('transactions.col.status')}
            value={csv(search.status)}
            onChange={(v) => update({ status: v.join(',') })}
            options={TRANSACTION_STATUSES.map((s) => ({
              value: s,
              label: t(`transactions.status.${s}`),
            }))}
          />
          <DataTableFacetedFilter
            title={t('transactions.col.method')}
            value={csv(search.method)}
            onChange={(v) => update({ method: v.join(',') })}
            options={PAYMENT_METHODS.map((m) => ({
              value: m,
              label: t(`transactions.method.${m}`),
              icon: METHOD_ICON[m],
            }))}
          />
        </DataTableToolbar>

        {txns.isError ? (
          <ErrorState title={t('common.error')} onRetry={() => void txns.refetch()} />
        ) : (
          <div
            className={cn(
              'overflow-hidden rounded-xl border bg-card',
              txns.isPlaceholderData && 'opacity-70',
            )}
          >
            <Table aria-label={t('transactions.title')}>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">{t('transactions.col.date')}</TableHead>
                  <TableHead>{t('transactions.col.transaction')}</TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t('transactions.col.method')}
                  </TableHead>
                  <TableHead>{t('transactions.col.status')}</TableHead>
                  <TableHead className="text-right">{t('transactions.col.amount')}</TableHead>
                  <TableHead className="hidden text-right lg:table-cell">
                    {t('transactions.col.fee')}
                  </TableHead>
                  <TableHead className="hidden pr-6 text-right sm:table-cell">
                    {t('transactions.col.net')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data
                  ? data.data.map((txn) => <TransactionRow key={txn.id} txn={txn} />)
                  : Array.from({ length: 8 }, (_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={7} className="px-6">
                          <Skeleton className="h-8" />
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
            {data?.data.length === 0 && (
              <EmptyState
                variant="plain"
                icon={HandCoins}
                title={t('transactions.empty.title')}
                description={t('transactions.empty.description')}
                className="py-12"
              />
            )}
          </div>
        )}
        {data && (
          <Pager
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            onPageChange={(page) => update({ page })}
            labels={{
              previous: t('common.previous'),
              next: t('common.next'),
              status: t('common.pageOf', { page: data.meta.page, total: data.meta.totalPages }),
            }}
          />
        )}
      </div>
    </Page>
  );
}
