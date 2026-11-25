import { Banknote, MailCheck, Percent, Send, ShoppingCart } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { useSearchParams } from '@/core/router/router';
import { LineChart } from '@/shared/components/charts/line-chart';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { MeterList } from '@/shared/components/dashboard/meter-list';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { EmptyState } from '@/shared/components/display/empty-state';
import { ErrorState } from '@/shared/components/display/error-state';
import { Pager } from '@/shared/components/pager';
import { formatDate, formatRelative } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { TableCell, TableRow } from '@/shared/ui/table';

import { cartsQuery, useCarts, useSendRecoveryEmails } from '../api/marketing-api';
import { CartSheet, RecoveryBadge, RecoveryEmailButton } from '../components/cart-sheet';
import { CountTabs } from '../components/count-tabs';
import { ListTable } from '../components/list-table';
import { StatCards } from '../components/stat-cards';
import { ProductThumb } from '../components/store-badges';
import { formatMoney } from '../lib/money';
import { CART_TABS, cartsSearchSchema, type AbandonedCart } from '../model/marketing';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ request }) => {
    const params = Object.fromEntries(new URL(request.url).searchParams);
    await queryClient.prefetchQuery(cartsQuery(cartsSearchSchema.parse(params)));
    return null;
  };

const RATE_GOAL = 20;
const STATS = [
  { key: 'abandonedValue', icon: ShoppingCart, color: 'var(--chart-3)' },
  { key: 'recoveredValue', icon: Banknote, color: 'var(--chart-2)' },
  { key: 'recoveryRate', icon: Percent, color: 'var(--chart-1)' },
  { key: 'pendingEmails', icon: MailCheck, color: 'var(--chart-4)' },
] as const;
const COLUMNS = [
  { key: 'customer', className: 'pl-6' },
  { key: 'items', className: 'hidden md:table-cell' },
  { key: 'value', className: 'text-right' },
  { key: 'lastSeen', className: 'hidden sm:table-cell' },
  { key: 'recovery' },
  { key: 'action', className: 'pr-6 text-right' },
] as const;

function CartRow({ cart, onOpen }: { cart: AbandonedCart; onOpen: () => void }) {
  const { t, i18n } = useTranslation('ecommerce');
  const units = cart.items.reduce((s, it) => s + it.qty, 0);
  return (
    <TableRow className="cursor-pointer" onClick={onOpen}>
      <TableCell className="pl-6">
        <button type="button" className="font-medium hover:underline">
          {cart.customerName}
        </button>
        <p className="truncate text-xs text-muted-foreground">{cart.customerEmail}</p>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {cart.items.map((item) => (
              <ProductThumb
                key={item.productId + item.variant}
                hue={item.hue}
                size="sm"
                className="ring-2 ring-card"
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {t('carts.items', { count: units })}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-right font-medium tabular-nums">
        {formatMoney(cart.value, i18n.language)}
      </TableCell>
      <TableCell className="hidden text-muted-foreground sm:table-cell">
        {formatRelative(cart.lastSeenAt)}
      </TableCell>
      <TableCell>
        <RecoveryBadge recovery={cart.recovery} />
      </TableCell>
      <TableCell className="pr-6 text-right">
        <RecoveryEmailButton cart={cart} />
      </TableCell>
    </TableRow>
  );
}

/** Abandoned checkouts with recovery emails, recovery-rate trend and cart details. */
export default function AbandonedCartsPage() {
  const { t, i18n } = useTranslation('ecommerce');
  const [params, setParams] = useSearchParams();
  const search = useMemo(() => cartsSearchSchema.parse(Object.fromEntries(params)), [params]);
  const carts = useCarts(search);
  const sendAll = useSendRecoveryEmails();
  const [openId, setOpenId] = useState<string | null>(null);
  const data = carts.data;
  const money = (n: number) => formatMoney(n, i18n.language, 0);
  const percent = (n: number) => `${n.toFixed(1)}%`;
  const format = {
    abandonedValue: money,
    recoveredValue: money,
    recoveryRate: percent,
    pendingEmails: String,
  };
  const pending = data?.summary.pendingEmails ?? 0;

  const update = (patch: { status?: string; page?: number }) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries({ page: 1, ...patch })) {
          if (value === 'all' || value === 1) next.delete(key);
          else next.set(key, String(value));
        }
        return next;
      },
      { replace: true },
    );

  return (
    <Page
      width="full"
      title={t('carts.title')}
      description={t('carts.description')}
      actions={
        <ConfirmDialog
          trigger={
            <Button disabled={!pending}>
              <Send /> {t('carts.sendAll', { count: pending })}
            </Button>
          }
          title={t('carts.confirm.title')}
          description={t('carts.confirm.description', { count: pending })}
          confirmLabel={t('carts.confirm.submit')}
          cancelLabel={t('common.cancel')}
          pending={sendAll.isPending}
          onConfirm={() => sendAll.mutateAsync(undefined)}
        />
      }
    >
      <StatCards
        loading={!data}
        items={STATS.map(({ key, icon, color }) => ({
          key,
          icon,
          color,
          label: t(`carts.stats.${key}`),
          value: data && format[key](data.summary[key]),
        }))}
      />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <SectionCard
          className="min-w-0 lg:col-span-2"
          title={t('carts.chart.title')}
          description={t('carts.chart.description')}
        >
          {data ? (
            <LineChart
              data={data.weekly.map((w) => ({ ...w, label: formatDate(w.week, 'MMM D') }))}
              xKey="label"
              series={[{ key: 'rate', label: t('carts.chart.rate'), color: 'var(--chart-1)' }]}
              target={{ value: RATE_GOAL, label: t('carts.chart.goal') }}
              valueFormatter={percent}
              dots
              className="h-64"
            />
          ) : (
            <Skeleton className="h-64" />
          )}
        </SectionCard>
        <SectionCard title={t('carts.funnel.title')} description={t('carts.funnel.description')}>
          {data ? (
            <MeterList
              items={(['all', 'sent', 'recovered'] as const).map((key) => {
                const value =
                  key === 'sent' ? data.counts.sent + data.counts.recovered : data.counts[key];
                return {
                  key,
                  label: t(`carts.funnel.${key}`),
                  value,
                  max: data.counts.all,
                  display: `${value} · ${percent((value / data.counts.all) * 100)}`,
                };
              })}
            />
          ) : (
            <Skeleton className="h-40" />
          )}
        </SectionCard>
      </div>

      <div className="space-y-4">
        <CountTabs
          value={search.status}
          onChange={(status) => update({ status })}
          tabs={CART_TABS.map((value) => ({
            value,
            label: t(`carts.tabs.${value}`),
            count: data?.counts[value],
          }))}
        />
        {carts.isError ? (
          <ErrorState title={t('common.error')} onRetry={() => void carts.refetch()} />
        ) : (
          <ListTable
            label={t('carts.title')}
            faded={carts.isPlaceholderData}
            columns={COLUMNS.map((col) => ({ ...col, label: t(`carts.col.${col.key}`) }))}
            rows={data?.data.map((cart) => (
              <CartRow key={cart.id} cart={cart} onOpen={() => setOpenId(cart.id)} />
            ))}
            empty={
              data?.data.length === 0 && (
                <EmptyState
                  variant="plain"
                  icon={ShoppingCart}
                  title={t('carts.empty.title')}
                  description={t('carts.empty.description')}
                  className="py-12"
                />
              )
            }
          />
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

      <CartSheet cart={data?.data.find((c) => c.id === openId)} onClose={() => setOpenId(null)} />
    </Page>
  );
}
