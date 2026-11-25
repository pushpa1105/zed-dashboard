import { ArrowUpRight } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { TrendBadge } from '@/shared/components/dashboard/trend-badge';
import { Button } from '@/shared/ui/button';

import { moneyCompact, moneyWhole } from '../lib/format';
import type { FinanceOverview } from '../model/overview';

import { GLASS } from './glass';

export function SalesCard({ sales }: { sales: FinanceOverview['sales'] }) {
  const { t } = useTranslation('erp', { keyPrefix: 'finance' });

  return (
    <SectionCard
      className={GLASS}
      title={t('sales.title')}
      description={t('sales.description')}
      action={
        <Button variant="outline" size="icon-sm" aria-label={t('actions.open')}>
          <ArrowUpRight />
        </Button>
      }
    >
      <dl className="mb-4 flex flex-wrap gap-x-10 gap-y-3">
        <div className="space-y-1">
          <dt className="text-xs text-muted-foreground">{t('sales.cashIn')}</dt>
          <dd className="flex items-center gap-2">
            <span className="text-2xl font-semibold tracking-tight tabular-nums">
              {moneyWhole(sales.cashIn)}
            </span>
            <TrendBadge delta={sales.cashInDelta} />
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-xs text-muted-foreground">{t('sales.cashOut')}</dt>
          <dd className="flex items-center gap-2">
            <span className="text-2xl font-semibold tracking-tight tabular-nums">
              {moneyWhole(sales.cashOut)}
            </span>
            <TrendBadge delta={sales.cashOutDelta} invert />
          </dd>
        </div>
      </dl>
      <BarChart
        data={sales.points}
        xKey="label"
        series={[{ key: 'value', label: t('sales.title') }]}
        highlight={sales.highlightIndex}
        radius={8}
        barSize={44}
        valueFormatter={moneyCompact}
        className="h-60"
      />
    </SectionCard>
  );
}
