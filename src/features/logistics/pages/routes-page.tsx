import { ArrowDown, ArrowUp, Clock, RotateCcw, Save, Sparkles, Timer } from 'lucide-react';
import { useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { SectionCard } from '@/shared/components/dashboard/section-card';
import { StatStrip } from '@/shared/components/dashboard/stat-strip';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';

import { routesQuery, useReorderStops, useRoutes } from '../api/logistics-api';
import { LoadError } from '../components/query-state';
import { RouteMap } from '../components/route-map';
import { fmtDuration, fromMinutes } from '../lib/format';
import { optimise, planRoute } from '../lib/plan';
import type { PlannedRoute, Stop } from '../model/logistics';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(routesQuery());
    return null;
  };

function Planner({ route }: { route: PlannedRoute }) {
  const { t } = useTranslation('logistics');
  const [order, setOrder] = useState<Stop[]>(route.stops);
  const [hovered, setHovered] = useState<string | null>(null);
  const save = useReorderStops();

  const plan = planRoute(route, order);
  const saved = planRoute(route, route.stops);
  const dirty = order.map((s) => s.id).join() !== route.stops.map((s) => s.id).join();
  const load = Math.round((plan.parcels / route.capacity) * 100);

  const move = (index: number, delta: number) =>
    setOrder((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(index + delta, 0, item!);
      return next;
    });

  return (
    <div className="space-y-4 md:space-y-6">
      <section className="rounded-xl border bg-card px-6 py-2 shadow-xs">
        <StatStrip
          items={[
            {
              key: 'distance',
              label: t('routes.kpi.distance'),
              value: `${plan.distanceKm} km`,
              delta: dirty
                ? Math.round(((plan.distanceKm - saved.distanceKm) / saved.distanceKm) * 1000) / 10
                : undefined,
              invert: true,
            },
            {
              key: 'drive',
              label: t('routes.kpi.drive'),
              value: fmtDuration(plan.driveMinutes),
              hint: t('routes.kpi.finish', { time: plan.finish }),
            },
            {
              key: 'late',
              label: t('routes.kpi.late'),
              value: plan.lateCount,
              hint: plan.lateCount ? t('routes.kpi.lateHint') : t('routes.kpi.allOnTime'),
            },
            {
              key: 'load',
              label: t('routes.kpi.load'),
              value: `${load}%`,
              hint: t('routes.kpi.parcels', { count: plan.parcels, capacity: route.capacity }),
            },
          ]}
        />
      </section>

      <div className="grid gap-4 md:gap-6 xl:grid-cols-[28rem_1fr]">
        <SectionCard
          title={t('routes.stops')}
          description={t('routes.stopsDescription')}
          flush
          action={
            <Button variant="outline" size="sm" onClick={() => setOrder(optimise(route, order))}>
              <Sparkles /> {t('routes.optimise')}
            </Button>
          }
          footer={
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs">
                {dirty ? t('routes.unsaved') : t('routes.savedState')}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!dirty}
                  onClick={() => setOrder(route.stops)}
                >
                  <RotateCcw /> {t('routes.reset')}
                </Button>
                <Button
                  size="sm"
                  disabled={!dirty || save.isPending}
                  onClick={() => save.mutate({ id: route.id, stopIds: order.map((s) => s.id) })}
                >
                  <Save /> {t('routes.save')}
                </Button>
              </div>
            </div>
          }
        >
          <div className="flex items-center gap-3 border-y bg-muted/40 px-6 py-3 text-sm">
            <span className="flex size-7 items-center justify-center rounded-md bg-foreground text-xs font-semibold text-background">
              D
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{route.depot}</p>
              <p className="text-xs text-muted-foreground">
                {t('routes.departs', { time: route.departure })}
              </p>
            </div>
          </div>
          <ol className="divide-y">
            {plan.stops.map((stop, i) => (
              <li
                key={stop.id}
                onMouseEnter={() => setHovered(stop.id)}
                onMouseLeave={() => setHovered(null)}
                className={cn(
                  'flex items-start gap-3 px-6 py-3 transition-colors',
                  hovered === stop.id && 'bg-muted/50',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                    stop.late
                      ? 'bg-destructive text-destructive-foreground'
                      : 'bg-primary text-primary-foreground',
                  )}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate text-sm font-medium">{stop.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{stop.address}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 font-medium tabular-nums',
                        stop.late ? 'text-destructive' : 'text-foreground',
                      )}
                    >
                      <Clock className="size-3" /> {fromMinutes(stop.arrival)}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {t('routes.window', { from: stop.windowStart, to: stop.windowEnd })}
                    </span>
                    {stop.wait > 0 && (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Timer className="size-3" />
                        {t('routes.wait', { value: fmtDuration(stop.wait) })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                    aria-label={t('routes.moveUp', { name: stop.name })}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    disabled={i === plan.stops.length - 1}
                    onClick={() => move(i, 1)}
                    aria-label={t('routes.moveDown', { name: stop.name })}
                  >
                    <ArrowDown />
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        </SectionCard>

        <SectionCard
          title={t('routes.map')}
          description={t('routes.mapDescription', { km: plan.distanceKm })}
          action={
            <span className="flex items-center gap-2 text-sm">
              <InitialsAvatar name={route.driver} size="xs" />
              <span className="hidden sm:inline">{route.driver}</span>
              <span className="font-mono text-xs text-muted-foreground">{route.vehicle}</span>
            </span>
          }
          flush
          className="xl:sticky xl:top-20 xl:self-start"
        >
          <div className="mx-6 mb-6 aspect-[16/10] overflow-hidden rounded-lg border bg-muted/20">
            <RouteMap route={route} stops={plan.stops} highlight={hovered} label={route.name} />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

export default function RoutesPage() {
  const { t } = useTranslation('logistics');
  const query = useRoutes();
  const [routeId, setRouteId] = useState<string | null>(null);
  const route = query.data?.find((r) => r.id === routeId) ?? query.data?.[0];

  return (
    <Page
      title={t('routes.title')}
      description={t('routes.description')}
      width="full"
      actions={
        query.data && (
          <Select value={route?.id} onValueChange={setRouteId}>
            <SelectTrigger className="w-72" aria-label={t('routes.pick')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {query.data.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      }
    >
      {query.isError ? (
        <LoadError onRetry={() => void query.refetch()} />
      ) : !route ? (
        <Skeleton className="h-[36rem] w-full rounded-xl" />
      ) : (
        // Remount per route (and after a save) so local order resets to the server's.
        <Planner key={`${route.id}:${route.stops.map((s) => s.id).join()}`} route={route} />
      )}
    </Page>
  );
}
