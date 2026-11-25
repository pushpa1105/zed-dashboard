import { Monitor, Smartphone, Star, Tablet, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { seriesColor } from '@/shared/components/charts/series';
import { TrendBadge } from '@/shared/components/dashboard/trend-badge';
import { cn } from '@/shared/lib/cn';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

type ServiceState = 'operational' | 'degraded' | 'outage';
const STATE = {
  operational: { dot: 'bg-success', bar: 'var(--success)' },
  degraded: { dot: 'bg-warning', bar: 'var(--warning)' },
  outage: { dot: 'bg-destructive', bar: 'var(--destructive)' },
};

/** Service health with a 30-day uptime strip per service and recent incidents. */
export function SystemStatus({
  services,
  incidents = [],
  stateLabels = { operational: 'Operational', degraded: 'Degraded', outage: 'Outage' },
  incidentsLabel = 'Recent incidents',
}: {
  services: Array<{
    id: string;
    name: string;
    state: ServiceState;
    uptime: number;
    days: ServiceState[];
  }>;
  incidents?: Array<{ id: string; title: ReactNode; time: ReactNode; state: ServiceState }>;
  stateLabels?: Record<ServiceState, string>;
  incidentsLabel?: string;
}) {
  const worst = services.some((s) => s.state === 'outage')
    ? 'outage'
    : services.some((s) => s.state === 'degraded')
      ? 'degraded'
      : 'operational';
  return (
    <div className="space-y-4">
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium',
          worst === 'operational'
            ? 'bg-success/10'
            : worst === 'degraded'
              ? 'bg-warning/15'
              : 'bg-destructive/10',
        )}
      >
        <span className={cn('size-2 rounded-full', STATE[worst].dot)} /> {stateLabels[worst]}
      </div>
      <ul className="space-y-3">
        {services.map((s) => (
          <li key={s.id} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-2">
                <span className={cn('size-1.5 rounded-full', STATE[s.state].dot)} />
                {s.name}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {s.uptime.toFixed(2)}%
              </span>
            </div>
            <div className="flex gap-[2px]">
              {s.days.map((d, i) => (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>
                    <span
                      className="h-6 flex-1 rounded-[2px]"
                      style={{ background: STATE[d].bar, opacity: d === 'operational' ? 0.55 : 1 }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>{stateLabels[d]}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </li>
        ))}
      </ul>
      {incidents.length > 0 && (
        <div className="space-y-2 border-t pt-3">
          <p className="text-xs font-medium text-muted-foreground">{incidentsLabel}</p>
          {incidents.map((inc) => (
            <div key={inc.id} className="flex items-start gap-2 text-sm">
              <span className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', STATE[inc.state].dot)} />
              <span className="min-w-0 flex-1">{inc.title}</span>
              <span className="text-xs text-muted-foreground">{inc.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Storage used, split by file type, as one segmented bar plus a legend. */
export function StorageUsage({
  used,
  total,
  unit = 'GB',
  segments,
  ofLabel = 'of',
}: {
  used: number;
  total: number;
  unit?: string;
  segments: Array<{ id: string; label: string; value: number }>;
  ofLabel?: string;
}) {
  return (
    <div className="space-y-4">
      <p className="text-3xl font-semibold tracking-tight tabular-nums">
        {used}
        <span className="ml-1 text-sm font-normal text-muted-foreground">
          {unit} {ofLabel} {total} {unit}
        </span>
      </p>
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-full bg-muted">
        {segments.map((s, i) => (
          <span
            key={s.id}
            style={{ width: `${(s.value / total) * 100}%`, background: seriesColor(i) }}
          />
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {segments.map((s, i) => (
          <li key={s.id} className="flex items-center gap-2">
            <span className="size-2.5 rounded-[3px]" style={{ background: seriesColor(i) }} />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="ml-auto text-xs tabular-nums">
              {s.value} {unit}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Average rating with 5→1 star distribution bars. */
export function RatingsBreakdown({
  counts,
  reviewsLabel = 'reviews',
}: {
  /** Counts for 5, 4, 3, 2, 1 stars, in that order. */
  counts: [number, number, number, number, number];
  reviewsLabel?: string;
}) {
  const total = counts.reduce((a, b) => a + b, 0) || 1;
  const avg = counts.reduce((sum, c, i) => sum + c * (5 - i), 0) / total;
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <div className="text-center sm:w-28">
        <p className="text-4xl font-semibold tabular-nums">{avg.toFixed(1)}</p>
        <div className="mt-1 flex justify-center gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={cn(
                'size-3.5',
                i < Math.round(avg) ? 'fill-warning text-warning' : 'text-muted-foreground/40',
              )}
            />
          ))}
        </div>
        <p className="mt-1 text-xs text-muted-foreground tabular-nums">
          {total.toLocaleString()} {reviewsLabel}
        </p>
      </div>
      <ul className="flex-1 space-y-1.5">
        {counts.map((c, i) => (
          <li key={i} className="grid grid-cols-[1.25rem_1fr_2.75rem] items-center gap-2 text-xs">
            <span className="text-muted-foreground tabular-nums">{5 - i}</span>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-warning"
                style={{ width: `${(c / total) * 100}%` }}
              />
            </div>
            <span className="text-right text-muted-foreground tabular-nums">
              {Math.round((c / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Audience per channel with follower count and growth. */
export function SocialStats({
  channels,
}: {
  channels: Array<{
    id: string;
    name: string;
    handle: string;
    followers: string;
    delta: number;
    color: string;
    monogram: string;
  }>;
}) {
  return (
    <ul className="space-y-3">
      {channels.map((c) => (
        <li key={c.id} className="flex items-center gap-3">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-overlay-foreground"
            style={{ background: c.color }}
            aria-hidden
          >
            {c.monogram}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{c.name}</p>
            <p className="truncate text-xs text-muted-foreground">{c.handle}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold tabular-nums">{c.followers}</p>
            <TrendBadge delta={c.delta} variant="text" />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Top locations with share bars (country codes instead of flag images). */
export function TopLocations({
  rows,
}: {
  rows: Array<{ code: string; name: string; value: number; share: number }>;
}) {
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.code} className="grid grid-cols-[2rem_1fr_auto] items-center gap-3">
          <span className="flex h-6 items-center justify-center rounded border bg-muted/50 font-mono text-[0.625rem] font-semibold">
            {r.code}
          </span>
          <div className="min-w-0 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="truncate">{r.name}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{r.share}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted">
              <div className="h-full rounded-full bg-chart-4" style={{ width: `${r.share}%` }} />
            </div>
          </div>
          <span className="w-14 text-right text-sm font-medium tabular-nums">
            {r.value.toLocaleString()}
          </span>
        </li>
      ))}
    </ul>
  );
}

const DEVICE_ICON: Record<string, LucideIcon> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

/** Sessions by device type as three columns with share and trend. */
export function DeviceSplit({
  devices,
}: {
  devices: Array<{
    id: 'desktop' | 'mobile' | 'tablet';
    label: string;
    share: number;
    delta: number;
  }>;
}) {
  return (
    <div className="grid grid-cols-3 divide-x rounded-xl border">
      {devices.map((d, i) => {
        const Icon = DEVICE_ICON[d.id]!;
        return (
          <div key={d.id} className="space-y-2 p-4 text-center">
            <Icon className="mx-auto size-5" style={{ color: seriesColor(i) }} />
            <p className="text-xs text-muted-foreground">{d.label}</p>
            <p className="text-xl font-semibold tabular-nums">{d.share}%</p>
            <TrendBadge delta={d.delta} />
          </div>
        );
      })}
    </div>
  );
}
