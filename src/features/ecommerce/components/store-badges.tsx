import { Package } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { StatusBadge } from '@/shared/components/display/status-badge';
import type { Tone } from '@/shared/components/display/tone';
import { cn } from '@/shared/lib/cn';

import { stockLevel, type OrderStatus, type PAYMENT_STATES } from '../model/store';

const ORDER_TONE: Record<OrderStatus, Tone> = {
  pending: 'warning',
  processing: 'info',
  shipped: 'blue',
  delivered: 'success',
  cancelled: 'neutral',
  refunded: 'danger',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useTranslation('ecommerce');
  return <StatusBadge status={status} tone={ORDER_TONE[status]} label={t(`status.${status}`)} />;
}

const PAYMENT_TONE: Record<(typeof PAYMENT_STATES)[number], Tone> = {
  paid: 'success',
  pending: 'warning',
  refunded: 'neutral',
  partially_refunded: 'orange',
};

export function PaymentBadge({ payment }: { payment: (typeof PAYMENT_STATES)[number] }) {
  const { t } = useTranslation('ecommerce');
  return (
    <StatusBadge
      status={payment}
      tone={PAYMENT_TONE[payment]}
      variant="dot"
      label={t(`payment.${payment}`)}
    />
  );
}

export function StockBadge({ stock }: { stock: number }) {
  const { t } = useTranslation('ecommerce');
  const level = stockLevel(stock);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs tabular-nums',
        level === 'out' && 'text-destructive',
        level === 'low' && 'text-foreground',
        level === 'in' && 'text-muted-foreground',
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          level === 'out' ? 'bg-destructive' : level === 'low' ? 'bg-warning' : 'bg-success',
        )}
      />
      {level === 'out' ? t('stock.out') : t('stock.count', { count: stock })}
    </span>
  );
}

/**
 * Product image stand-in: a tile tinted with one of the chart tokens (picked
 * from the product's hue), so catalog screens have visual rhythm without
 * shipping photos and still follow the theme.
 */
export function ProductThumb({
  hue,
  size = 'md',
  className,
}: {
  hue: number;
  size?: 'sm' | 'md' | 'lg' | 'fill';
  className?: string;
}) {
  const tint = `var(--chart-${(Math.floor(hue / 72) % 5) + 1})`;
  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg ring-1 ring-foreground/5 ring-inset',
        size === 'sm' && 'size-9',
        size === 'md' && 'size-11',
        size === 'lg' && 'size-16 rounded-xl',
        size === 'fill' && 'aspect-[4/3] w-full rounded-none',
        className,
      )}
      style={{
        background: `linear-gradient(140deg, color-mix(in oklab, ${tint} 14%, var(--card)), color-mix(in oklab, ${tint} 32%, var(--card)))`,
        color: `color-mix(in oklab, ${tint} 75%, var(--foreground))`,
      }}
    >
      <Package className={cn(size === 'fill' ? 'size-10 opacity-60' : 'size-4 opacity-70')} />
    </span>
  );
}
