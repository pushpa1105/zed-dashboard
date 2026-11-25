import { ChevronLeft, ChevronRight, Flag } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

const DAY_MS = 86_400_000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const sameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();

/**
 * Contribution-style heat calendar: one square per day for the last N weeks,
 * darker = more activity (one hue, never a rainbow).
 */
export function ActivityCalendar({
  values,
  weeks = 26,
  end = new Date(),
  unit = 'events',
  lessLabel = 'Less',
  moreLabel = 'More',
}: {
  /** Activity per day, oldest first; length = weeks × 7 (padded if shorter). */
  values: number[];
  weeks?: number;
  end?: Date;
  unit?: string;
  lessLabel?: string;
  moreLabel?: string;
}) {
  const days = weeks * 7;
  const max = Math.max(...values, 1);
  const first = startOfDay(new Date(end.getTime() - (days - 1) * DAY_MS));
  const level = (v: number) => (v === 0 ? 0 : Math.ceil((v / max) * 4));
  const mix = [6, 28, 50, 75, 100];

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <div
          className="grid w-max grid-flow-col gap-[3px]"
          style={{ gridTemplateRows: 'repeat(7, 0.75rem)' }}
        >
          {Array.from({ length: days }, (_, i) => {
            const value = values[i] ?? 0;
            const date = new Date(first.getTime() + i * DAY_MS);
            return (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <span
                    className="size-3 rounded-[3px]"
                    style={{
                      background: `color-mix(in srgb, var(--primary) ${mix[level(value)]}%, var(--muted))`,
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  {value} {unit} ·{' '}
                  {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
      <div className="flex items-center justify-end gap-1 text-[0.6875rem] text-muted-foreground">
        {lessLabel}
        {mix.map((m) => (
          <span
            key={m}
            className="size-2.5 rounded-[2px]"
            style={{ background: `color-mix(in srgb, var(--primary) ${m}%, var(--muted))` }}
          />
        ))}
        {moreLabel}
      </div>
    </div>
  );
}

export type CalendarEvent = {
  id: string;
  date: Date;
  title: ReactNode;
  time?: ReactNode;
  color?: string;
};

/** Month grid with event dots, plus the selected day's agenda below. */
export function MiniCalendar({
  events,
  initialDate = new Date(),
  emptyLabel = 'Nothing scheduled',
}: {
  events: CalendarEvent[];
  initialDate?: Date;
  emptyLabel?: string;
}) {
  const [month, setMonth] = useState(
    () => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
  );
  const [selected, setSelected] = useState(() => startOfDay(initialDate));
  const today = startOfDay(new Date());

  const cells = useMemo(() => {
    const offset = (month.getDay() + 6) % 7; // Monday first
    const start = new Date(month.getFullYear(), month.getMonth(), 1 - offset);
    return Array.from(
      { length: 42 },
      (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i),
    );
  }, [month]);
  const dayEvents = events.filter((e) => sameDay(e.date, selected));
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 0, 1 + i).toLocaleDateString(undefined, { weekday: 'narrow' }),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">
          {month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </p>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Previous month"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Next month"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {weekdays.map((d, i) => (
          <span key={i} className="pb-1 text-[0.6875rem] font-medium text-muted-foreground">
            {d}
          </span>
        ))}
        {cells.map((date) => {
          const inMonth = date.getMonth() === month.getMonth();
          const has = events.filter((e) => sameDay(e.date, date));
          const isSelected = sameDay(date, selected);
          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => setSelected(date)}
              className={cn(
                'relative mx-auto flex size-8 flex-col items-center justify-center rounded-lg text-xs tabular-nums hover:bg-accent',
                !inMonth && 'text-muted-foreground/50',
                sameDay(date, today) && 'font-semibold text-primary',
                isSelected && 'bg-primary text-primary-foreground hover:bg-primary',
              )}
            >
              {date.getDate()}
              {has.length > 0 && (
                <span className="absolute bottom-1 flex gap-0.5">
                  {has.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      className="size-1 rounded-full"
                      style={{
                        background: isSelected ? 'currentColor' : (e.color ?? 'var(--primary)'),
                      }}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <ul className="space-y-2 border-t pt-3">
        {dayEvents.length === 0 && <li className="text-xs text-muted-foreground">{emptyLabel}</li>}
        {dayEvents.map((e) => (
          <li
            key={e.id}
            className="flex items-center gap-3 rounded-lg border-l-2 bg-muted/40 py-1.5 pr-2 pl-3 text-sm"
            style={{ borderColor: e.color ?? 'var(--primary)' }}
          >
            <span className="min-w-0 flex-1 truncate">{e.title}</span>
            {e.time && <span className="text-xs text-muted-foreground tabular-nums">{e.time}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Big countdown to a milestone with a progress bar from `start` to `target`. */
export function MilestoneCountdown({
  title,
  start,
  target,
  labels = { days: 'days', hours: 'hrs', minutes: 'min', elapsed: 'elapsed' },
}: {
  title: ReactNode;
  start: Date;
  target: Date;
  labels?: { days: string; hours: string; minutes: string; elapsed: string };
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  const left = Math.max(0, target.getTime() - now);
  const parts = [
    { v: Math.floor(left / DAY_MS), l: labels.days },
    { v: Math.floor((left % DAY_MS) / 3_600_000), l: labels.hours },
    { v: Math.floor((left % 3_600_000) / 60_000), l: labels.minutes },
  ];
  const total = target.getTime() - start.getTime();
  const pct = total > 0 ? Math.min(100, ((now - start.getTime()) / total) * 100) : 100;

  return (
    <div className="space-y-4">
      <p className="flex items-center gap-2 text-sm font-medium">
        <Flag className="size-4 text-primary" /> {title}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {parts.map((p) => (
          <div key={p.l} className="rounded-lg bg-muted/60 py-3 text-center">
            <p className="text-2xl font-semibold tabular-nums">{String(p.v).padStart(2, '0')}</p>
            <p className="text-[0.6875rem] text-muted-foreground uppercase">{p.l}</p>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-muted-foreground tabular-nums">
          {Math.round(pct)}% {labels.elapsed} ·{' '}
          {target.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </div>
    </div>
  );
}
