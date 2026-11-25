import { Globe, Link2, MousePointerClick, Rocket, type LucideIcon } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { Skeleton } from '@/shared/ui/skeleton';

import { compact } from '../lib/format';
import type { MarketingOverview } from '../model/marketing';

const META: Record<MarketingOverview['kpis'][number]['key'], { icon: LucideIcon; color: string }> =
  {
    domains: { icon: Globe, color: 'var(--chart-2)' },
    projects: { icon: Rocket, color: 'var(--chart-4)' },
    clicks: { icon: MousePointerClick, color: 'var(--primary)' },
    links: { icon: Link2, color: 'var(--chart-1)' },
  };

/** The one accent row of this template: four gradient KPI tiles. */
export function KpiRow({ kpis }: { kpis?: MarketingOverview['kpis'] }) {
  const { t } = useTranslation('analytics', { keyPrefix: 'campaigns' });

  if (!kpis) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => {
        const { icon, color } = META[kpi.key];
        return (
          <StatCard
            key={kpi.key}
            variant="accent"
            color={color}
            icon={icon}
            label={t(`kpis.${kpi.key}`)}
            value={compact(kpi.value)}
            delta={kpi.delta}
            hint={t('kpis.hint')}
            sparkline={kpi.spark}
          />
        );
      })}
    </div>
  );
}
