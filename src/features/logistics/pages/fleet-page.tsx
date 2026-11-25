import { BatteryCharging, Fuel, MapPin, Wrench } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link } from '@/core/router/router';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { cn } from '@/shared/lib/cn';
import { Skeleton } from '@/shared/ui/skeleton';

import { fleetQuery, useFleet } from '../api/logistics-api';
import { VehicleStatusBadge } from '../components/badges';
import { LoadError } from '../components/query-state';
import { fmtNumber } from '../lib/format';
import { VEHICLE_STATUSES, type Vehicle, type VehicleStatus } from '../model/logistics';
import { logisticsRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(fleetQuery());
    return null;
  };

function EnergyMeter({ vehicle }: { vehicle: Vehicle }) {
  const { t } = useTranslation('logistics');
  const low = vehicle.energy < 25;
  const Icon = vehicle.electric ? BatteryCharging : Fuel;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="size-3.5" />
          {vehicle.electric ? t('fleet.charge') : t('fleet.fuel')}
        </span>
        <span className={cn('font-medium tabular-nums', low && 'text-destructive')}>
          {vehicle.energy}%
        </span>
      </div>
      {/* Segmented gauge: 10 cells read faster than a thin bar at a glance. */}
      <div className="grid grid-cols-10 gap-0.5" aria-hidden>
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className={cn(
              'h-2 rounded-[2px]',
              i < Math.round(vehicle.energy / 10)
                ? low
                  ? 'bg-destructive'
                  : vehicle.electric
                    ? 'bg-chart-2'
                    : 'bg-primary'
                : 'bg-muted',
            )}
          />
        ))}
      </div>
    </div>
  );
}

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const { t, i18n } = useTranslation('logistics');
  const serviceDue = vehicle.nextServiceKm < 2_000;
  return (
    <article className="flex flex-col gap-5 rounded-xl border bg-card p-5 shadow-xs">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={logisticsRoutes.vehicle.href({ vehicleId: vehicle.id })}
            className="block font-mono text-sm font-semibold tracking-wide hover:underline"
          >
            {vehicle.plate}
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            {vehicle.model} · {t(`fleet.kind.${vehicle.kind}`)}
          </p>
        </div>
        <VehicleStatusBadge status={vehicle.status} />
      </header>

      <EnergyMeter vehicle={vehicle} />

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <dt className="text-xs text-muted-foreground">{t('fleet.load')}</dt>
          <dd className="font-medium tabular-nums">{vehicle.loadPct}%</dd>
        </div>
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <dt className="text-xs text-muted-foreground">{t('fleet.odometer')}</dt>
          <dd className="font-medium tabular-nums">
            {fmtNumber(vehicle.odometerKm, i18n.language)} km
          </dd>
        </div>
      </dl>

      <div
        className={cn(
          'flex items-center gap-2 text-xs',
          serviceDue ? 'font-medium text-foreground' : 'text-muted-foreground',
        )}
      >
        <Wrench className={cn('size-3.5', serviceDue && 'text-warning')} />
        {vehicle.status === 'maintenance'
          ? t('fleet.inWorkshop')
          : serviceDue
            ? t('fleet.serviceDue', { km: fmtNumber(vehicle.nextServiceKm, i18n.language) })
            : t('fleet.serviceIn', { km: fmtNumber(vehicle.nextServiceKm, i18n.language) })}
      </div>

      <footer className="mt-auto flex items-center justify-between gap-3 border-t pt-4 text-sm">
        {vehicle.driver ? (
          <span className="flex min-w-0 items-center gap-2">
            <InitialsAvatar name={vehicle.driver} size="xs" />
            <span className="truncate">{vehicle.driver}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">{t('fleet.unassigned')}</span>
        )}
        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3.5" /> {vehicle.location}
        </span>
      </footer>
    </article>
  );
}

export default function FleetPage() {
  const { t } = useTranslation('logistics');
  const query = useFleet();
  const [status, setStatus] = useState<'all' | VehicleStatus>('all');
  const fleet = query.data ?? [];
  const visible = status === 'all' ? fleet : fleet.filter((v) => v.status === status);
  const onRoute = fleet.filter((v) => v.status === 'on_route');
  const avgLoad = onRoute.length
    ? Math.round(onRoute.reduce((s, v) => s + v.loadPct, 0) / onRoute.length)
    : 0;

  return (
    <Page
      title={t('fleet.title')}
      description={t('fleet.description')}
      width="full"
      actions={
        <SegmentedControl<'all' | VehicleStatus>
          value={status}
          onChange={setStatus}
          aria-label={t('fleet.filter')}
          options={[
            { value: 'all', label: t('fleet.all') },
            ...VEHICLE_STATUSES.map((s) => ({ value: s, label: t(`vehicleStatus.${s}`) })),
          ]}
        />
      }
    >
      {query.isError ? (
        <LoadError onRetry={() => void query.refetch()} />
      ) : (
        <>
          <section className="rounded-xl border bg-card px-6 py-2 shadow-xs">
            {query.isPending ? (
              <Skeleton className="my-3 h-16 w-full" />
            ) : (
              <StatStrip
                items={[
                  {
                    key: 'onRoute',
                    label: t('fleet.kpi.onRoute'),
                    value: `${onRoute.length}/${fleet.length}`,
                    hint: t('fleet.kpi.onRouteHint'),
                  },
                  {
                    key: 'load',
                    label: t('fleet.kpi.load'),
                    value: `${avgLoad}%`,
                    delta: 3.1,
                    hint: t('fleet.kpi.loadHint'),
                  },
                  {
                    key: 'charging',
                    label: t('fleet.kpi.charging'),
                    value: fleet.filter((v) => v.status === 'charging').length,
                    hint: t('fleet.kpi.chargingHint'),
                  },
                  {
                    key: 'service',
                    label: t('fleet.kpi.service'),
                    value: fleet.filter((v) => v.nextServiceKm < 2_000).length,
                    hint: t('fleet.kpi.serviceHint'),
                  },
                ]}
              />
            )}
          </section>

          <div className="grid gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-3 2xl:grid-cols-4">
            {query.isPending
              ? Array.from({ length: 8 }, (_, i) => (
                  <Skeleton key={i} className="h-72 rounded-xl" />
                ))
              : visible.map((v) => <VehicleCard key={v.id} vehicle={v} />)}
          </div>
        </>
      )}
    </Page>
  );
}
