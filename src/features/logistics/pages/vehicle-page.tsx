import { BatteryCharging, CalendarClock, FileText, Fuel, Gauge, Route, Wrench } from 'lucide-react';
import { useMemo } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { useParams } from '@/core/router/router';
import { LineChart } from '@/shared/components/charts/line-chart';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatCard } from '@/shared/components/dashboard/stat-card';
import { DescriptionList } from '@/shared/components/display/description-list';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { useVehicle, vehicleQuery } from '../api/logistics-api';
import { BackLink } from '../components/back-link';
import { ExpiryBadge, VehicleStatusBadge } from '../components/badges';
import { LoadError } from '../components/query-state';
import { consumptionUnit, fmtCurrency, fmtDate, fmtNumber, fmtShortDate } from '../lib/format';
import type { VehicleDetail } from '../model/logistics';
import { logisticsRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async ({ params }) => {
    await queryClient.prefetchQuery(vehicleQuery(params.vehicleId!));
    return null;
  };

function EfficiencyCard({ vehicle }: { vehicle: VehicleDetail }) {
  const { t } = useTranslation('logistics');
  const unit = consumptionUnit(vehicle.electric);
  const data = useMemo(
    () => vehicle.efficiency.map((w) => ({ ...w, label: fmtShortDate(w.week) })),
    [vehicle.efficiency],
  );
  const average =
    vehicle.efficiency.reduce((sum, w) => sum + w.consumption, 0) / vehicle.efficiency.length;
  return (
    <SectionCard
      title={vehicle.electric ? t('vehicle.efficiency.electric') : t('vehicle.efficiency.fuel')}
      description={t('vehicle.efficiency.description', { unit })}
      className="xl:col-span-2"
    >
      <LineChart
        data={data}
        xKey="label"
        series={[{ key: 'consumption', label: unit }]}
        curve="monotone"
        dots
        target={{ value: average, label: t('vehicle.efficiency.average') }}
        className="h-72"
      />
    </SectionCard>
  );
}

function SpecsCard({ vehicle }: { vehicle: VehicleDetail }) {
  const { t, i18n } = useTranslation('logistics');
  return (
    <SectionCard title={t('vehicle.specs')}>
      <DescriptionList
        items={[
          { key: 'model', term: t('vehicle.model'), detail: vehicle.model },
          {
            key: 'vin',
            term: t('vehicle.vin'),
            detail: <span className="font-mono text-xs">{vehicle.vin}</span>,
          },
          { key: 'year', term: t('vehicle.year'), detail: vehicle.year },
          {
            key: 'payload',
            term: t('vehicle.payload'),
            detail: `${fmtNumber(vehicle.payloadKg, i18n.language)} kg`,
          },
          {
            key: 'tank',
            term: vehicle.electric ? t('vehicle.battery') : t('vehicle.tank'),
            detail: `${vehicle.tankCapacity} ${vehicle.electric ? 'kWh' : 'L'}`,
          },
          { key: 'location', term: t('vehicle.location'), detail: vehicle.location },
          {
            key: 'driver',
            term: t('vehicle.driver'),
            detail: vehicle.driver ?? t('fleet.unassigned'),
          },
        ]}
      />
    </SectionCard>
  );
}

function MaintenanceCard({ vehicle }: { vehicle: VehicleDetail }) {
  const { t, i18n } = useTranslation('logistics');
  return (
    <SectionCard
      title={t('vehicle.maintenance.title')}
      description={t('vehicle.maintenance.description')}
      className="xl:col-span-2"
      flush
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">{t('vehicle.maintenance.date')}</TableHead>
              <TableHead>{t('vehicle.maintenance.work')}</TableHead>
              <TableHead>{t('vehicle.maintenance.workshop')}</TableHead>
              <TableHead className="text-right">{t('vehicle.maintenance.odometer')}</TableHead>
              <TableHead className="pr-6 text-right">{t('vehicle.maintenance.cost')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicle.maintenance.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="pl-6 tabular-nums">{fmtDate(m.date)}</TableCell>
                <TableCell className="font-medium">{t(`serviceType.${m.type}`)}</TableCell>
                <TableCell className="text-muted-foreground">{m.workshop}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {fmtNumber(m.odometerKm, i18n.language)} km
                </TableCell>
                <TableCell className="pr-6 text-right tabular-nums">
                  {fmtCurrency(m.cost, i18n.language)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </SectionCard>
  );
}

function UpcomingCard({ vehicle }: { vehicle: VehicleDetail }) {
  const { t, i18n } = useTranslation('logistics');
  return (
    <SectionCard title={t('vehicle.upcoming.title')}>
      <ul className="space-y-3">
        {vehicle.upcoming.map((u) => (
          <li key={u.id} className="flex gap-3 rounded-lg border p-3">
            <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="space-y-0.5 text-sm">
              <p className="font-medium">{t(`serviceType.${u.type}`)}</p>
              <p className="text-xs text-muted-foreground">
                {t('vehicle.upcoming.due', { date: fmtDate(u.dueAt) })}
                {u.dueKm !== null &&
                  ` · ${t('vehicle.upcoming.dueKm', { km: fmtNumber(u.dueKm, i18n.language) })}`}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

function DocumentsCard({ vehicle }: { vehicle: VehicleDetail }) {
  const { t } = useTranslation('logistics');
  const documents = [...vehicle.documents].sort((a, b) => a.expiresAt.localeCompare(b.expiresAt));
  return (
    <SectionCard title={t('vehicle.documents.title')}>
      <ul className="divide-y">
        {documents.map((d) => (
          <li key={d.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <FileText className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium">{t(`documentType.${d.type}`)}</p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {d.reference} · {t('vehicle.documents.expires', { date: fmtDate(d.expiresAt) })}
              </p>
            </div>
            <ExpiryBadge expiresAt={d.expiresAt} />
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

export default function VehiclePage() {
  const { t, i18n } = useTranslation('logistics');
  const { vehicleId = '' } = useParams();
  const query = useVehicle(vehicleId);
  const v = query.data;
  const back = <BackLink to={logisticsRoutes.fleet.href()} label={t('vehicle.back')} />;

  if (query.isError) {
    return (
      <Page title={t('vehicle.title')} width="full">
        {back}
        <LoadError onRetry={() => void query.refetch()} />
      </Page>
    );
  }

  const km = (value: number) => `${fmtNumber(value, i18n.language)} km`;
  const distance = v?.efficiency.reduce((sum, w) => sum + w.distanceKm, 0) ?? 0;
  const consumption = v ? v.efficiency[v.efficiency.length - 1]!.consumption : 0;

  return (
    <Page
      title={v?.plate ?? t('vehicle.title')}
      description={v ? `${v.model} · ${t(`fleet.kind.${v.kind}`)}` : undefined}
      width="full"
      actions={v && <VehicleStatusBadge status={v.status} />}
    >
      {back}

      <div className="grid gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
        <StatCard
          label={t('vehicle.kpi.odometer')}
          value={v ? km(v.odometerKm) : '—'}
          icon={Gauge}
          loading={!v}
        />
        <StatCard
          label={t('vehicle.kpi.consumption')}
          value={v ? `${consumption} ${consumptionUnit(v.electric)}` : '—'}
          icon={v?.electric ? BatteryCharging : Fuel}
          color="var(--chart-2)"
          hint={t('vehicle.kpi.lastWeek')}
          loading={!v}
        />
        <StatCard
          label={t('vehicle.kpi.distance')}
          value={km(distance)}
          icon={Route}
          color="var(--chart-3)"
          hint={t('vehicle.kpi.twelveWeeks')}
          loading={!v}
        />
        <StatCard
          label={t('vehicle.kpi.service')}
          value={
            v?.status === 'maintenance' ? t('fleet.inWorkshop') : v ? km(v.nextServiceKm) : '—'
          }
          icon={Wrench}
          color="var(--chart-4)"
          loading={!v}
        />
      </div>

      {v ? (
        <div className="grid gap-4 md:gap-6 xl:grid-cols-3">
          <EfficiencyCard vehicle={v} />
          <SpecsCard vehicle={v} />
          <MaintenanceCard vehicle={v} />
          <div className="flex flex-col gap-4 md:gap-6">
            <UpcomingCard vehicle={v} />
            <DocumentsCard vehicle={v} />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:gap-6 xl:grid-cols-3">
          <Skeleton className="h-96 rounded-xl xl:col-span-2" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      )}
    </Page>
  );
}
