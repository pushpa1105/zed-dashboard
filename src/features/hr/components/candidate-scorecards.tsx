import { ClipboardList } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { EmptyState } from '@/shared/components/display/empty-state';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { cn } from '@/shared/lib/cn';

import { longDate } from '../lib/format';
import type { Scorecard } from '../model/hr';

const MAX_SCORE = 5;
const RECOMMENDATION_TONE = {
  strongYes: 'success',
  yes: 'info',
  no: 'warning',
  strongNo: 'danger',
} as const;

function ScorecardItem({ card }: { card: Scorecard }) {
  const { t } = useTranslation('hr');
  return (
    <article className="space-y-4 rounded-lg border p-4">
      <header className="flex flex-wrap items-start gap-3">
        <InitialsAvatar name={card.interviewer} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{card.interviewer}</p>
          <p className="text-xs text-muted-foreground">
            {card.interviewerTitle} · {t(`recruitment.stages.${card.stage}`)} ·{' '}
            {longDate(card.date)}
          </p>
        </div>
        <StatusBadge
          status={card.recommendation}
          tone={RECOMMENDATION_TONE[card.recommendation]}
          label={t(`candidate.recommendation.${card.recommendation}`)}
        />
      </header>
      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {card.scores.map(({ criterion, score }) => (
          <div key={criterion} className="flex items-center gap-3 text-sm">
            <dt className="w-32 shrink-0 text-muted-foreground">
              {t(`candidate.criteria.${criterion}`)}
            </dt>
            <dd className="flex flex-1 items-center gap-1" aria-label={`${score}/${MAX_SCORE}`}>
              {Array.from({ length: MAX_SCORE }, (_, i) => (
                <span
                  key={i}
                  className={cn('h-1.5 flex-1 rounded-full', i < score ? 'bg-primary' : 'bg-muted')}
                />
              ))}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-sm text-muted-foreground">{card.notes}</p>
    </article>
  );
}

export function CandidateScorecards({ scorecards }: { scorecards: Scorecard[] }) {
  const { t } = useTranslation('hr');
  return (
    <SectionCard title={t('candidate.scorecards')} description={t('candidate.scorecardsHint')}>
      {scorecards.length ? (
        <div className="space-y-4">
          {scorecards.map((card) => (
            <ScorecardItem key={card.id} card={card} />
          ))}
        </div>
      ) : (
        <EmptyState variant="plain" icon={ClipboardList} title={t('candidate.noScorecards')} />
      )}
    </SectionCard>
  );
}
