import { AlertTriangle, Phone, ShieldCheck, Star } from 'lucide-react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { Link } from '@/core/router/router';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { cn } from '@/shared/lib/cn';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

import { driversQuery, useDrivers } from '../api/logistics-api';
import { DriverStatusBadge } from '../components/badges';
import { LoadError } from '../components/query-state';
import { HOS_LIMITS } from '../lib/hos';
import type { Driver } from '../model/logistics';
import { logisticsRoutes } from '../routes';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(driversQuery());
    return null;
  };

const { driving: DAILY_DRIVING, duty: DUTY_WINDOW, week: WEEKLY } = HOS_LIMITS;

function HoursBar({ driver }: { driver: Driver }) {
  const { t } = useTranslation('logistics');
  const otherDuty = Math.max(0, driver.dutyToday - driver.drivingToday);
  const pct = (h: number) => `${(h / DUTY_WINDOW) * 100}%`;
  const left = Math.max(0, DAILY_DRIVING - driver.drivingToday);
  const near = left < 1;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="w-full min-w-40 space-y-1.5">
          <div className="relative flex h-2 overflow-hidden rounded-full bg-muted">
            <span className="h-full bg-primary" style={{ width: pct(driver.drivingToday) }} />
            <span className="h-full bg-chart-4/45" style={{ width: pct(otherDuty) }} />
            {/* Daily driving limit marker. */}
            <span
              className="absolute inset-y-0 w-0.5 bg-foreground/60"
              style={{ left: pct(DAILY_DRIVING) }}
            />
          </div>
          <p
            className={cn(
              'text-xs tabular-nums',
              near ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            {t('drivers.hoursLeft', { driving: driver.drivingToday, left: left.toFixed(1) })}
          </p>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {t('drivers.hoursTooltip', { driving: driver.drivingToday, duty: driver.dutyToday })}
      </TooltipContent>
    </Tooltip>
  );
}

export default function DriversPage() {
  const { t } = useTranslation('logistics');
  const query = useDrivers();
  const drivers = query.data ?? [];
  const alerts = drivers
    .filter((d) => DAILY_DRIVING - d.drivingToday < 1 || d.weekHours > WEEKLY - 6)
    .sort((a, b) => b.drivingToday - a.drivingToday);
  const onDuty = drivers.filter((d) => d.status !== 'off_duty').length;

  return (
    <Page title={t('drivers.title')} description={t('drivers.description')} width="full">
      {query.isError ? (
        <LoadError onRetry={() => void query.refetch()} />
      ) : (
        <div className="grid items-start gap-4 md:gap-6 xl:grid-cols-[1fr_20rem]">
          <SectionCard
            title={t('drivers.roster')}
            description={t('drivers.rosterDescription', { onDuty, total: drivers.length })}
            flush
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">{t('drivers.columns.driver')}</TableHead>
                    <TableHead>{t('drivers.columns.status')}</TableHead>
                    <TableHead>{t('drivers.columns.vehicle')}</TableHead>
                    <TableHead className="w-56">{t('drivers.columns.today')}</TableHead>
                    <TableHead className="w-40">{t('drivers.columns.week')}</TableHead>
                    <TableHead className="text-right">{t('drivers.columns.drops')}</TableHead>
                    <TableHead className="pr-6 text-right">{t('drivers.columns.rating')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query.isPending
                    ? Array.from({ length: 8 }, (_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={7} className="px-6">
                            <Skeleton className="h-9 w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    : drivers.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="pl-6">
                            <div className="flex items-center gap-3">
                              <InitialsAvatar name={d.name} size="sm" />
                              <div className="leading-tight">
                                <Link
                                  to={logisticsRoutes.driver.href({ driverId: d.id })}
                                  className="block font-medium hover:underline"
                                >
                                  {d.name}
                                </Link>
                                <p className="text-xs text-muted-foreground">{d.base}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <DriverStatusBadge status={d.status} />
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {d.vehicle ?? (
                              <span className="font-sans text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <HoursBar driver={d} />
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1.5">
                              <div className="h-2 overflow-hidden rounded-full bg-muted">
                                <div
                                  className={cn(
                                    'h-full rounded-full',
                                    d.weekHours > WEEKLY - 6 ? 'bg-chart-3' : 'bg-chart-2',
                                  )}
                                  style={{
                                    width: `${Math.min(100, (d.weekHours / WEEKLY) * 100)}%`,
                                  }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground tabular-nums">
                                {d.weekHours} / {WEEKLY} h
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {d.deliveriesToday}
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            <span className="inline-flex items-center gap-1 tabular-nums">
                              <Star className="size-3.5 fill-warning text-warning" />{' '}
                              {d.rating.toFixed(1)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </div>
          </SectionCard>

          <div className="flex flex-col gap-4 md:gap-6">
            <SectionCard
              title={t('drivers.compliance')}
              description={t('drivers.complianceDescription')}
            >
              {query.isPending ? (
                <Skeleton className="h-40 w-full" />
              ) : alerts.length === 0 ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="size-4 text-success" /> {t('drivers.allClear')}
                </p>
              ) : (
                <ul className="space-y-3">
                  {alerts.map((d) => {
                    const daily = DAILY_DRIVING - d.drivingToday < 1;
                    return (
                      <li key={d.id} className="flex gap-3 rounded-lg border p-3">
                        <AlertTriangle
                          className={cn(
                            'mt-0.5 size-4 shrink-0',
                            daily ? 'text-destructive' : 'text-warning',
                          )}
                        />
                        <div className="min-w-0 space-y-1">
                          <p className="text-sm font-medium">{d.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {daily
                              ? t('drivers.alertDaily', { hours: d.drivingToday })
                              : t('drivers.alertWeekly', { hours: d.weekHours })}
                          </p>
                          <a
                            href={`tel:${d.phone.replace(/\s/g, '')}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                          >
                            <Phone className="size-3" /> {d.phone}
                          </a>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </SectionCard>

            <SectionCard title={t('drivers.legend')}>
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-center gap-2.5">
                  <span className="h-2 w-5 rounded-full bg-primary" /> {t('drivers.legendDriving')}
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="h-2 w-5 rounded-full bg-chart-4/45" /> {t('drivers.legendDuty')}
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="h-3 w-0.5 bg-foreground/60" /> {t('drivers.legendLimit')}
                </li>
              </ul>
            </SectionCard>
          </div>
        </div>
      )}
    </Page>
  );
}
