import { CircleCheck, CircleDashed } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { cn } from '@/shared/lib/cn';

import type { OrderStatus } from '../model/order';

/** Status → token color. The label always accompanies the dot (never color alone). */
const STATUS_TONE: Record<OrderStatus, string> = {
  pending: 'var(--warning)',
  processing: 'var(--info)',
  shipped: 'var(--primary)',
  delivered: 'var(--success)',
  cancelled: 'var(--muted-foreground)',
  refunded: 'var(--destructive)',
};

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  const { t } = useTranslation('data-tables');
  const tone = STATUS_TONE[status];
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1.5 rounded-full px-2 text-xs font-medium',
        className,
      )}
      style={{
        color: `color-mix(in srgb, ${tone} 80%, var(--foreground))`,
        background: `color-mix(in srgb, ${tone} 12%, transparent)`,
      }}
    >
      <span className="size-1.5 rounded-full" style={{ background: tone }} />
      {t(`status.${status}`)}
    </span>
  );
}

export function PaidBadge({ paid }: { paid: boolean }) {
  const { t } = useTranslation('data-tables');
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs',
        paid ? 'text-foreground' : 'text-muted-foreground',
      )}
    >
      {paid ? (
        <CircleCheck className="size-3.5 text-success" />
      ) : (
        <CircleDashed className="size-3.5" />
      )}
      {paid ? t('paid.yes') : t('paid.no')}
    </span>
  );
}
