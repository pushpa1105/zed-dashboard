import { useTranslation } from '@/core/i18n/use-translation';
import { StatusBadge } from '@/shared/components/display/status-badge';

import type { PurchaseOrderStatus } from '../model/inventory';

const TONE = { draft: 'neutral', sent: 'info', partial: 'warning', received: 'success' } as const;

export function PoStatusBadge({ status }: { status: PurchaseOrderStatus }) {
  const { t } = useTranslation('inventory', { keyPrefix: 'purchaseOrders.status' });
  return <StatusBadge status={status} tone={TONE[status]} label={t(status)} />;
}
