import { CalendarClock, CircleAlert, ListChecks, UserPlus } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { EmptyState } from '@/shared/components/display/empty-state';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { cn } from '@/shared/lib/cn';
import { Progress } from '@/shared/ui/progress';
import { Skeleton } from '@/shared/ui/skeleton';

import { onboardingQuery, useOnboarding } from '../api/workforce-api';
import { DepartmentLabel } from '../components/hr-parts';
import { OnboardingChecklist } from '../components/onboarding-checklist';
import { WidgetError } from '../components/widget-error';
import { daysUntil, longDate, shortDate } from '../lib/format';
import { progressOf, type NewHire } from '../model/workforce';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(onboardingQuery());
    return null;
  };

function StartLabel({ date }: { date: string }) {
  const { t } = useTranslation('hr');
  return daysUntil(date) > 0
    ? t('onboarding.starts', { date: shortDate(date) })
    : t('onboarding.started', { date: shortDate(date) });
}

function HireList({
  hires,
  selected,
  onSelect,
}: {
  hires: NewHire[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation('hr');
  return (
    <ul className="space-y-2" aria-label={t('onboardingPage.hires')}>
      {hires.map((hire) => {
        const progress = progressOf(hire.tasks);
        return (
          <li key={hire.id}>
            <button
              type="button"
              aria-pressed={hire.id === selected}
              onClick={() => onSelect(hire.id)}
              className={cn(
                'w-full space-y-3 rounded-xl border bg-card p-4 text-left shadow-xs transition-colors hover:bg-muted/50',
                hire.id === selected && 'border-primary ring-1 ring-primary',
              )}
            >
              <span className="flex items-center gap-3">
                <InitialsAvatar name={hire.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{hire.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{hire.title}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  <StartLabel date={hire.startDate} />
                </span>
              </span>
              <span className="flex items-center gap-3">
                <Progress value={progress} className="h-1.5" aria-hidden />
                <span className="w-9 text-right text-xs font-medium tabular-nums">{progress}%</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default function OnboardingPage() {
  const { t } = useTranslation('hr');
  const onboarding = useOnboarding();
  const [selectedId, setSelectedId] = useState<string>();
  const hires = onboarding.data ?? [];
  const hire = hires.find((h) => h.id === selectedId) ?? hires[0];
  const tasks = hires.flatMap((h) => h.tasks);

  const stats = [
    { key: 'active', icon: UserPlus, color: 'var(--primary)', value: hires.length },
    {
      key: 'upcoming',
      icon: CalendarClock,
      color: 'var(--info)',
      value: hires.filter((h) => daysUntil(h.startDate) > 0).length,
    },
    {
      key: 'overdue',
      icon: CircleAlert,
      color: 'var(--destructive)',
      value: tasks.filter((task) => !task.done && daysUntil(task.due) < 0).length,
    },
    {
      key: 'completion',
      icon: ListChecks,
      color: 'var(--success)',
      value: `${progressOf(tasks)}%`,
    },
  ] as const;

  return (
    <Page
      width="full"
      title={t('onboardingPage.title')}
      description={t('onboardingPage.description')}
    >
      <div className="grid grid-cols-2 gap-4 md:gap-6 xl:grid-cols-4">
        {stats.map(({ key, ...stat }) => (
          <StatCard
            key={key}
            {...stat}
            label={t(`onboardingPage.stats.${key}`)}
            loading={!onboarding.data}
          />
        ))}
      </div>

      {onboarding.isError ? (
        <WidgetError onRetry={() => void onboarding.refetch()} />
      ) : !onboarding.data ? (
        <div className="grid gap-4 md:gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-[32rem] rounded-xl" />
        </div>
      ) : !hire ? (
        <EmptyState icon={UserPlus} title={t('onboardingPage.empty')} />
      ) : (
        <div className="grid items-start gap-4 md:gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <HireList hires={hires} selected={hire.id} onSelect={setSelectedId} />
          <SectionCard
            title={hire.name}
            description={`${hire.title} · ${hire.location}`}
            action={
              <span className="text-2xl font-semibold tabular-nums">{progressOf(hire.tasks)}%</span>
            }
          >
            <dl className="mb-6 grid grid-cols-2 gap-4 rounded-lg bg-muted/60 p-4 text-sm sm:grid-cols-4">
              {(
                [
                  { key: 'department', value: <DepartmentLabel department={hire.department} /> },
                  { key: 'startDate', value: longDate(hire.startDate) },
                  { key: 'manager', value: hire.manager },
                  { key: 'buddy', value: hire.buddy },
                ] as const
              ).map(({ key, value }) => (
                <div key={key} className="min-w-0">
                  <dt className="text-xs text-muted-foreground">
                    {t(`onboardingPage.fields.${key}`)}
                  </dt>
                  <dd className="mt-1 truncate font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            <OnboardingChecklist hire={hire} />
          </SectionCard>
        </div>
      )}
    </Page>
  );
}
