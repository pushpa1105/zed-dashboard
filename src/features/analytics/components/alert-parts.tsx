import { Info, OctagonAlert, TriangleAlert } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Tag } from '@/shared/components/display/tag';
import { toneStyle, type Tone } from '@/shared/components/display/tone';

import type { Severity } from '../model/insights';

const SEVERITY_TONE: Record<Severity, Tone> = {
  critical: 'danger',
  warning: 'warning',
  info: 'info',
};
const SEVERITY_ICON = { critical: OctagonAlert, warning: TriangleAlert, info: Info };

export function SeverityTag({ severity }: { severity: Severity }) {
  const { t } = useTranslation('analytics');
  return (
    <Tag size="sm" dot tone={SEVERITY_TONE[severity]}>
      {t(`alerts.severity.${severity}`)}
    </Tag>
  );
}

export function SeverityIcon({ severity }: { severity: Severity }) {
  const Icon = SEVERITY_ICON[severity];
  return (
    <span
      className="flex size-9 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4"
      style={toneStyle(SEVERITY_TONE[severity])}
    >
      <Icon aria-hidden />
    </span>
  );
}
