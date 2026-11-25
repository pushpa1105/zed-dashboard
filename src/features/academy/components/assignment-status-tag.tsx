import { useTranslation } from '@/core/i18n/use-translation';
import { Tag } from '@/shared/components/display/tag';

import { assignmentStatus, type Assignment } from '../model/academy';

const TONE = { open: 'info', grading: 'warning', closed: 'neutral' } as const;

export function AssignmentStatusTag({ assignment }: { assignment: Assignment }) {
  const { t } = useTranslation('academy');
  const status = assignmentStatus(assignment);
  return (
    <Tag tone={TONE[status]} size="sm" dot>
      {t(`assignments.status.${status}`)}
    </Tag>
  );
}
