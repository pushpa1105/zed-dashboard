import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link } from '@/core/router/router';
import { Gauge } from '@/shared/components/charts/gauge';
import { LineChart } from '@/shared/components/charts/line-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import { overviewQuery, useCrmOverview } from '../api/crm-api';
import { CompanyMark, StageBadge, WidgetError } from '../components/crm-parts';
import { NewDealDialog } from '../components/new-deal-dialog';
import { daysFromToday, money, relativeDays } from '../lib/format';
import { STAGE_COLOR, type CrmOverview } from '../model/crm';
import { crmRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(overviewQuery());
    return null;
  };

function QuotaCard({ data }: { data?: CrmOverview }) {
  const { t } = useTranslation('crm');
  const pct = data ? Math.round((data.won / data.quota) * 100) : 0;
  return (
    <SectionCard
      title={t('overview.quota.title')}
      description={t('overview.quota.description')}
      className="h-full lg:col-span-4"
      contentClassName="flex flex-col justify-between gap-5"
    >
      {data ? (
        <>
          <Gauge value={pct} label={t('overview.quota.attained')} />
          <div className="rounded-lg bg-muted/60 p-4 text-center">
            <p className="text-2xl font-semibold tracking-tight tabular-nums">{money(data.won)}</p>
            <p className="text-sm text-muted-foreground">
              {t('overview.quota.of', { quota: money(data.quota, true) })}
            </p>
          </div>
          <dl className="grid grid-cols-2 divide-x rounded-lg border text-center">
            <div className="p-3">
              <dt className="text-xs text-muted-foreground">{t('overview.quota.remaining')}</dt>
              <dd className="mt-1 font-semibold tabular-nums">
                {money(Math.max(0, data.quota - data.won), true)}
              </dd>
            </div>
            <div className="p-3">
              <dt className="text-xs text-muted-foreground">{t('overview.quota.weekly')}</dt>
              <dd className="mt-1 font-semibold tabular-nums">
                {money(Math.max(0, data.quota - data.won) / 5, true)}
              </dd>
            </div>
          </dl>
        </>
      ) : (
        <Skeleton className="h-64 w-full" />
      )}
    </SectionCard>
  );
}

