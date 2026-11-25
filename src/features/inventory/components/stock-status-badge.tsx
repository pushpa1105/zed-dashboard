import { useTranslation } from '@/core/i18n/use-translation';
import { StatusBadge } from '@/shared/components/display/status-badge';

import type { StockStatus } from '../model/inventory';

const TONE = { ok: 'success', low: 'warning', out: 'danger' } as const;

/** In stock / Low / Out of stock, always as dot + label. */
export function StockStatusBadge({
  status,
  variant = 'badge',
}: {
  status: StockStatus;
  variant?: 'badge' | 'dot';
}) {
  const { t } = useTranslation('inventory', { keyPrefix: 'status' });
  return <StatusBadge status={status} tone={TONE[status]} label={t(status)} variant={variant} />;
}
