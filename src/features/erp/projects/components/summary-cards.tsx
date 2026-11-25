import { CircleDollarSign } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Gauge } from '@/shared/components/charts/gauge';
import { RadialChart } from '@/shared/components/charts/radial-chart';
import { MeterList } from '@/shared/components/dashboard/meter-list';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { TrendBadge } from '@/shared/components/dashboard/trend-badge';
import { Skeleton } from '@/shared/ui/skeleton';

import { money } from '../lib/format';
import type { ProjectsOverview } from '../model/projects';

/** Hero number + month-by-month meters (image 5, top-left). */
export function SalesCard({ sales }: { sales?: ProjectsOverview['sales'] }) {
  const { t } = useTranslation('erp', { keyPrefix: 'projects' });

  return (
    <SectionCard>
      {sales ? (
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {t('sales.title')}
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-semibold tracking-tight text-primary tabular-nums">
                  {money(sales.total, 0)}
                </p>
                <TrendBadge delta={sales.delta} variant="text" />
              </div>
              <p className="text-xs text-muted-foreground">
                {t('sales.compared', { value: money(sales.previous, 0) })}
              </p>
            </div>
            <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <CircleDollarSign className="size-5" />
            </span>
          </div>
          <MeterList
            size="sm"
            items={sales.months.map((m, i) => ({
              key: m.month,
              label: (
                <span className="flex gap-3">
                  <span className="w-12 text-muted-foreground">{m.month.slice(0, 3)}</span>
                  <span className="font-medium tabular-nums">{money(m.amount, 0)}</span>
                </span>
              ),
              value: m.pct,
              max: 100,
              display: `${m.pct}%`,
              color: `var(--chart-${(i % 5) + 1})`,
            }))}
          />
        </div>
      ) : (
        <Skeleton className="h-64 w-full" />
      )}
    </SectionCard>
  );
}

export function TasksCard({ tasks }: { tasks?: ProjectsOverview['tasks'] }) {
  const { t } = useTranslation('erp', { keyPrefix: 'projects' });
  return (
    <SectionCard
      title={t('tasks.title')}
      description={t('tasks.description')}
      className="lg:col-span-3"
    >
      {tasks ? (
        <RadialChart
          className="sm:flex-col"
          data={tasks.map((task) => ({ key: task.key, label: task.label, value: task.value }))}
        />
      ) : (
        <Skeleton className="h-64 w-full" />
      )}
    </SectionCard>
  );
}

export function CapacityCard({ capacity }: { capacity?: ProjectsOverview['capacity'] }) {
  const { t } = useTranslation('erp', { keyPrefix: 'projects' });
  const pct = capacity ? Math.round((capacity.used / capacity.total) * 100) : 0;

  return (
    <SectionCard
      title={t('capacity.title')}
      description={t('capacity.description')}
      footer={capacity && t('capacity.used', capacity)}
    >
      {capacity ? (
        <Gauge value={pct} variant="arc" label={t('capacity.label')} className="py-2" />
      ) : (
        <Skeleton className="h-36 w-full" />
      )}
    </SectionCard>
  );
}