function StageFunnel({ data }: { data?: CrmOverview }) {
  const { t } = useTranslation('crm');
  const max = Math.max(...(data?.pipeline.map((p) => p.value) ?? [1]));
  return (
    <SectionCard
      title={t('overview.funnel.title')}
      description={t('overview.funnel.description')}
      className="h-full lg:col-span-5"
      contentClassName="flex flex-col justify-between gap-6"
      footer={
        data ? (
          <div className="flex items-center justify-between">
            <span>{t('overview.funnel.total')}</span>
            <span className="font-semibold text-foreground tabular-nums">
              {money(
                data.pipeline.reduce((sum, row) => sum + row.value, 0),
                true,
              )}
            </span>
          </div>
        ) : undefined
      }
    >
      {data ? (
        <ol className="flex flex-1 flex-col justify-around gap-5">
          {data.pipeline.map((row) => (
            <li key={row.stage} className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <StageBadge stage={row.stage} />
                <span className="text-muted-foreground tabular-nums">
                  {t('overview.funnel.deals', { count: row.count })} ·{' '}
                  <span className="font-medium text-foreground">{money(row.value, true)}</span>
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(row.value / max) * 100}%`,
                    background: STAGE_COLOR[row.stage],
                  }}
                />
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <Skeleton className="h-56 w-full" />
      )}
    </SectionCard>
  );
}

function ClosingSoon({ data }: { data?: CrmOverview }) {
  const { t, i18n } = useTranslation('crm');
  return (
    <SectionCard
      title={t('overview.closing.title')}
      description={t('overview.closing.description')}
      className="h-full lg:col-span-7"
      flush
      action={
        <Button variant="ghost" size="sm" asChild>
          <Link to={crmRoutes.deals.href()}>{t('common.viewAll')}</Link>
        </Button>
      }
    >
      {data ? (
        <ul className="divide-y border-t">
          {data.closingSoon.map((deal) => {
            const days = daysFromToday(deal.closeDate);
            return (
              <li key={deal.id}>
                <Link
                  to={crmRoutes.deal.href({ dealId: deal.id })}
                  className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-muted/50"
                >
                  <CompanyMark name={deal.company} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{deal.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{deal.owner}</p>
                  </div>
                  <StageBadge stage={deal.stage} className="hidden sm:inline-flex" />
                  <div className="w-28 text-right">
                    <p className="text-sm font-medium tabular-nums">{money(deal.value)}</p>
                    <p
                      className={cn(
                        'text-xs',
                        days < 0 ? 'font-medium text-destructive' : 'text-muted-foreground',
                      )}
                    >
                      {days < 0
                        ? t('overview.closing.overdue')
                        : relativeDays(deal.closeDate, i18n.language)}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="space-y-2 px-6 pb-6">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function Leaderboard({ data }: { data?: CrmOverview }) {
  const { t } = useTranslation('crm');
  return (
    <SectionCard
      title={t('overview.leaderboard.title')}
      description={t('overview.leaderboard.description')}
      className="lg:col-span-12"
    >
      {data ? (
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {data.leaderboard.map((rep, i) => {
            const pct = Math.min(100, Math.round((rep.won / rep.quota) * 100));
            return (
              <li
                key={rep.owner}
                className={cn(
                  'relative space-y-4 rounded-lg border p-4',
                  i === 0 && 'border-primary/40 bg-primary/5',
                )}
              >
                <div className="flex items-center gap-3">
                  <InitialsAvatar name={rep.owner} size="md" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{rep.owner}</p>
                    <p className="text-xs text-muted-foreground">
                      #{i + 1} · {t('overview.leaderboard.deals', { count: rep.deals })}
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-semibold tabular-nums">
                      {money(rep.won, true)}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <Skeleton className="h-32 w-full" />
      )}
    </SectionCard>
  );
}

export default function CrmOverviewPage() {
  const { t } = useTranslation('crm');
  const overview = useCrmOverview();
  const data = overview.data;

  return (
    <Page
      width="full"
      title={t('overview.title')}
      description={t('overview.description')}
      actions={<NewDealDialog />}
    >
      {overview.isError ? (
        <WidgetError onRetry={() => void overview.refetch()} />
      ) : (
        <div className="grid gap-4 md:gap-6 lg:grid-cols-12">
          <QuotaCard data={data} />
          <div className="flex flex-col gap-4 md:gap-6 lg:col-span-8">
            <section className="rounded-xl border bg-card px-6 py-3 shadow-xs">
              {data ? (
                <StatStrip
                  items={[
                    {
                      key: 'pipeline',
                      label: t('overview.stats.pipeline'),
                      value: money(data.stats.pipelineValue, true),
                      delta: 8.4,
                    },
                    {
                      key: 'weighted',
                      label: t('overview.stats.weighted'),
                      value: money(data.stats.weighted, true),
                      hint: t('overview.stats.weightedHint'),
                    },
                    {
                      key: 'open',
                      label: t('overview.stats.openDeals'),
                      value: data.stats.openDeals,
                      hint: t('overview.stats.openDealsHint'),
                    },
                    {
                      key: 'win',
                      label: t('overview.stats.winRate'),
                      value: `${data.stats.winRate}%`,
                      delta: 3.1,
                    },
                  ]}
                />
              ) : (
                <Skeleton className="my-3 h-16 w-full" />
              )}
            </section>
            <SectionCard
              title={t('overview.forecast.title')}
              description={t('overview.forecast.description')}
              className="flex-1"
            >
              {data ? (
                <LineChart
                  data={data.forecast}
                  xKey="week"
                  className="h-64"
                  dashed={['forecast', 'target']}
                  valueFormatter={(v) =>
                    new Intl.NumberFormat(undefined, { notation: 'compact' }).format(v)
                  }
                  series={[
                    { key: 'closed', label: t('overview.forecast.closed') },
                    {
                      key: 'forecast',
                      label: t('overview.forecast.forecast'),
                      color: 'var(--chart-2)',
                    },
                    {
                      key: 'target',
                      label: t('overview.forecast.target'),
                      color: 'var(--muted-foreground)',
                    },
                  ]}
                />
              ) : (
                <Skeleton className="h-64 w-full" />
              )}
            </SectionCard>
          </div>
          <StageFunnel data={data} />
          <ClosingSoon data={data} />
          <Leaderboard data={data} />
        </div>
      )}
    </Page>
  );
}
