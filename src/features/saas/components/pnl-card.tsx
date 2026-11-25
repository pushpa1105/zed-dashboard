import { SlidersHorizontal } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { DonutChart } from '@/shared/components/charts/donut-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { Button } from '@/shared/ui/button';

import type { SaasOverview } from '../model/overview';

const money = (v: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(v);

export function PnlCard({ data }: { data: SaasOverview }) {
  const { t } = useTranslation('saas', { keyPrefix: 'overview' });
  const total = data.pnl.reduce((sum, slice) => sum + slice.value, 0) || 1;

  return (
    <SectionCard
      title={t('pnl.title')}
      description={t('pnl.description', { value: data.profitGrowth })}
      action={
        <Button variant="ghost" size="icon-sm" aria-label={t('actions.more')}>
          <SlidersHorizontal />
        </Button>
      }
    >
      <DonutChart
        data={data.pnl}
        legend={false}
        thickness={0.22}
        valueFormatter={money}
        centerLabel={t('pnl.center')}
        className="gap-5"
      />
      <ul className="mt-5 space-y-2.5 text-sm">
        {data.pnl.map((slice, i) => (
          <li key={slice.key} className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-[3px]"
              style={{ background: `var(--chart-${i + 1})` }}
            />
            <span className="truncate text-muted-foreground">{slice.label}</span>
            <span className="ml-auto font-medium tabular-nums">{money(slice.value)}</span>
            <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
              {Math.round((slice.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
