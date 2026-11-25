import {
  ArrowLeft,
  Ban,
  CircleDollarSign,
  CreditCard,
  MapPin,
  MessageSquareText,
  Package,
  PackageCheck,
  Receipt,
  RotateCcw,
  ShoppingCart,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link, useParams } from '@/core/router/router';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { CopyButton } from '@/shared/components/display/copy-button';
import { ErrorState } from '@/shared/components/display/error-state';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { Tag } from '@/shared/components/display/tag';
import { Timeline } from '@/shared/components/display/timeline';
import type { Tone } from '@/shared/components/display/tone';
import { formatDate, formatRelative } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Separator } from '@/shared/ui/separator';
import { Skeleton } from '@/shared/ui/skeleton';

import { orderQuery, useAddOrderNote, useOrder, useSetOrderStatus } from '../api/store-api';
import { NoteForm } from '../components/note-form';
import { RefundDialog } from '../components/refund-dialog';
import { OrderStatusBadge, PaymentBadge, ProductThumb } from '../components/store-badges';
import { formatMoney } from '../lib/money';
import type { OrderEvent } from '../model/store';
import { ecommerceRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ params }) => {
    await queryClient.prefetchQuery(orderQuery(params.orderId!));
    return null;
  };

const EVENT_META: Record<OrderEvent['type'], { icon: LucideIcon; tone: Tone }> = {
  placed: { icon: ShoppingCart, tone: 'neutral' },
  paid: { icon: CircleDollarSign, tone: 'success' },
  packed: { icon: Package, tone: 'violet' },
  shipped: { icon: Truck, tone: 'blue' },
  delivered: { icon: PackageCheck, tone: 'success' },
  note: { icon: MessageSquareText, tone: 'neutral' },
  refund: { icon: RotateCcw, tone: 'danger' },
  cancelled: { icon: Ban, tone: 'danger' },
};

function SummaryRow({
  label,
  value,
  strong,
  muted,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className={muted ? 'text-muted-foreground' : undefined}>{label}</span>
      <span className={strong ? 'text-base font-semibold tabular-nums' : 'tabular-nums'}>
        {value}
      </span>
    </div>
  );
}

