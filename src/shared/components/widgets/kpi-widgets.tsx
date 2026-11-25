import type { ReactNode } from 'react';

import { Gauge } from '@/shared/components/charts/gauge';
import { ProgressRing } from '@/shared/components/charts/progress-ring';
import { seriesColor } from '@/shared/components/charts/series';
import { TrendBadge } from '@/shared/components/dashboard/trend-badge';
import { cn } from '@/shared/lib/cn';

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 1 });

/** A value measured against a target: big number, bar to target, gap remaining. */
export function KpiTarget({
  label,
  value,
  target,
  format = fmt,
  delta,
  remainingLabel = 'to target',
  reachedLabel = 'Target reached',
}: {
  label: ReactNode;
  value: number;
  target: number;
  format?: (n: number) => string;
  delta?: number;
  remainingLabel?: string;
  reachedLabel?: string;
}) {
  const pct = Math.min(100, (value / target) * 100);
  const reached = value >= target;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>{label}</span>
        {delta !== undefined && <TrendBadge delta={delta} />}
      </div>
      <p className="text-3xl font-semibold tracking-tight tabular-nums">
        {format(value)}
        <span className="mt-1 block text-sm font-normal text-muted-foreground">
          / {format(target)}
        </span>
      </p>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full', reached ? 'bg-success' : 'bg-primary')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground tabular-nums">
        {reached ? reachedLabel : `${format(target - value)} ${remainingLabel}`} · {Math.round(pct)}
        %
      </p>
    </div>
  );
}

/** Ring + goal name + "x of y" (savings goals, quotas, course completion). */
export function GoalProgress({
  goals,
}: {
  goals: Array<{ id: string; label: ReactNode; value: number; target: number; hint?: ReactNode }>;
}) {
  return (
    <ul className="space-y-4">
      {goals.map((g, i) => {
        const pct = Math.round(Math.min(100, (g.value / g.target) * 100));
        return (
          <li key={g.id} className="flex items-center gap-4">
            <ProgressRing value={pct} size={48} strokeWidth={5} color={seriesColor(i)} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{g.label}</p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {fmt(g.value)} of {fmt(g.target)}
                {g.hint && <> · {g.hint}</>}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** This period vs. last period per category, as paired horizontal bars. */
export function ComparisonBars({
  rows,
  currentLabel = 'This period',
  previousLabel = 'Last period',
  format = fmt,
}: {
  rows: Array<{ id: string; label: ReactNode; current: number; previous: number }>;
  currentLabel?: string;
  previousLabel?: string;
  format?: (n: number) => string;
}) {
  const max = Math.max(...rows.flatMap((r) => [r.current, r.previous]), 1);
  return (
    <div className="space-y-4">
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-primary" /> {currentLabel}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-primary/30" /> {previousLabel}
        </span>
      </div>
      <ul className="space-y-3.5">
        {rows.map((r) => (
          <li key={r.id} className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span>{r.label}</span>
              <span className="font-medium tabular-nums">{format(r.current)}</span>
            </div>
            <div className="space-y-1">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${(r.current / max) * 100}%` }}
              />
              <div
                className="h-2 rounded-full bg-primary/30"
                style={{ width: `${(r.previous / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Compact funnel: each stage's bar width is its share of the first stage. */
export function FunnelMini({
  stages,
  format = fmt,
}: {
  stages: Array<{ id: string; label: ReactNode; value: number }>;
  format?: (n: number) => string;
}) {
  const top = stages[0]?.value || 1;
  return (
    <ol className="space-y-3.5">
      {stages.map((s, i) => {
        const share = (s.value / top) * 100;
        const step = i > 0 ? (s.value / stages[i - 1]!.value) * 100 : null;
        return (
          <li key={s.id} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="truncate text-muted-foreground">{s.label}</span>
              <span className="shrink-0 tabular-nums">
                <span className="font-medium">{format(s.value)}</span>
                {step !== null && (
                  <span className="ml-1.5 text-xs text-muted-foreground">{step.toFixed(0)}%</span>
                )}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(share, 2)}%`,
                  background: `color-mix(in srgb, var(--primary) ${100 - i * 15}%, var(--chart-4))`,
                }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Net Promoter Score: gauge on a −100…100 scale plus the three groups. */
export function NpsGauge({
  promoters,
  passives,
  detractors,
  labels = { promoters: 'Promoters', passives: 'Passives', detractors: 'Detractors', score: 'NPS' },
}: {
  promoters: number;
  passives: number;
  detractors: number;
  labels?: { promoters: string; passives: string; detractors: string; score: string };
}) {
  const total = promoters + passives + detractors || 1;
  const score = Math.round(((promoters - detractors) / total) * 100);
  const groups = [
    { key: 'p', label: labels.promoters, value: promoters, color: 'var(--success)' },
    { key: 'n', label: labels.passives, value: passives, color: 'var(--warning)' },
    { key: 'd', label: labels.detractors, value: detractors, color: 'var(--destructive)' },
  ];
  return (
    <div className="space-y-4">
      <Gauge
        value={(score + 100) / 2}
        display={score > 0 ? `+${score}` : score}
        label={labels.score}
      />
      <div className="flex h-2 overflow-hidden rounded-full">
        {groups.map((g) => (
          <span key={g.key} style={{ width: `${(g.value / total) * 100}%`, background: g.color }} />
        ))}
      </div>
      <ul className="grid grid-cols-3 gap-2 text-center">
        {groups.map((g) => (
          <li key={g.key}>
            <p className="text-sm font-semibold tabular-nums">
              {Math.round((g.value / total) * 100)}%
            </p>
            <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full" style={{ background: g.color }} />
              {g.label}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
