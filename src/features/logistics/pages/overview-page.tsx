import { ArrowRight, Clock, Package, Siren, Timer } from 'lucide-react';
import { useMemo } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link } from '@/core/router/router';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { MeterList } from '@/shared/components/dashboard/meter-list';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { overviewQuery, useOverview } from '../api/logistics-api';
import { SeverityBadge } from '../components/badges';
import { NetworkMap } from '../components/network-map';
import { LoadError } from '../components/query-state';
import { fmtAgo, fmtNumber, fmtShortDate } from '../lib/format';
import { logisticsRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(overviewQuery());
    return null;
  };

function MapLegend() {
  const { t } = useTranslation('logistics');
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="h-0.5 w-5 rounded-full bg-primary/70" /> {t('overview.legend.active')}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-5 border-t-2 border-dashed border-primary/40" />{' '}
        {t('overview.legend.planned')}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-full border-2 border-card bg-primary ring-1 ring-primary" />{' '}
        {t('overview.legend.vehicle')}
      </span>
    </div>
  );
}

export default function OverviewPage() {
  const { t, i18n } = useTranslation('logistics');
  const overview = useOverview();
  const data = overview.data;
  const loading = overview.isPending;
  // Stable reference: a new array on every render would restart the bar animation.
  const volume = useMemo(
    () => data?.volume.map((d) => ({ ...d, label: fmtShortDate(d.day) })) ?? [],
    [data?.volume],
  );

  if (overview.isError) {
    return (
      <Page title={t('overview.title')} description={t('overview.description')} width="full">
        <LoadError onRetry={() => void overview.refetch()} />
      </Page>
    );
  }

  const hubName = (id: string) => data?.hubs.find((h) => h.id === id)?.name ?? id;
  const lanes = [...(data?.lanes ?? [])].sort((a, b) => b.shipments - a.shipments).slice(0, 6);

  return (
    <Page
      title={t('overview.title')}
      description={t('overview.description')}
      width="full"
      actions={
        <>
          <span className="hidden items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground sm:flex">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex size-2 rounded-full bg-success" />
            </span>
            {t('overview.live')}
          </span>
          <Button asChild>
            <Link to={logisticsRoutes.shipments.href()}>
              {t('overview.allShipments')} <ArrowRight />
            </Link>
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
        <StatCard
          label={t('overview.kpi.inTransit')}
          value={data ? fmtNumber(data.kpis.inTransit, i18n.language) : '—'}
          icon={Package}
          delta={data?.kpis.inTransitDelta}
          hint={t('overview.kpi.vsLastWeek')}
          loading={loading}
        />
        <StatCard
          label={t('overview.kpi.onTime')}
          value={data ? `${data.kpis.onTimeRate}%` : '—'}
          icon={Clock}
          color="var(--chart-2)"
          delta={data?.kpis.onTimeDelta}
          hint={t('overview.kpi.vsLastWeek')}
          loading={loading}
        />
        <StatCard
          label={t('overview.kpi.avgDelay')}
          value={data ? t('overview.kpi.minutes', { value: data.kpis.avgDelayMinutes }) : '—'}
          icon={Timer}
          color="var(--chart-3)"
          delta={data?.kpis.avgDelayDelta}
          invert
          hint={t('overview.kpi.vsLastWeek')}
          loading={loading}
        />
        <StatCard
          label={t('overview.kpi.exceptions')}
          value={data ? data.kpis.openExceptions : '—'}
          icon={Siren}
          color="var(--destructive)"
          hint={data ? t('overview.kpi.critical', { count: data.kpis.criticalExceptions }) : null}
          loading={loading}
        />
      </div>

      <div className="grid gap-4 md:gap-6 xl:grid-cols-3">
        <SectionCard
          title={t('overview.map.title')}
          description={t('overview.map.description')}
          action={<MapLegend />}
          className="xl:col-span-2"
          contentClassName="flex flex-col"
          flush
        >
          <div className="relative mx-6 mb-6 min-h-[22rem] flex-1 overflow-hidden rounded-lg border bg-muted/30">
            {data ? (
              <NetworkMap
                hubs={data.hubs}
                lanes={data.lanes}
                ariaLabel={t('overview.map.title')}
                className="absolute inset-0"
              />
            ) : (
              <Skeleton className="size-full rounded-none" />
            )}
          </div>
        </SectionCard>

        <SectionCard
          title={t('overview.exceptions.title')}
          description={t('overview.exceptions.description')}
          flush
          footer={
            <Link
              to={logisticsRoutes.exceptions.href()}
              className="flex items-center justify-between font-medium text-foreground hover:text-primary"
            >
              {t('overview.exceptions.openQueue')} <ArrowRight className="size-4" />
            </Link>
          }
        >
          {data ? (
            <ul className="divide-y">
              {data.exceptions.map((item) => (
                <li key={item.id} className="px-6 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <SeverityBadge severity={item.severity} />
                    <span className="text-xs text-muted-foreground">{fmtAgo(item.openedAt)}</span>
                  </div>
                  <p className="mt-2 text-sm leading-snug font-medium">{item.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    <Link
                      to={logisticsRoutes.shipment.href({ shipmentId: item.shipmentId })}
                      className="font-mono hover:text-primary hover:underline"
                    >
                      {item.shipmentId}
                    </Link>{' '}
                    · {item.location}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-3 px-6 pb-6">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-4 md:gap-6 xl:grid-cols-5">
        <SectionCard
          title={t('overview.volume.title')}
          description={t('overview.volume.description')}
          className="xl:col-span-3"
        >
          {data ? (
            <BarChart
              data={volume}
              xKey="label"
              mode="stacked"
              series={[
                { key: 'delivered', label: t('overview.volume.delivered') },
                { key: 'returned', label: t('overview.volume.returned'), color: 'var(--chart-3)' },
              ]}
              barSize={22}
              className="h-72"
            />
          ) : (
            <Skeleton className="h-72 w-full" />
          )}
        </SectionCard>

        <SectionCard
          title={t('overview.carriers.title')}
          description={t('overview.carriers.description')}
          className="xl:col-span-2"
        >
          {data ? (
            <MeterList
              items={data.carriers.map((c) => ({
                key: c.name,
                label: (
                  <span className="flex items-baseline gap-2">
                    {c.name}
                    <span className="text-xs text-muted-foreground">
                      {t('overview.carriers.shipments', { count: c.shipments })}
                    </span>
                  </span>
                ),
                value: c.onTime,
                max: 100,
                display: `${c.onTime}%`,
                color:
                  c.onTime >= 95
                    ? 'var(--chart-2)'
                    : c.onTime >= 90
                      ? 'var(--chart-1)'
                      : 'var(--chart-3)',
              }))}
            />
          ) : (
            <Skeleton className="h-64 w-full" />
          )}
        </SectionCard>
      </div>

      <SectionCard
        title={t('overview.lanes.title')}
        description={t('overview.lanes.description')}
        flush
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">{t('overview.lanes.lane')}</TableHead>
              <TableHead className="text-right">{t('overview.lanes.shipments')}</TableHead>
              <TableHead className="w-[40%]">{t('overview.lanes.onTime')}</TableHead>
              <TableHead className="pr-6 text-right">{t('overview.lanes.status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data
              ? lanes.map((lane) => (
                  <TableRow key={lane.id}>
                    <TableCell className="pl-6 font-medium">
                      {hubName(lane.from)}
                      <ArrowRight className="mx-2 inline size-3.5 text-muted-foreground" />
                      {hubName(lane.to)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{lane.shipments}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-chart-2"
                            style={{ width: `${lane.onTime}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-xs tabular-nums">{lane.onTime}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="pr-6 text-right text-xs text-muted-foreground">
                      {lane.active ? t('overview.lanes.active') : t('overview.lanes.paused')}
                    </TableCell>
                  </TableRow>
                ))
              : Array.from({ length: 5 }, (_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4} className="px-6">
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </SectionCard>
    </Page>
  );
}
