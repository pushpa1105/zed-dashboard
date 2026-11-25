import { Clock, Package, Phone, ShieldCheck, Star } from 'lucide-react';
import { useMemo } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { useParams } from '@/core/router/router';
import { BarChart } from '@/shared/components/charts/bar-chart';
import { MeterList } from '@/shared/components/dashboard/meter-list';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { DescriptionList } from '@/shared/components/display/description-list';
import { EmptyState } from '@/shared/components/display/empty-state';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { driverQuery, useDriver } from '../api/logistics-api';
import { BackLink } from '../components/back-link';
import { DriverStatusBadge, ExpiryBadge, SeverityBadge } from '../components/badges';
import { LoadError } from '../components/query-state';
import { fmtAgo, fmtDate, fmtDuration, fmtNumber, fmtShortDate } from '../lib/format';
import { HOS_LIMITS } from '../lib/hos';
import type { DriverDetail } from '../model/logistics';
import { logisticsRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ params }) => {
    await queryClient.prefetchQuery(driverQuery(params.driverId!));
    return null;
  };

function HoursCard({ driver }: { driver: DriverDetail }) {
  const { t } = useTranslation('logistics');
  const days = useMemo(
    () => driver.hours.map((d) => ({ ...d, label: fmtShortDate(d.day) })),
    [driver.hours],
  );
  const meter = (key: keyof typeof HOS_LIMITS, value: number) => ({
    key,
    label: t(`driver.hos.${key}`),
    value,
    max: HOS_LIMITS[key],
    display: t('driver.hos.value', { value, max: HOS_LIMITS[key] }),
    color: HOS_LIMITS[key] - value < 1 ? 'var(--destructive)' : undefined,
  });
  return (
    <SectionCard
      title={t('driver.hos.title')}
      description={t('driver.hos.description')}
      className="xl:col-span-2"
    >
      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <MeterList
          items={[
            meter('driving', driver.drivingToday),
            meter('duty', driver.dutyToday),
            meter('week', driver.weekHours),
          ]}
        />
        <BarChart
          data={days}
          xKey="label"
          series={[
            { key: 'driving', label: t('driver.hos.drivingSeries') },
            { key: 'duty', label: t('driver.hos.dutySeries') },
          ]}
          valueFormatter={(h) => `${h} h`}
          barSize={14}
          className="h-56"
        />
      </div>
    </SectionCard>
  );
}

function ProfileCard({ driver }: { driver: DriverDetail }) {
  const { t, i18n } = useTranslation('logistics');
  return (
    <SectionCard title={t('driver.profile.title')}>
      <DescriptionList
        items={[
          {
            key: 'status',
            term: t('driver.profile.status'),
            detail: <DriverStatusBadge status={driver.status} />,
          },
          { key: 'base', term: t('driver.profile.base'), detail: driver.base },
          {
            key: 'vehicle',
            term: t('driver.profile.vehicle'),
            detail: driver.vehicle ? (
              <span className="font-mono text-xs">{driver.vehicle}</span>
            ) : (
              '—'
            ),
          },
          {
            key: 'license',
            term: t('driver.profile.license', { class: driver.licenseClass }),
            detail: (
              <span className="inline-flex items-center gap-2">
                {fmtDate(driver.licenseExpiresAt)}
                <ExpiryBadge expiresAt={driver.licenseExpiresAt} />
              </span>
            ),
          },
          { key: 'hired', term: t('driver.profile.hired'), detail: fmtDate(driver.hiredAt) },
          {
            key: 'distance',
            term: t('driver.profile.distance'),
            detail: `${fmtNumber(driver.distance30dKm, i18n.language)} km`,
          },
        ]}
      />
    </SectionCard>
  );
}

