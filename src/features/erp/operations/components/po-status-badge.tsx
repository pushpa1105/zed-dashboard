import { useTranslation } from '@/core/i18n/use-translation';
import { StatusBadge } from '@/shared/components/display/status-badge';
import type { Tone } from '@/shared/components/display/tone';

import type { PoStatus } from '../model/operations';

const TONES: Record<PoStatus, Tone> = {
  draft: 'neutral',
  approved: 'info',
  received: 'success',
  closed: 'primary',
};

export function PoStatusBadge({ status }: { status: PoStatus }) {
  const { t } = useTranslation('erp', { keyPrefix: 'purchaseOrders.status' });
  return <StatusBadge status={status} tone={TONES[status]} label={t(status)} />;
}
