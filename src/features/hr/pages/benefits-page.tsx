import { ChevronRight, CircleDollarSign, Clock, PiggyBank, UsersRound } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { DonutChart } from '@/shared/components/charts/donut-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { Progress } from '@/shared/ui/progress';
import { Skeleton } from '@/shared/ui/skeleton';

import { benefitsQuery, useBenefits } from '../api/workforce-api';
import { BenefitPlanSheet } from '../components/benefit-plan-sheet';
import { EnrollmentTable } from '../components/enrollment-table';
import { DotLabel } from '../components/hr-parts';
import { WidgetError } from '../components/widget-error';
import { compact, money } from '../lib/format';
import { BENEFIT_CATEGORIES, BENEFIT_COLOR, type BenefitPlan } from '../model/workforce';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(benefitsQuery());
    return null;
  };

const monthlyCost = (plan: BenefitPlan) => plan.employerCost * plan.enrolled;

function PlanCard({ plan, onOpen }: { plan: BenefitPlan; onOpen: () => void }) {
  const { t } = useTranslation('hr');
  const share = Math.round((plan.enrolled / plan.eligible) * 100);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex h-full w-full flex-col gap-4 rounded-xl border bg-card p-5 text-left shadow-xs transition-shadow hover:shadow-md"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0 space-y-1">
          <DotLabel color={BENEFIT_COLOR[plan.category]} className="text-xs text-muted-foreground">
            {t(`benefits.categories.${plan.category}`)}
          </DotLabel>
          <span className="block font-semibold group-hover:underline">{plan.name}</span>
          <span className="block text-xs text-muted-foreground">{plan.provider}</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </span>
      <span className="space-y-1.5">
        <span className="flex justify-between text-xs text-muted-foreground">
          <span>
            {t('benefits.enrolledOf', { enrolled: plan.enrolled, eligible: plan.eligible })}
          </span>
          <span className="tabular-nums">{share}%</span>
        </span>
        <Progress value={share} className="h-1.5" aria-hidden />
      </span>
      <span className="text-sm">
        <span className="font-semibold tabular-nums">{money(plan.employerCost, 0)}</span>{' '}
        <span className="text-muted-foreground">{t('benefits.perMonth')}</span>
      </span>
    </button>
  );
}

export default function BenefitsPage() {
  const { t } = useTranslation('hr');
  const benefits = useBenefits();
  const [openId, setOpenId] = useState<string>();

  const plans = benefits.data?.plans ?? [];
  const enrollments = benefits.data?.enrollments ?? [];
  const total = plans.reduce((s, p) => s + monthlyCost(p), 0);
  const enrolled = enrollments.filter((e) => e.status === 'enrolled').length;
  const ranked = BENEFIT_CATEGORIES.map((category) => ({
    key: category,
    label: t(`benefits.categories.${category}`),
    color: BENEFIT_COLOR[category],
    value: plans.filter((p) => p.category === category).reduce((s, p) => s + monthlyCost(p), 0),
  })).sort((a, b) => b.value - a.value);
  // A donut reads best with five slices at most: fold the smallest into "Other".
  const byCategory = [
    ...ranked.slice(0, 4),
    {
      key: 'other',
      label: t('benefits.categories.other'),
      color: 'var(--muted-foreground)',
      value: ranked.slice(4).reduce((s, c) => s + c.value, 0),
    },
  ];

  const stats = [
    { key: 'monthly', icon: CircleDollarSign, color: 'var(--primary)', value: money(total, 0) },
    {
      key: 'perEmployee',
      icon: PiggyBank,
      color: 'var(--chart-3)',
      value: money(enrollments.length ? total / enrollments.length : 0, 0),
    },
    {
      key: 'participation',
      icon: UsersRound,
      color: 'var(--success)',
      value: `${enrollments.length ? Math.round((enrolled / enrollments.length) * 100) : 0}%`,
    },
    {
      key: 'pending',
      icon: Clock,
      color: 'var(--warning)',
      value: enrollments.filter((e) => e.status === 'pending').length,
    },
  ] as const;

  return (
    <Page width="full" title={t('benefits.title')} description={t('benefits.description')}>
      <div className="grid grid-cols-2 gap-4 md:gap-6 xl:grid-cols-4">
        {stats.map(({ key, ...stat }) => (
          <StatCard
            key={key}
            {...stat}
            label={t(`benefits.stats.${key}`)}
            loading={!benefits.data}
          />
        ))}
      </div>

      {benefits.isError ? (
        <WidgetError onRetry={() => void benefits.refetch()} />
      ) : !benefits.data ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : (
        <>
          <div className="grid items-start gap-4 md:gap-6 xl:grid-cols-[24rem_minmax(0,1fr)]">
            <SectionCard title={t('benefits.costByCategory')} description={t('benefits.perMonth')}>
              <DonutChart
                data={byCategory}
                legend="bottom"
                centerValue={compact(total)}
                centerLabel={t('benefits.perMonth')}
                valueFormatter={(v) => money(v, 0)}
              />
            </SectionCard>
            <ul
              className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3"
              aria-label={t('benefits.plans')}
            >
              {plans.map((plan) => (
                <li key={plan.id}>
                  <PlanCard plan={plan} onOpen={() => setOpenId(plan.id)} />
                </li>
              ))}
            </ul>
          </div>
          <EnrollmentTable plans={plans} enrollments={enrollments} />
        </>
      )}

      <BenefitPlanSheet
        plan={plans.find((p) => p.id === openId)}
        enrollments={enrollments}
        onOpenChange={(open) => !open && setOpenId(undefined)}
      />
    </Page>
  );
}