function TripsCard({ driver }: { driver: DriverDetail }) {
  const { t, i18n } = useTranslation('logistics');
  return (
    <SectionCard
      title={t('driver.trips.title')}
      description={t('driver.trips.description')}
      className="xl:col-span-2"
      flush
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">{t('driver.trips.date')}</TableHead>
              <TableHead>{t('driver.trips.route')}</TableHead>
              <TableHead className="text-right">{t('driver.trips.distance')}</TableHead>
              <TableHead className="text-right">{t('driver.trips.stops')}</TableHead>
              <TableHead className="pr-6 text-right">{t('driver.trips.arrival')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {driver.trips.map((trip) => (
              <TableRow key={trip.id}>
                <TableCell className="pl-6 tabular-nums">{fmtShortDate(trip.date)}</TableCell>
                <TableCell className="font-medium whitespace-nowrap">
                  {trip.from} → {trip.to}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {fmtNumber(trip.distanceKm, i18n.language)} km
                </TableCell>
                <TableCell className="text-right tabular-nums">{trip.stops}</TableCell>
                <TableCell className="pr-6 text-right whitespace-nowrap">
                  {trip.delayMinutes ? (
                    <span className="text-destructive">
                      {t('driver.trips.late', { value: fmtDuration(trip.delayMinutes) })}
                    </span>
                  ) : (
                    <span className="text-success">{t('driver.trips.onTime')}</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </SectionCard>
  );
}

function SafetyCard({ driver }: { driver: DriverDetail }) {
  const { t } = useTranslation('logistics');
  return (
    <SectionCard title={t('driver.safety.title')} description={t('driver.safety.description')}>
      {driver.safetyEvents.length === 0 ? (
        <EmptyState
          variant="inline"
          icon={ShieldCheck}
          title={t('driver.safety.empty')}
          description={t('driver.safety.emptyHint')}
        />
      ) : (
        <ul className="divide-y">
          {driver.safetyEvents.map((e) => (
            <li key={e.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1 space-y-0.5 text-sm">
                <p className="font-medium">{t(`safetyEvent.${e.type}`)}</p>
                <p className="text-xs text-muted-foreground">
                  {e.location} · {fmtAgo(e.at)}
                </p>
              </div>
              <SeverityBadge severity={e.severity} />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

export default function DriverPage() {
  const { t, i18n } = useTranslation('logistics');
  const { driverId = '' } = useParams();
  const query = useDriver(driverId);
  const d = query.data;
  const back = <BackLink to={logisticsRoutes.drivers.href()} label={t('driver.back')} />;

  if (query.isError) {
    return (
      <Page title={t('driver.title')} width="full">
        {back}
        <LoadError onRetry={() => void query.refetch()} />
      </Page>
    );
  }

  return (
    <Page
      title={d?.name ?? t('driver.title')}
      description={d ? t('driver.description', { base: d.base }) : undefined}
      width="full"
      actions={
        d && (
          <Button variant="outline" asChild>
            <a href={`tel:${d.phone.replace(/\s/g, '')}`}>
              <Phone /> {d.phone}
            </a>
          </Button>
        )
      }
    >
      {back}

      <div className="grid gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
        <StatCard
          label={t('driver.kpi.onTime')}
          value={d ? `${d.onTimeRate}%` : '—'}
          icon={Clock}
          hint={t('driver.kpi.last30')}
          loading={!d}
        />
        <StatCard
          label={t('driver.kpi.deliveries')}
          value={d ? fmtNumber(d.deliveries30d, i18n.language) : '—'}
          icon={Package}
          color="var(--chart-2)"
          hint={t('driver.kpi.last30')}
          loading={!d}
        />
        <StatCard
          label={t('driver.kpi.rating')}
          value={d ? d.rating.toFixed(1) : '—'}
          icon={Star}
          color="var(--warning)"
          hint={t('driver.kpi.ratingHint')}
          loading={!d}
        />
        <StatCard
          label={t('driver.kpi.safety')}
          value={d ? d.safetyScore : '—'}
          icon={ShieldCheck}
          color="var(--chart-3)"
          hint={t('driver.kpi.safetyHint')}
          loading={!d}
        />
      </div>

      {d ? (
        <div className="grid gap-4 md:gap-6 xl:grid-cols-3">
          <HoursCard driver={d} />
          <ProfileCard driver={d} />
          <TripsCard driver={d} />
          <SafetyCard driver={d} />
        </div>
      ) : (
        <div className="grid gap-4 md:gap-6 xl:grid-cols-3">
          <Skeleton className="h-80 rounded-xl xl:col-span-2" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      )}
    </Page>
  );
}
