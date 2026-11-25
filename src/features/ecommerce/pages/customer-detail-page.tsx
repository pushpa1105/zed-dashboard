import { ArrowLeft, Mail, MapPin, Phone, ShoppingBag } from 'lucide-react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link, useParams } from '@/core/router/router';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';
import { EmptyState } from '@/shared/components/display/empty-state';
import { ErrorState } from '@/shared/components/display/error-state';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { Tag } from '@/shared/components/display/tag';
import { formatDate, formatRelative } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { customerQuery, useAddCustomerNote, useCustomer } from '../api/store-api';
import { NoteForm } from '../components/note-form';
import { OrderStatusBadge, PaymentBadge } from '../components/store-badges';
import { formatMoney } from '../lib/money';
import { SEGMENT_TONE, type CustomerDetail } from '../model/store';
import { ecommerceRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ params }) => {
    await queryClient.prefetchQuery(customerQuery(params.customerId!));
    return null;
  };

/** Order value per calendar month over the last year, oldest first. */
function monthlySpend(history: CustomerDetail['history']) {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const start = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1).getTime();
    const end = new Date(now.getFullYear(), now.getMonth() - 10 + i, 1).getTime();
    return {
      month: formatDate(start, 'MMM'),
      value: history
        .filter((o) => o.createdAt >= start && o.createdAt < end && o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.total, 0),
    };
  });
}

function OrderHistory({ orders }: { orders: CustomerDetail['history'] }) {
  const { t, i18n } = useTranslation('ecommerce');
  if (!orders.length)
    return <EmptyState variant="plain" icon={ShoppingBag} title={t('customer.noOrders')} />;

  return (
    <Table aria-label={t('customer.history')}>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-6">{t('orders.col.order')}</TableHead>
          <TableHead className="hidden sm:table-cell">{t('orders.col.date')}</TableHead>
          <TableHead>{t('orders.col.fulfilment')}</TableHead>
          <TableHead className="hidden md:table-cell">{t('orders.col.payment')}</TableHead>
          <TableHead className="pr-6 text-right">{t('orders.col.total')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="pl-6 font-medium">
              <Link
                to={ecommerceRoutes.order.href({ orderId: order.id })}
                className="tabular-nums hover:underline"
              >
                {order.number}
              </Link>
            </TableCell>
            <TableCell className="hidden text-muted-foreground sm:table-cell">
              {formatDate(order.createdAt, 'MMM D, YYYY')}
            </TableCell>
            <TableCell>
              <OrderStatusBadge status={order.status} />
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <PaymentBadge payment={order.payment} />
            </TableCell>
            <TableCell className="pr-6 text-right font-medium tabular-nums">
              {formatMoney(order.total, i18n.language)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Customer profile: lifetime value, spend trend, order history, addresses and team notes. */
export default function CustomerDetailPage() {
  const { t, i18n } = useTranslation('ecommerce');
  const { customerId = '' } = useParams();
  const customer = useCustomer(customerId);
  const addNote = useAddCustomerNote();
  const money = (n: number, digits?: number) => formatMoney(n, i18n.language, digits);

  const back = (
    <Button variant="ghost" size="sm" asChild className="-ml-2">
      <Link to={ecommerceRoutes.customers.href()}>
        <ArrowLeft /> {t('customer.back')}
      </Link>
    </Button>
  );

  if (customer.isError) {
    return (
      <Page width="full" title={t('customer.notFound')}>
        {back}
        <ErrorState
          title={t('customer.notFound')}
          description={t('common.error')}
          onRetry={() => void customer.refetch()}
        />
      </Page>
    );
  }

  const c = customer.data;
  if (!c) {
    return (
      <Page width="full" title={t('customers.loading')}>
        <div className="grid gap-6 lg:grid-cols-3" aria-busy="true">
          <Skeleton className="h-96 rounded-xl lg:col-span-2" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </Page>
    );
  }

  return (
    <Page
      width="full"
      title={c.name}
      description={t('customers.since', { date: formatDate(c.joinedAt, 'MMMM YYYY') })}
      actions={
        <Button variant="outline" asChild>
          <a href={`mailto:${c.email}`}>
            <Mail /> {t('customer.email')}
          </a>
        </Button>
      }
    >
      <div className="-mt-2 flex flex-wrap items-center gap-2">
        {back}
        <Tag tone={SEGMENT_TONE[c.segment]}>{t(`segments.${c.segment}`)}</Tag>
        <Tag tone={c.acceptsMarketing ? 'success' : 'neutral'} appearance="outline">
          {c.acceptsMarketing ? t('customers.subscribed') : t('customers.notSubscribed')}
        </Tag>
      </div>

      <div className="rounded-xl border bg-card px-6 py-2">
        <StatStrip
          items={[
            { key: 'ltv', label: t('customer.ltv'), value: money(c.spent) },
            { key: 'orders', label: t('customers.col.orders'), value: c.orders },
            { key: 'aov', label: t('customers.aov'), value: money(c.spent / c.orders, 0) },
            {
              key: 'last',
              label: t('customers.col.lastOrder'),
              value: formatRelative(c.lastOrderAt),
              hint: formatDate(c.lastOrderAt, 'MMM D, YYYY'),
            },
          ]}
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <SectionCard title={t('customer.spend')} description={t('customer.spendHint')}>
            <BarChart
              data={monthlySpend(c.history)}
              xKey="month"
              series={[{ key: 'value', label: t('customer.ltv'), color: 'var(--chart-1)' }]}
              highlight="last"
              hideGrid
              radius={6}
              valueFormatter={(v) => money(v, 0)}
              className="h-56"
            />
          </SectionCard>
          <SectionCard
            flush
            title={t('customer.history')}
            description={t('customer.historyHint', { count: c.history.length })}
          >
            <OrderHistory orders={c.history} />
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title={t('customer.contact')}>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <InitialsAvatar name={c.name} size="xs" /> {c.name}
              </li>
              <li className="flex items-center gap-3 break-all">
                <Mail className="size-4 shrink-0 text-muted-foreground" /> {c.email}
              </li>
              <li className="flex items-center gap-3">
                <Phone className="size-4 shrink-0 text-muted-foreground" /> {c.phone}
              </li>
            </ul>
          </SectionCard>

          <SectionCard title={t('customer.addresses')}>
            <ul className="space-y-4">
              {c.addresses.map((a) => (
                <li key={a.id} className="flex gap-3 text-sm">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="flex items-center gap-2 font-medium">
                      {t(`customer.address.${a.label}`)}
                      {a.isDefault && (
                        <Tag size="sm" tone="primary">
                          {t('customer.address.default')}
                        </Tag>
                      )}
                    </p>
                    <address className="leading-relaxed text-muted-foreground not-italic">
                      {a.line1}
                      <br />
                      {a.zip} {a.city}, {a.country}
                    </address>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title={t('customer.notes')} description={t('customer.notesHint')}>
            <NoteForm
              pending={addNote.isPending}
              onSubmit={(text, reset) => addNote.mutate({ id: c.id, text }, { onSuccess: reset })}
            />
            {c.notes.length ? (
              <ul className="mt-5 space-y-4">
                {c.notes.map((note) => (
                  <li key={note.id} className="rounded-lg bg-muted/50 p-3 text-sm">
                    <p>{note.text}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {note.author} · {formatRelative(note.at)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">{t('customer.noNotes')}</p>
            )}
          </SectionCard>
        </div>
      </div>
    </Page>
  );
}
