import { useTranslation } from '@/core/i18n/use-translation';
import { formatDate, getInitials } from '@/shared/lib/format';
import { Separator } from '@/shared/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet';

import type { Order } from '../model/order';

import { formatCurrency } from './format';
import { OrderStatusBadge, PaidBadge } from './order-badges';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

/** Side panel opened by clicking an order row. */
export function OrderDetailSheet({
  order,
  onOpenChange,
}: {
  order: Order | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, i18n } = useTranslation('data-tables');

  return (
    <Sheet open={!!order} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        {order && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 font-mono">
                {order.number} <OrderStatusBadge status={order.status} className="font-sans" />
              </SheetTitle>
              <SheetDescription>{formatDate(order.createdAt)}</SheetDescription>
            </SheetHeader>
            <div className="space-y-6 overflow-y-auto px-4 pb-6">
              <section className="flex items-center gap-3 rounded-lg border p-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {getInitials(...order.customerName.split(' '))}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium">{order.customerName}</p>
                  <p className="truncate text-sm text-muted-foreground">{order.customerEmail}</p>
                </div>
              </section>
              <section>
                <h3 className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {t('detail.summary')}
                </h3>
                <dl className="divide-y">
                  <Row label={t('columns.channel')}>{t(`channel.${order.channel}`)}</Row>
                  <Row label={t('columns.country')}>{order.country}</Row>
                  <Row label={t('columns.items')}>{order.items}</Row>
                  <Row label={t('detail.assignee')}>{order.assignee ?? t('unassigned')}</Row>
                  <Row label={t('detail.payment')}>
                    <PaidBadge paid={order.paid} />
                  </Row>
                </dl>
              </section>
              <Separator />
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">{t('columns.total')}</span>
                <span className="text-2xl font-semibold tabular-nums">
                  {formatCurrency(order.total, i18n.language)}
                </span>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