/** One order: line items and money, fulfilment, history with notes, customer and payment. */
export default function OrderDetailPage() {
  const { t, i18n } = useTranslation('ecommerce');
  const { orderId = '' } = useParams();
  const order = useOrder(orderId);
  const setStatus = useSetOrderStatus();
  const addNote = useAddOrderNote();
  const [refundOpen, setRefundOpen] = useState(false);
  const money = (n: number) => formatMoney(n, i18n.language);

  const back = (
    <Button variant="ghost" size="sm" asChild className="-ml-2">
      <Link to={ecommerceRoutes.orders.href()}>
        <ArrowLeft /> {t('order.back')}
      </Link>
    </Button>
  );

  if (order.isError) {
    return (
      <Page width="full" title={t('order.notFound')}>
        {back}
        <ErrorState
          title={t('order.notFound')}
          description={t('common.error')}
          onRetry={() => void order.refetch()}
        />
      </Page>
    );
  }

  const data = order.data;
  if (!data) {
    return (
      <Page width="full" title={t('order.loading')}>
        <div className="grid gap-6 lg:grid-cols-3" aria-busy="true">
          <Skeleton className="h-96 rounded-xl lg:col-span-2" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </Page>
    );
  }

  const canShip = data.status === 'pending' || data.status === 'processing';
  const canDeliver = data.status === 'shipped';
  const refundable = data.total - data.refunded;

  return (
    <Page
      width="full"
      title={t('order.title', { number: data.number })}
      description={t('order.placed', {
        date: formatDate(data.createdAt, 'MMMM D, YYYY [at] h:mm A'),
        channel: t(`channel.${data.channel}`),
      })}
      actions={
        <>
          <Button
            variant="outline"
            disabled={refundable <= 0 || data.status === 'cancelled'}
            onClick={() => setRefundOpen(true)}
          >
            <RotateCcw /> {t('order.refund')}
          </Button>
          {canShip && (
            <Button
              disabled={setStatus.isPending}
              onClick={() => setStatus.mutate({ ids: [data.id], status: 'shipped' })}
            >
              <Truck /> {t('order.markShipped')}
            </Button>
          )}
          {canDeliver && (
            <Button
              disabled={setStatus.isPending}
              onClick={() => setStatus.mutate({ ids: [data.id], status: 'delivered' })}
            >
              <PackageCheck /> {t('order.markDelivered')}
            </Button>
          )}
        </>
      }
    >
      <div className="-mt-2 flex flex-wrap items-center gap-2">
        {back}
        <Separator orientation="vertical" className="h-5" />
        <OrderStatusBadge status={data.status} />
        <PaymentBadge payment={data.payment} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <SectionCard
            title={t('order.items', { count: data.items.length })}
            flush
            footer={
              <div className="ml-auto max-w-xs space-y-2 text-foreground">
                <SummaryRow label={t('order.subtotal')} value={money(data.subtotal)} muted />
                {data.discount > 0 && (
                  <SummaryRow
                    label={t('order.discount')}
                    value={`−${money(data.discount)}`}
                    muted
                  />
                )}
                <SummaryRow
                  label={t('order.shipping')}
                  value={data.shipping ? money(data.shipping) : t('order.free')}
                  muted
                />
                <SummaryRow label={t('order.tax')} value={money(data.tax)} muted />
                <Separator />
                <SummaryRow label={t('order.total')} value={money(data.total)} strong />
                {data.refunded > 0 && (
                  <>
                    <SummaryRow
                      label={t('order.refunded')}
                      value={`−${money(data.refunded)}`}
                      muted
                    />
                    <SummaryRow label={t('order.net')} value={money(data.total - data.refunded)} />
                  </>
                )}
              </div>
            }
          >
            <ul className="divide-y border-t">
              {data.items.map((item) => (
                <li
                  key={`${item.productId}-${item.sku}`}
                  className="flex items-center gap-4 px-6 py-4"
                >
                  <ProductThumb hue={item.hue} />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={ecommerceRoutes.product.href({ productId: item.productId })}
                      className="truncate text-sm font-medium hover:underline"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {item.variant} · {item.sku}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {money(item.price)} × {item.qty}
                  </span>
                  <span className="w-24 text-right text-sm font-medium tabular-nums">
                    {money(item.price * item.qty)}
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard
            title={t('order.fulfilment')}
            description={
              data.carrier ? t('order.carrier', { carrier: data.carrier }) : t('order.notShipped')
            }
          >
            {data.tracking ? (
              <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 px-4 py-3">
                <Truck className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t('order.tracking')}</span>
                <code className="font-mono text-sm">{data.tracking}</code>
                <CopyButton value={data.tracking} label={t('order.copy')} className="ml-auto" />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('order.awaiting')}</p>
            )}
          </SectionCard>

          <SectionCard title={t('order.timeline')} description={t('order.timelineHint')}>
            <NoteForm
              pending={addNote.isPending}
              onSubmit={(text, reset) =>
                addNote.mutate({ id: data.id, text }, { onSuccess: reset })
              }
            />
            <Timeline
              className="mt-6"
              items={data.events.map((event) => ({
                key: event.id,
                title: event.text,
                description: event.author,
                time: formatRelative(event.at),
                icon: EVENT_META[event.type].icon,
                tone: EVENT_META[event.type].tone,
              }))}
            />
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title={t('order.customer')}>
            <div className="flex items-center gap-3">
              <InitialsAvatar name={data.customer.name} size="md" />
              <div className="min-w-0">
                <p className="truncate font-medium">{data.customer.name}</p>
                <p className="truncate text-sm text-muted-foreground">{data.customer.email}</p>
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">{t('order.lifetimeOrders')}</dt>
                <dd className="font-medium tabular-nums">{data.customer.orders}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t('order.lifetimeSpend')}</dt>
                <dd className="font-medium tabular-nums">{money(data.customer.spent)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t('order.phone')}</dt>
                <dd className="tabular-nums">{data.customer.phone}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t('order.segment')}</dt>
                <dd>
                  <Tag size="sm" tone={data.customer.segment === 'vip' ? 'violet' : 'neutral'}>
                    {t(`segments.${data.customer.segment as 'vip'}`)}
                  </Tag>
                </dd>
              </div>
            </dl>
            <Button variant="outline" size="sm" className="mt-5 w-full" asChild>
              <Link to={ecommerceRoutes.customer.href({ customerId: data.customer.id })}>
                {t('order.viewCustomer')}
              </Link>
            </Button>
          </SectionCard>

          <SectionCard title={t('order.shippingAddress')}>
            <div className="flex gap-3 text-sm">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <address className="leading-relaxed not-italic">
                {data.customer.name}
                <br />
                {data.shippingAddress.line1}
                <br />
                {data.shippingAddress.zip} {data.shippingAddress.city}
                <br />
                {data.shippingAddress.country}
              </address>
            </div>
          </SectionCard>

          <SectionCard title={t('order.payment')}>
            <div className="flex items-center gap-3 text-sm">
              <span className="flex size-9 items-center justify-center rounded-md border bg-muted/40">
                <CreditCard className="size-4" />
              </span>
              <div>
                <p className="font-medium">
                  {data.paymentMethod.brand} •••• {data.paymentMethod.last4}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('order.charged', { amount: money(data.total) })}
                </p>
              </div>
              <Receipt className="ml-auto size-4 text-muted-foreground" />
            </div>
          </SectionCard>
        </div>
      </div>

      <RefundDialog
        open={refundOpen}
        onOpenChange={setRefundOpen}
        orderId={data.id}
        max={refundable}
      />
    </Page>
  );
}
