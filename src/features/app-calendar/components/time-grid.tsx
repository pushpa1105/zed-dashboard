import { addMinutes, isToday, startOfDay } from 'date-fns';
import { useEffect, useRef, useState, type MouseEvent } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { cn } from '@/shared/lib/cn';

import { isAllDayLike, layoutDay, minutesOf, onDay } from '../lib/dates';
import { fmtDay, fmtTime } from '../lib/format';
import { CALENDAR_COLORS, type Occurrence } from '../model/calendar';

import { EventPopover } from './event-popover';

/** Pixels per minute: 56px per hour keeps 30-minute meetings legible. */
const PX = 56 / 60;
const HOURS = Array.from({ length: 24 }, (_, h) => h);

function useNowMinutes() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

/**
 * Week / day time grid: a sticky header with dates, an all-day lane, then a
 * scrolling 24-hour body. Overlapping events sit side by side; clicking an
 * empty slot creates an event at that half hour.
 */
export function TimeGrid({
  days,
  occurrences,
  onCreate,
  onEdit,
  onShowDay,
}: {
  days: Date[];
  occurrences: Occurrence[];
  onCreate: (start: Date, end: Date, allDay?: boolean) => void;
  onEdit: (o: Occurrence) => void;
  onShowDay?: (day: Date) => void;
}) {
  const { t, i18n } = useTranslation('app-calendar');
  const lang = i18n.language;
  const scrollRef = useRef<HTMLDivElement>(null);
  const now = useNowMinutes();
  const cols = `4rem repeat(${days.length}, minmax(0, 1fr))`;

  // Open at 7:00 so the working day is in view.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 7 * 60 * PX - 16;
  }, []);

  const timed = occurrences.filter((o) => !isAllDayLike(o));
  const allDay = occurrences.filter(isAllDayLike);

  const createAt = (day: Date) => (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const minutes = Math.floor((e.clientY - rect.top) / PX / 30) * 30;
    const start = addMinutes(startOfDay(day), minutes);
    onCreate(start, addMinutes(start, 60));
  };

  return (
    <div className="flex h-full flex-col">
      <div className="grid border-b" style={{ gridTemplateColumns: cols }}>
        <div />
        {days.map((day) => (
          <button
            key={day.toISOString()}
            type="button"
            onClick={() => onShowDay?.(day)}
            className="flex items-center justify-center gap-2 border-l py-2.5 text-sm hover:bg-muted/40"
          >
            <span className="text-xs font-medium text-muted-foreground uppercase">
              {fmtDay(day, lang, { weekday: 'short' })}
            </span>
            <span
              className={cn(
                'flex size-7 items-center justify-center rounded-full font-semibold tabular-nums',
                isToday(day) && 'bg-primary text-primary-foreground',
              )}
            >
              {day.getDate()}
            </span>
          </button>
        ))}
      </div>

      {/* All-day lane */}
      <div className="grid border-b bg-muted/20" style={{ gridTemplateColumns: cols }}>
        <div className="flex items-center justify-end pr-2 text-[0.6875rem] text-muted-foreground">
          {t('allDay')}
        </div>
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className="min-h-9 space-y-1 border-l p-1"
            onClick={() => onCreate(startOfDay(day), addMinutes(startOfDay(day), 1440), true)}
          >
            {onDay(allDay, day).map((o) => {
              const color = CALENDAR_COLORS[o.calendarId];
              return (
                <EventPopover key={o.key} occurrence={o} onEdit={onEdit}>
                  <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    className="block w-full truncate rounded-md px-2 py-0.5 text-left text-xs font-medium"
                    style={{ background: `color-mix(in srgb, ${color} 20%, var(--card))` }}
                  >
                    {o.title}
                  </button>
                </EventPopover>
              );
            })}
          </div>
        ))}
      </div>

      <div ref={scrollRef} className="relative flex-1 overflow-y-auto">
        <div className="grid" style={{ gridTemplateColumns: cols, height: 24 * 60 * PX }}>
          <div className="relative">
            {HOURS.slice(1).map((h) => (
              <span
                key={h}
                className="absolute right-2 -translate-y-1/2 text-[0.6875rem] text-muted-foreground tabular-nums"
                style={{ top: h * 60 * PX }}
              >
                {fmtTime(new Date(2000, 0, 1, h), lang)}
              </span>
            ))}
          </div>
          {days.map((day) => {
            const positioned = layoutDay(onDay(timed, day));
            const today = isToday(day);
            return (
              <div
                key={day.toISOString()}
                className={cn('relative cursor-pointer border-l', today && 'bg-primary/[0.025]')}
                onClick={createAt(day)}
              >
                {HOURS.slice(1).map((h) => (
                  <span
                    key={h}
                    className="pointer-events-none absolute inset-x-0 border-t border-border/70"
                    style={{ top: h * 60 * PX }}
                  />
                ))}
                {positioned.map(({ occurrence: o, column, columns }) => {
                  const color = CALENDAR_COLORS[o.calendarId];
                  const top = minutesOf(o.startDate) * PX;
                  const height = Math.max(
                    22,
                    ((o.endDate.getTime() - o.startDate.getTime()) / 60_000) * PX - 2,
                  );
                  const short = height < 44;
                  const indent = columns > 1 ? (column / columns) * 70 : 0;
                  return (
                    <EventPopover key={o.key} occurrence={o} onEdit={onEdit}>
                      <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                          'absolute overflow-hidden rounded-md border-l-[3px] px-2 py-1 text-left text-xs shadow-xs transition-shadow hover:z-30 hover:shadow-md',
                          column > 0 && 'ring-2 ring-card',
                          short ? 'flex items-center' : 'flex flex-col justify-start',
                        )}
                        style={{
                          top: top + 1,
                          height,
                          // Cascade: later overlapping events start further right and sit on top,
                          // so every title keeps most of the column width.
                          left: `calc(${indent}% + 2px)`,
                          width: `calc(${100 - indent}% - 4px)`,
                          zIndex: column + 1,
                          borderLeftColor: color,
                          background: `color-mix(in srgb, ${color} 16%, var(--card))`,
                        }}
                      >
                        <span className={cn('block truncate font-medium', short && 'inline')}>
                          {o.title}
                        </span>
                        <span
                          className={cn(
                            'truncate text-muted-foreground tabular-nums',
                            short ? 'ml-1 inline' : 'block',
                          )}
                        >
                          {fmtTime(o.startDate, lang)}
                          {!short && ` – ${fmtTime(o.endDate, lang)}`}
                        </span>
                        {!short && o.location && height > 64 && (
                          <span className="block truncate text-muted-foreground">{o.location}</span>
                        )}
                      </button>
                    </EventPopover>
                  );
                })}
                {today && (
                  <span
                    className="pointer-events-none absolute inset-x-0 z-20 h-0.5 bg-destructive"
                    style={{ top: minutesOf(now) * PX }}
                    aria-label={t('now')}
                  >
                    <span className="absolute -top-1 -left-1 size-2.5 rounded-full bg-destructive" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
