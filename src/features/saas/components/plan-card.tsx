import { ChevronRight, UsersRound } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { MeterList } from '@/shared/components/dashboard/meter-list';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { formatDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';

import type { SaasOverview } from '../model/overview';

const METER_COLORS = ['var(--chart-3)', 'var(--chart-1)', 'var(--chart-5)', 'var(--chart-2)'];
const compact = (v: number) =>
  new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(v);

export function PlanCard({ plan }: { plan: SaasOverview['plan'] }) {
  const { t } = useTranslation('saas', { keyPrefix: 'overview' });

  return (
    <SectionCard
      title={t('plan.title')}
      description={t('plan.description')}
      footer={t('plan.renews', { date: formatDate(plan.renewsAt, 'MMM D, YYYY') })}
    >
      <button
        type="button"
        className="mb-5 flex w-full items-center gap-3 rounded-xl border bg-muted/40 p-3 text-left transition-colors hover:bg-muted"
      >
        <span className="flex size-10 items-center justify-center rounded-lg bg-info/10 text-info">
          <UsersRound className="size-[1.1rem]" />
        </span>
        <span className="flex-1">
          <span className="block text-xs text-muted-foreground">
            {t('plan.plan', { name: plan.name })}
          </span>
          <span className="block font-semibold tabular-nums">
            {t('plan.perMonth', { price: `$${plan.price}` })}
          </span>
        </span>
        <ChevronRight className="size-4 text-muted-foreground" />
      </button>
      <MeterList
        size="sm"
        items={plan.limits.map((limit, i) => ({
          ...limit,
          color: METER_COLORS[i % METER_COLORS.length],
          display: `${compact(limit.value)}/${compact(limit.max)}`,
        }))}
      />
      <Button variant="outline" size="sm" className="mt-5 w-full">
        {t('plan.manage')}
      </Button>
    </SectionCard>
  );
}
