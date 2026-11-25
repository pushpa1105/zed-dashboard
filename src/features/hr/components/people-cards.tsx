import { useTranslation } from '@/core/i18n/use-translation';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { ProgressRing } from '@/shared/components/charts/progress-ring';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { formatRelative, getInitials } from '@/shared/lib/format';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Skeleton } from '@/shared/ui/skeleton';

import { shortDate } from '../lib/format';
import type { HrOverview } from '../model/overview';

export function HeadcountCard({ headcount }: { headcount?: HrOverview['headcount'] }) {
  const { t } = useTranslation('hr');
  const sorted = headcount ? [...headcount].sort((a, b) => b.count - a.count) : undefined;
  return (
    <SectionCard title={t('headcount.title')}>
      {sorted ? (
        <BarChart
          horizontal
          className="h-64"
          data={sorted}
          xKey="department"
          series={[{ key: 'count', label: t('headcount.employees') }]}
          barSize={14}
          hideYAxis
        />
      ) : (
        <Skeleton className="h-64 w-full" />
      )}
    </SectionCard>
  );
}

/**
 * Stage-to-stage pipeline: one bar per stage scaled to the first, with the
 * share that advanced from the previous stage written out.
 */
export function PipelineCard({ pipeline }: { pipeline?: HrOverview['pipeline'] }) {
  const { t } = useTranslation('hr');
  const top = pipeline?.[0]?.count || 1;
  return (
    <SectionCard title={t('pipeline.title')} description={t('pipeline.description')}>
      {pipeline ? (
        <ol className="space-y-3">
          {pipeline.map((stage, i) => {
            const prev = pipeline[i - 1]?.count;
            return (
              <li key={stage.stage} className="space-y-1.5">
                <div className="flex items-baseline justify-between text-sm">
                  <span>{stage.stage}</span>
                  <span className="flex items-baseline gap-2">
                    {prev !== undefined && (
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {t('pipeline.conversion', {
                          value: Math.round((stage.count / prev) * 100),
                        })}
                      </span>
                    )}
                    <span className="w-9 text-right font-medium tabular-nums">{stage.count}</span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${Math.max((stage.count / top) * 100, 2)}%`,
                      opacity: 1 - i * 0.14,
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <Skeleton className="h-56 w-full" />
      )}
    </SectionCard>
  );
}

const TODAY = '2026-11-24';

export function OnboardingCard({ onboarding }: { onboarding?: HrOverview['onboarding'] }) {
  const { t } = useTranslation('hr');
  return (
    <SectionCard title={t('onboarding.title')}>
      {onboarding ? (
        <ul className="space-y-4">
          {onboarding.map((person) => (
            <li key={person.id} className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarFallback className="bg-accent text-xs text-accent-foreground">
                  {getInitials(...person.name.split(' '))}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{person.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {person.role} ·{' '}
                  {t(person.startDate > TODAY ? 'onboarding.starts' : 'onboarding.started', {
                    date: shortDate(person.startDate),
                  })}
                </p>
              </div>
              <ProgressRing value={person.progress} size={40} strokeWidth={4} />
            </li>
          ))}
        </ul>
      ) : (
        <Skeleton className="h-56 w-full" />
      )}
    </SectionCard>
  );
}

export function ActivityList({ activity }: { activity?: HrOverview['activity'] }) {
  const { t } = useTranslation('hr');
  return (
    <SectionCard title={t('activity.title')}>
      {activity ? (
        <ol className="divide-y">
          {activity.map((item) => (
            <li key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <Avatar className="size-8">
                <AvatarFallback className="text-[0.65rem]">
                  {getInitials(...item.actor.split(' '))}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <p>
                  <span className="font-medium">{item.actor}</span>{' '}
                  <span className="text-muted-foreground">{item.action}</span>{' '}
                  <span className="font-medium">{item.target}</span>
                </p>
                <p className="text-xs text-muted-foreground">{formatRelative(item.at)}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <Skeleton className="h-56 w-full" />
      )}
    </SectionCard>
  );
}
