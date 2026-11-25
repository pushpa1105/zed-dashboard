import { useTranslation } from '@/core/i18n/use-translation';
import { LineChart } from '@/shared/components/charts/line-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { Skeleton } from '@/shared/ui/skeleton';

import { compact, shortDate } from '../lib/format';
import type { MarketingOverview } from '../model/marketing';

export function TrafficCard({ traffic }: { traffic?: MarketingOverview['traffic'] }) {
  const { t } = useTranslation('analytics', { keyPrefix: 'campaigns' });

  const totals = traffic?.reduce(
    (acc, d) => ({
      impressions: acc.impressions + d.impressions,
      uniques: acc.uniques + d.uniques,
    }),
    { impressions: 0, uniques: 0 },
  );

  return (
    <SectionCard
      title={t('traffic.title')}
      description={t('traffic.description')}
      className="lg:col-span-8"
      action={
        totals && (
          <dl className="hidden gap-6 text-right sm:flex">
            <div>
              <dt className="text-xs text-muted-foreground">{t('traffic.impressions')}</dt>
              <dd className="font-semibold tabular-nums">{compact(totals.impressions)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t('traffic.uniques')}</dt>
              <dd className="font-semibold tabular-nums">{compact(totals.uniques)}</dd>
            </div>
          </dl>
        )
      }
    >
      {traffic ? (
        <LineChart
          className="h-72"
          data={traffic.map((d) => ({ ...d, label: shortDate(d.date) }))}
          xKey="label"
          series={[
            { key: 'impressions', label: t('traffic.impressions'), color: 'var(--chart-1)' },
            { key: 'uniques', label: t('traffic.uniques'), color: 'var(--chart-2)' },
          ]}
          valueFormatter={compact}
        />
      ) : (
        <Skeleton className="h-72 w-full" />
      )}
    </SectionCard>
  );
}
