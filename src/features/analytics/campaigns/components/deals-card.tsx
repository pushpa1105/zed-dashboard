import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { AreaChart } from '@/shared/components/charts/area-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';

import { useDeals } from '../api/marketing-api';
import { DEAL_INTERVALS, type DealInterval } from '../model/marketing';

import { WidgetError } from './widget-error';

/** Owns its own query: switching the interval refetches only this card. */
export function DealsCard() {
  const { t } = useTranslation('analytics', { keyPrefix: 'campaigns' });
  const [interval, setInterval] = useState<DealInterval>('monthly');
  const deals = useDeals(interval);

  return (
    <SectionCard
      title={t('deals.title')}
      description={t('deals.description')}
      className="lg:col-span-5"
      action={
        <Select value={interval} onValueChange={(v) => setInterval(v as DealInterval)}>
          <SelectTrigger size="sm" className="w-28" aria-label={t('deals.title')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {DEAL_INTERVALS.map((value) => (
              <SelectItem key={value} value={value}>
                {t(`deals.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      {deals.isError ? (
        <WidgetError onRetry={() => void deals.refetch()} />
      ) : deals.data ? (
        <AreaChart
          className="h-64"
          data={deals.data}
          xKey="label"
          series={[
            { key: 'open', label: t('deals.open'), color: 'var(--chart-1)' },
            { key: 'closed', label: t('deals.closed'), color: 'var(--chart-3)' },
          ]}
          fill="gradient"
        />
      ) : (
        <Skeleton className="h-64 w-full" />
      )}
    </SectionCard>
  );
}
