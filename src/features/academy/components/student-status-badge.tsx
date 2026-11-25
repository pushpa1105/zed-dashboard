import { useTranslation } from '@/core/i18n/use-translation';
import { StatusBadge } from '@/shared/components/display/status-badge';

import type { Student } from '../model/academy';

const TONE = { 'on-track': 'info', 'at-risk': 'danger', completed: 'success' } as const;

export function StudentStatusBadge({ status }: { status: Student['status'] }) {
  const { t } = useTranslation('academy');
  return <StatusBadge status={status} label={t(`students.status.${status}`)} tone={TONE[status]} />;
}
