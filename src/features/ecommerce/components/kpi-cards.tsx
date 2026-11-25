import { Banknote, Receipt, TrendingUp, Truck, type LucideIcon } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { StatCard } from '@/shared/components/dashboard/stat-card';

import type { EcommerceOverview } from '../model/overview';

const META: Record<
  EcommerceOverview['kpis'][number]['key'],
  { icon: LucideIcon; color: string; money: boolean; invert?: boolean }
> = {
  revenue: { icon: Banknote, color: 'var(--chart-1)', money: true },
  costs: { icon: Receipt, color: 'var(--chart-3)', money: true, invert: true },
  profit: { icon: TrendingUp, color: 'var(--chart-2)', money: true },
  shipments: { icon: Truck, color: 'var(--chart-4)', money: false },
};

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function KpiCards({ kpis }: { kpis: EcommerceOverview['kpis'] }) {
  const { t } = useTranslation('ecommerce', { keyPrefix: 'overview' });

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => {
        const meta = META[kpi.key];
        return (
          <StatCard
            key={kpi.key}
            icon={meta.icon}
            color={meta.color}
            label={t(`kpis.${kpi.key}`)}
            value={meta.money ? usd.format(kpi.value) : kpi.value.toLocaleString('en-US')}
            delta={kpi.delta}
            invert={meta.invert}
            hint={t('kpis.hint')}
            sparkline={kpi.trend}
          />
        );
      })}
    </div>
  );
}
