import { Check, FileText } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { notify } from '@/core/notify/notify';
import { StatusBadge } from '@/shared/components/display/status-badge';
import type { Tone } from '@/shared/components/display/tone';
import { Button } from '@/shared/ui/button';

import { useSalesOrderAction } from '../api/sales-api';
import { NEXT_ACTION, type SalesOrder, type SoStatus } from '../model/sales';

const TONES: Record<SoStatus, Tone> = {
  quote: 'neutral',
  confirmed: 'info',
  fulfilled: 'warning',
  invoiced: 'success',
};

export function OrderStatusBadge({ status }: { status: SoStatus }) {
  const { t } = useTranslation('erp', { keyPrefix: 'salesOrders.status' });
  return <StatusBadge status={status} tone={TONES[status]} label={t(status)} />;
}

/** Confirms a quote or invoices a fulfilled order; renders nothing otherwise. */
export function OrderActionButton({
  order,
  size = 'sm',
}: {
  order: SalesOrder;
  size?: 'sm' | 'default';
}) {
  const { t } = useTranslation('erp', { keyPrefix: 'salesOrders' });
  const mutation = useSalesOrderAction();
  const action = NEXT_ACTION[order.status];
  if (!action) return null;
  const Icon = action === 'confirm' ? Check : FileText;
  return (
    <Button
      size={size}
      variant={size === 'sm' ? 'outline' : 'default'}
      disabled={mutation.isPending}
      aria-label={t(`actions.${action}One`, { id: order.id })}
      onClick={(e) => {
        e.stopPropagation();
        mutation.mutate(
          { id: order.id, action },
          {
            onSuccess: (next) =>
              notify.success(t(`done.${action}`, { id: next.id, invoice: next.invoiceId })),
          },
        );
      }}
    >
      <Icon /> {t(`actions.${action}`)}
    </Button>
  );
}
