import { useTranslation } from '@/core/i18n/use-translation';
import { Tag } from '@/shared/components/display/tag';
import type { Tone } from '@/shared/components/display/tone';

import type { AuditEvent } from '../model/admin';

const TONE: Record<AuditEvent['severity'], Tone> = {
  info: 'neutral',
  warning: 'warning',
  critical: 'danger',
};

export function SeverityTag({ severity }: { severity: AuditEvent['severity'] }) {
  const { t } = useTranslation('saas');
  return (
    <Tag tone={TONE[severity]} dot>
      {t(`audit.severity.${severity}`)}
    </Tag>
  );
}
