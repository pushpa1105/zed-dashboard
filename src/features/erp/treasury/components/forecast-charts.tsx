import { useTranslation } from '@/core/i18n/use-translation';
import { moneyCompact } from '@/features/erp/lib/money';
import { AreaChart } from '@/shared/components/charts/area-chart';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { Skeleton } from '@/shared/ui/skeleton';

import type { CashForecast } from '../model/forecast';

/** Weekly flows next to the running balance it produces. */
export function ForecastCharts({ forecast }: { forecast: CashForecast | undefined }) {
  const { t } = useTranslation('erp', { keyPrefix: 'cashForecast.charts' });
  const data = forecast?.weeks.map((w) => ({
    week: t('week', { n: w.week }),
    inflow: w.inflow,
    outflow: w.outflow,
    net: w.inflow - w.outflow,
    closing: w.closing,
    minimum: forecast.minimumCash,
  }));

  return (
    <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
      <SectionCard title={t('flows')} description={t('flowsDescription')}>
        {data ? (
          <BarChart
            data={data}
            xKey="week"
            barSize={14}
            className="h-72"
            valueFormatter={moneyCompact}
            series={[
              { key: 'inflow', label: t('inflow'), color: 'var(--success)' },
              { key: 'outflow', label: t('outflow'), color: 'var(--destructive)' },
              { key: 'net', label: t('net'), color: 'var(--chart-1)' },
            ]}
          />
        ) : (
          <Skeleton className="h-72 w-full" />
        )}
      </SectionCard>
      <SectionCard title={t('balance')} description={t('balanceDescription')}>
        {data ? (
          <AreaChart
            data={data}
            xKey="week"
            className="h-72"
            curve="monotone"
            valueFormatter={moneyCompact}
            series={[
              { key: 'closing', label: t('closing'), color: 'var(--chart-1)' },
              { key: 'minimum', label: t('minimum'), color: 'var(--warning)' },
            ]}
          />
        ) : (
          <Skeleton className="h-72 w-full" />
        )}
      </SectionCard>
    </div>
  );
}
