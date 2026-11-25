import { useTranslation } from '@/core/i18n/use-translation';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatusBadge } from '@/shared/components/display/status-badge';
import { Progress } from '@/shared/ui/progress';

import { useRemindSurvey } from '../api/people-ops-api';
import { percent, shortDate } from '../lib/format';
import { SURVEY_TONE, type Survey } from '../model/engagement';

import { RemindButton } from './hr-parts';

export function SurveyList({ surveys }: { surveys: Survey[] }) {
  const { t } = useTranslation('hr');
  const remind = useRemindSurvey();

  return (
    <SectionCard flush title={t('engagement.surveys')} description={t('engagement.surveysHint')}>
      <ul className="divide-y border-t">
        {surveys.map((survey) => {
          const rate = percent(survey.responses, survey.invited);
          return (
            <li
              key={survey.id}
              className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{survey.title}</span>
                  <StatusBadge
                    status={survey.status}
                    tone={SURVEY_TONE[survey.status]}
                    label={t(`engagement.status.${survey.status}`)}
                  />
                </div>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {shortDate(survey.opensAt)} – {shortDate(survey.closesAt)}
                </p>
              </div>
              {survey.status !== 'scheduled' && (
                <div className="w-full space-y-1 sm:w-40">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t('engagement.responses', { count: survey.responses })}</span>
                    <span className="tabular-nums">{rate}%</span>
                  </div>
                  <Progress value={rate} className="h-1.5" aria-hidden />
                </div>
              )}
              {survey.status === 'active' && (
                <RemindButton
                  reminded={!!survey.remindedAt}
                  disabled={remind.isPending}
                  onRemind={() => remind.mutate(survey.id)}
                />
              )}
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
