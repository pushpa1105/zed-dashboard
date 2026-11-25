import { CircleCheck, Flag, Sparkles, Target } from 'lucide-react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { MeterList } from '@/shared/components/dashboard/meter-list';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { Skeleton } from '@/shared/ui/skeleton';

import { forecastQuery, useForecast } from '../api/crm-api';
import { WidgetError } from '../components/crm-parts';
import { ForecastLeaderboard } from '../components/forecast-leaderboard';
import { money } from '../lib/format';
import { FORECAST_COLOR } from '../model/crm';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(forecastQuery());
    return null;
  };

const OUTLOOK = ['closed', 'commit', 'bestCase'] as const;
const OUTLOOK_ICON = { closed: CircleCheck, commit: Flag, bestCase: Sparkles };
const pct = (value: number, total: number) => Math.round((value / total) * 100);

export default function ForecastPage() {
  const { t, i18n } = useTranslation('crm');
  const forecast = useForecast();
  const data = forecast.data;

  if (forecast.isError) {
    return (
      <Page width="full" title={t('forecast.title')}>
        <WidgetError onRetry={() => void forecast.refetch()} />
      </Page>
    );
  }

  const total = (key: 'commit' | 'bestCase') => data?.reps.reduce((s, r) => s + r[key], 0) ?? 0;
  const closed = data?.closed ?? 0;
  const quota = data?.quota ?? 1;
  const commit = closed + total('commit');
  const bestCase = commit + total('bestCase');
  const outlook = { closed, commit, bestCase };
  const monthLabel = new Intl.DateTimeFormat(i18n.language, { month: 'short' });

  const stats = [
    { key: 'quota', icon: Target, label: t('forecast.quota'), value: money(quota, true) },
    ...OUTLOOK.map((key) => ({
      key,
      icon: OUTLOOK_ICON[key],
      label: t(`forecast.categories.${key}`),
      value: money(outlook[key], true),
      hint: t('forecast.ofQuota', { pct: pct(outlook[key], quota) }),
    })),
  ];

  return (
    <Page width="full" title={t('forecast.title')} description={t('forecast.description')}>
      <div className="grid gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
        {stats.map(({ key, ...stat }, i) => (
          <StatCard key={key} {...stat} color={`var(--chart-${i + 1})`} loading={!data} />
        ))}
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-12">
        <SectionCard
          title={t('forecast.byMonth')}
          description={t('forecast.byMonthHint')}
          className="lg:col-span-8"
        >
          {data ? (
            <BarChart
              mode="stacked"
              className="h-72"
              data={data.months.map((m) => ({
                ...m,
                month: monthLabel.format(new Date(`${m.month}-15`)),
              }))}
              xKey="month"
              valueFormatter={(v) => money(v, true)}
              series={(['closed', 'commit', 'bestCase', 'pipeline'] as const).map((key) => ({
                key,
                label: t(`forecast.categories.${key}`),
                color: FORECAST_COLOR[key],
              }))}
            />
          ) : (
            <Skeleton className="h-72" />
          )}
        </SectionCard>
        <SectionCard
          title={t('forecast.outlook')}
          description={t('forecast.outlookHint')}
          className="lg:col-span-4"
        >
          {data ? (
            <MeterList
              items={OUTLOOK.map((key) => ({
                key,
                label: t(`forecast.categories.${key}`),
                value: outlook[key],
                max: quota,
                display: `${money(outlook[key], true)} · ${pct(outlook[key], quota)}%`,
                color: FORECAST_COLOR[key],
              }))}
            />
          ) : (
            <Skeleton className="h-40" />
          )}
          <p className="mt-6 text-xs text-muted-foreground">{t('forecast.outlookNote')}</p>
        </SectionCard>
      </div>

      <SectionCard
        title={t('forecast.leaderboard')}
        description={t('forecast.leaderboardHint')}
        flush
      >
        {data ? <ForecastLeaderboard reps={data.reps} /> : <Skeleton className="m-6 h-64" />}
      </SectionCard>
    </Page>
  );
}
