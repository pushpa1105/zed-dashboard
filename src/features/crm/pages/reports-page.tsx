import { CircleDollarSign, Hourglass, Target } from 'lucide-react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { DonutChart } from '@/shared/components/charts/donut-chart';
import { LineChart } from '@/shared/components/charts/line-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { UserCell } from '@/shared/components/display/user-cell';
import { Skeleton } from '@/shared/ui/skeleton';

import { reportsQuery, useCrmReports } from '../api/crm-api';
import { WidgetError } from '../components/crm-parts';
import { money } from '../lib/format';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(reportsQuery());
    return null;
  };

export default function ReportsPage() {
  const { t } = useTranslation('crm');
  const reports = useCrmReports();
  const data = reports.data;

  if (reports.isError) {
    return (
      <Page width="full" title={t('reports.title')}>
        <WidgetError onRetry={() => void reports.refetch()} />
      </Page>
    );
  }

  return (
    <Page width="full" title={t('reports.title')} description={t('reports.description')}>
      <div className="grid gap-4 sm:grid-cols-3 md:gap-6">
        <StatCard
          variant="accent"
          icon={Target}
          label={t('reports.winRate')}
          value={data ? `${data.winRate}%` : '—'}
          delta={4.2}
          loading={!data}
        />
        <StatCard
          icon={Hourglass}
          color="var(--chart-2)"
          label={t('reports.cycle')}
          value={data ? t('reports.cycleValue', { count: data.avgCycleDays }) : '—'}
          delta={-6.5}
          invert
          loading={!data}
        />
        <StatCard
          icon={CircleDollarSign}
          color="var(--chart-3)"
          label={t('reports.dealSize')}
          value={data ? money(data.avgDealSize) : '—'}
          delta={2.8}
          loading={!data}
        />
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <SectionCard
          title={t('reports.trend.winRate')}
          description={t('reports.trend.description')}
        >
          {data ? (
            <LineChart
              data={data.trend}
              xKey="month"
              dots
              series={[{ key: 'winRate', label: t('reports.trend.winRate') }]}
              valueFormatter={(v) => `${v}%`}
            />
          ) : (
            <Skeleton className="h-64" />
          )}
        </SectionCard>
        <SectionCard title={t('reports.trend.cycle')} description={t('reports.trend.description')}>
          {data ? (
            <BarChart
              data={data.trend}
              xKey="month"
              highlight="last"
              series={[{ key: 'cycle', label: t('reports.trend.cycle'), color: 'var(--chart-2)' }]}
            />
          ) : (
            <Skeleton className="h-64" />
          )}
        </SectionCard>
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-12">
        <SectionCard
          title={t('reports.sources.title')}
          description={t('reports.sources.description')}
          className="lg:col-span-7"
          flush
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">{t('reports.sources.source')}</th>
                  <th className="px-3 py-3 text-right font-medium">{t('reports.sources.deals')}</th>
                  <th className="px-3 py-3 text-right font-medium">{t('reports.sources.won')}</th>
                  <th className="w-40 px-3 py-3 text-left font-medium">
                    {t('reports.sources.conversion')}
                  </th>
                  <th className="px-6 py-3 text-right font-medium">
                    {t('reports.sources.revenue')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data?.bySource.map((row) => {
                  const pct = row.deals ? Math.round((row.won / row.deals) * 100) : 0;
                  return (
                    <tr key={row.source}>
                      <td className="px-6 py-3 font-medium">{row.source}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{row.deals}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{row.won}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right font-medium tabular-nums">
                        {money(row.revenue, true)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {data && (
            <div className="border-t p-6">
              <DonutChart
                legend="right"
                centerLabel={t('reports.sources.revenue')}
                valueFormatter={(v) => money(v, true)}
                data={data.bySource
                  .filter((row) => row.revenue > 0)
                  .slice(0, 5)
                  .map((row) => ({
                    key: row.source.toLowerCase(),
                    label: row.source,
                    value: row.revenue,
                  }))}
              />
            </div>
          )}
        </SectionCard>
        <div className="flex flex-col gap-4 md:gap-6 lg:col-span-5">
          <SectionCard title={t('reports.loss.title')} description={t('reports.loss.description')}>
            {data ? (
              <BarChart
                horizontal
                className="h-56"
                data={data.lossReasons}
                xKey="reason"
                series={[{ key: 'count', label: t('reports.loss.title'), color: 'var(--chart-3)' }]}
              />
            ) : (
              <Skeleton className="h-56" />
            )}
          </SectionCard>
          <SectionCard
            title={t('reports.owners.title')}
            description={t('reports.owners.description')}
            className="flex-1"
            flush
          >
            <ul className="divide-y border-t">
              {data?.byOwner.map((row) => (
                <li key={row.owner} className="flex items-center gap-3 px-6 py-3">
                  <UserCell name={row.owner} className="flex-1" />
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {t('reports.cycleValue', { count: row.cycle })}
                  </span>
                  <span className="w-12 text-right text-sm font-semibold tabular-nums">
                    {row.winRate}%
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>
    </Page>
  );
}
