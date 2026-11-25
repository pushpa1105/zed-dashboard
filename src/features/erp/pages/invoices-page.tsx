import { Clock3, HandCoins, Plus, X } from 'lucide-react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { useNavigate, useSearchParams } from '@/core/router/router';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';

import { invoicesQuery, useInvoices } from '../api/erp-api';
import { ErrorPanel } from '../components/error-panel';
import { BUCKET_COLOR } from '../lib/aging';
import { money, moneyCompact, moneyWhole, shortDate } from '../lib/money';
import {
  AGING_BUCKETS,
  INVOICE_STATUSES,
  type AgingBucket,
  type InvoiceFilters,
  type InvoiceStatus,
} from '../model/erp';
import { erpRoutes } from '../routes';

function parseFilters(params: URLSearchParams): InvoiceFilters {
  const status = params.get('status');
  const bucket = params.get('bucket');
  return {
    status: INVOICE_STATUSES.includes(status as InvoiceStatus)
      ? (status as InvoiceStatus)
      : undefined,
    bucket: AGING_BUCKETS.includes(bucket as AgingBucket) ? (bucket as AgingBucket) : undefined,
  };
}

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ request }) => {
    await queryClient.prefetchQuery(invoicesQuery(parseFilters(new URL(request.url).searchParams)));
    return null;
  };

/** Accounts receivable: aging distribution as a clickable bar, then the invoice list. */
export default function InvoicesPage() {
  const { t } = useTranslation('erp', { keyPrefix: 'invoices' });
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const filters = parseFilters(params);
  const invoices = useInvoices(filters);
  const data = invoices.data;

  const outstanding = data?.buckets.reduce((s, b) => s + b.amount, 0) ?? 0;
  const overdue =
    data?.buckets.filter((b) => b.key !== 'current').reduce((s, b) => s + b.amount, 0) ?? 0;

  const setFilter = (patch: Partial<InvoiceFilters>) => {
    const next = { ...filters, ...patch };
    const search: Record<string, string> = {};
    if (next.status) search.status = next.status;
    if (next.bucket) search.bucket = next.bucket;
    setParams(search, { replace: true });
  };

  return (
    <Page
      title={t('title')}
      description={t('description')}
      width="full"
      actions={
        <Button>
          <Plus /> {t('new')}
        </Button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <SectionCard title={t('aging.title')} description={t('aging.description')}>
          {!data ? (
            <Skeleton className="h-28 w-full" />
          ) : (
            <div className="space-y-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('aging.outstanding')}</p>
                  <p className="text-3xl font-semibold tracking-tight tabular-nums">
                    {moneyWhole(outstanding)}
                  </p>
                </div>
                {filters.bucket && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilter({ bucket: undefined })}
                  >
                    <X /> {t('aging.clear')}
                  </Button>
                )}
              </div>
              <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full" aria-hidden>
                {data.buckets.map((b) => (
                  <div
                    key={b.key}
                    style={{
                      width: `${outstanding ? (b.amount / outstanding) * 100 : 0}%`,
                      background: BUCKET_COLOR[b.key],
                    }}
                    className={cn(
                      'h-full transition-opacity',
                      filters.bucket && filters.bucket !== b.key && 'opacity-25',
                    )}
                  />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {data.buckets.map((b) => {
                  const active = filters.bucket === b.key;
                  return (
                    <button
                      key={b.key}
                      type="button"
                      onClick={() =>
                        setFilter({ bucket: active ? undefined : b.key, status: undefined })
                      }
                      aria-pressed={active}
                      className={cn(
                        'rounded-lg border p-3 text-left transition-colors hover:bg-muted/50',
                        active && 'border-primary bg-primary/5 ring-2 ring-primary/20',
                      )}
                    >
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span
                          className="size-2 rounded-full"
                          style={{ background: BUCKET_COLOR[b.key] }}
                        />
                        {t(`aging.buckets.${b.key}`)}
                      </span>
                      <span className="mt-1 block font-semibold tabular-nums">
                        {moneyCompact(b.amount)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t('aging.count', { count: b.count })}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </SectionCard>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
          <StatCard
            variant="tile"
            icon={HandCoins}
            color="var(--chart-2)"
            label={t('kpis.collected')}
            value={data ? moneyCompact(data.collectedThisMonth) : '—'}
            loading={!data}
          />
          <StatCard
            variant="tile"
            icon={Clock3}
            color="var(--destructive)"
            label={t('kpis.overdue')}
            value={moneyCompact(overdue)}
            loading={!data}
          />
          <StatCard
            variant="tile"
            icon={Clock3}
            color="var(--chart-4)"
            label={t('kpis.dso')}
            value={data ? t('kpis.days', { count: data.averageDaysToPay }) : '—'}
            loading={!data}
            className="sm:col-span-2 xl:col-span-1"
          />
        </div>
      </div>

      <SectionCard
        flush
        title={t('list.title')}
        action={
          <Tabs
            value={filters.status ?? 'all'}
            onValueChange={(value) =>
              setFilter({
                status: value === 'all' ? undefined : (value as InvoiceStatus),
                bucket: undefined,
              })
            }
          >
            <TabsList>
              <TabsTrigger value="all">{t('status.all')}</TabsTrigger>
              {INVOICE_STATUSES.map((s) => (
                <TabsTrigger key={s} value={s}>
                  {t(`status.${s}`)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        }
      >
        {invoices.isError ? (
          <ErrorPanel className="m-6" onRetry={() => void invoices.refetch()} />
        ) : !data ? (
          <div className="space-y-2 px-6 pb-6">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : (
          <div className={cn('border-t', invoices.isPlaceholderData && 'opacity-60')}>
            <Table aria-label={t('list.title')}>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">{t('columns.invoice')}</TableHead>
                  <TableHead>{t('columns.customer')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('columns.issued')}</TableHead>
                  <TableHead>{t('columns.due')}</TableHead>
                  <TableHead>{t('columns.status')}</TableHead>
                  <TableHead className="text-right">{t('columns.amount')}</TableHead>
                  <TableHead className="pr-6 text-right">{t('columns.balance')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.invoices.map((inv) => (
                  <TableRow
                    key={inv.id}
                    className="cursor-pointer"
                    onClick={() => void navigate(erpRoutes.invoice.href({ invoiceId: inv.id }))}
                  >
                    <TableCell className="pl-6 font-mono text-xs font-medium">{inv.id}</TableCell>
                    <TableCell>
                      <p className="font-medium">{inv.customer}</p>
                      <p className="text-xs text-muted-foreground">{inv.terms}</p>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {shortDate(inv.issued)}
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">{shortDate(inv.due)}</span>
                      {inv.status === 'overdue' && (
                        <p className="text-xs font-medium text-destructive">
                          {t('daysLate', { count: inv.daysOverdue })}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={inv.status} label={t(`status.${inv.status}`)} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{money(inv.amount)}</TableCell>
                    <TableCell className="pr-6 text-right font-medium tabular-nums">
                      {money(inv.amount - inv.paid)}
                    </TableCell>
                  </TableRow>
                ))}
                {data.invoices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      {t('list.empty')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
    </Page>
  );
}
