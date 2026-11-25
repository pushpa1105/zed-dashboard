import { useTranslation } from '@/core/i18n/use-translation';
import { Tag } from '@/shared/components/display/tag';
import type { Tone } from '@/shared/components/display/tone';
import { cn } from '@/shared/lib/cn';
import { Progress } from '@/shared/ui/progress';

import { percent, signedPercent } from '../lib/format';
import { SIGNIFICANCE } from '../lib/stats';
import type { ExperimentStatus } from '../model/analytics';

const STATUS_TONE: Record<ExperimentStatus, Tone> = {
  running: 'info',
  completed: 'success',
  paused: 'warning',
  draft: 'neutral',
};

export function ExperimentStatusTag({ status }: { status: ExperimentStatus }) {
  const { t } = useTranslation('analytics');
  return (
    <Tag size="sm" dot tone={STATUS_TONE[status]}>
      {t(`experiments.status.${status}`)}
    </Tag>
  );
}

/** Lift colored by direction, muted while the result isn't significant. */
export function Lift({ lift, confidence }: { lift: number; confidence: number }) {
  return (
    <span
      className={cn(
        'font-medium tabular-nums',
        confidence < SIGNIFICANCE
          ? 'text-muted-foreground'
          : lift > 0
            ? 'text-success'
            : 'text-destructive',
      )}
    >
      {signedPercent(lift)}
    </span>
  );
}

export function ConfidenceMeter({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-28 items-center gap-2">
      <Progress
        value={value}
        aria-label={label}
        className={cn('h-1.5 flex-1', value >= SIGNIFICANCE && '[&>*]:bg-success')}
      />
      <span className="w-10 text-right text-xs tabular-nums">{percent(value, 0)}</span>
    </div>
  );
}
