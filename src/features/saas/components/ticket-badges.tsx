import { useTranslation } from '@/core/i18n/use-translation';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { Tag } from '@/shared/components/display/tag';
import type { Tone } from '@/shared/components/display/tone';

import { useNow } from '../hooks/use-now';
import { duration } from '../lib/format';
import {
  SLA_WARNING_MS,
  type Ticket,
  type TicketPriority,
  type TicketStatus,
} from '../model/support';

const PRIORITY_TONE: Record<TicketPriority, Tone> = {
  low: 'neutral',
  normal: 'info',
  high: 'warning',
  urgent: 'danger',
};
const STATUS_TONE: Record<TicketStatus, Tone> = {
  open: 'info',
  pending: 'warning',
  resolved: 'success',
};

export function PriorityTag({ priority }: { priority: TicketPriority }) {
  const { t } = useTranslation('saas');
  return (
    <Tag tone={PRIORITY_TONE[priority]} dot>
      {t(`support.priority.${priority}`)}
    </Tag>
  );
}

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const { t } = useTranslation('saas');
  return (
    <StatusBadge status={status} tone={STATUS_TONE[status]} label={t(`support.status.${status}`)} />
  );
}

/** Time left until the first-response SLA, refreshed every 30 s. */
export function SlaTimer({ ticket }: { ticket: Ticket }) {
  const { t } = useTranslation('saas');
  const now = useNow();

  if (ticket.status === 'resolved') return <span className="text-muted-foreground">—</span>;
  const left = ticket.slaDueAt - now;
  const time = duration(left);
  return left < 0 ? (
    <Tag tone="danger">{t('support.sla.breached', { time })}</Tag>
  ) : (
    <Tag tone={left < SLA_WARNING_MS ? 'warning' : 'neutral'} appearance="outline">
      {t('support.sla.left', { time })}
    </Tag>
  );
}
