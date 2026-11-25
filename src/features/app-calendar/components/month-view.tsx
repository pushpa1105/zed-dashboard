import { isSameDay, isSameMonth, isToday } from 'date-fns';

import { useTranslation } from '@/core/i18n/use-translation';
import { cn } from '@/shared/lib/cn';

import { daysBetween, isAllDayLike, onDay, viewRange } from '../lib/dates';
import { fmtClock, fmtDay } from '../lib/format';
import { CALENDAR_COLORS, type Occurrence } from '../model/calendar';

import { EventPopover } from './event-popover';

const MAX_VISIBLE = 3;

export function MonthView({
  date,
  occurrences,
  onCreate,
  onEdit,
  onShowDay,
}: {
  date: Date;
  occurrences: Occurrence[];
  onCreate: (day: Date) => void;
  onEdit: (o: Occurrence) => void;
  onShowDay: (day: Date) => void;
}) {
  const { t, i18n } = useTranslation('app-calendar');
  const lang = i18n.language;
  const { start } = viewRange('month', date);
  const days = daysBetween(start, 42);

  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-7 border-b">
        {days.slice(0, 7).map((d) => (
          <div
            key={d.toISOString()}
            className="px-3 py-2.5 text-xs font-medium text-muted-foreground uppercase"
          >
            {fmtDay(d, lang, { weekday: 'short' })}
          </div>
        ))}
      </div>
      <div className="grid flex-1 auto-rows-fr grid-cols-7">
        {days.map((day, i) => {
          const items = onDay(occurrences, day).sort(
            (a, b) => Number(isAllDayLike(b)) - Number(isAllDayLike(a)),
          );
          const hidden = items.length - MAX_VISIBLE;
          const outside = !isSameMonth(day, date);
          return (
            <div
              key={day.toISOString()}
              role="button"
              tabIndex={-1}
              onClick={() => onCreate(day)}
              onKeyDown={(e) => e.key === 'Enter' && onCreate(day)}
              className={cn(
                'group min-h-[6rem] cursor-pointer space-y-1 border-b p-1.5 transition-colors hover:bg-muted/40',
                i % 7 !== 6 && 'border-r',
                i >= 35 && 'border-b-0',
                outside && 'bg-muted/25',
              )}
            >
              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowDay(day);
                  }}
                  className={cn(
                    'flex size-7 items-center justify-center rounded-full text-sm tabular-nums hover:bg-accent',
                    outside && 'text-muted-foreground/60',
                    isToday(day) &&
                      'bg-primary font-semibold text-primary-foreground hover:bg-primary',
                  )}
                  aria-label={fmtDay(day, lang, { dateStyle: 'full' })}
                >
                  {day.getDate()}
                </button>
              </div>
              {items.slice(0, MAX_VISIBLE).map((o) => {
                const color = CALENDAR_COLORS[o.calendarId];
                const allDay = isAllDayLike(o);
                const continues = allDay && !isSameDay(o.startDate, day);
                return (
                  <EventPopover key={o.key} occurrence={o} onEdit={onEdit}>
                    <button
                      type="button"
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        'flex w-full items-center gap-1.5 truncate rounded-md px-1.5 py-0.5 text-left text-xs transition-opacity hover:opacity-80',
                        allDay && 'font-medium',
                      )}
                      style={
                        allDay
                          ? { background: `color-mix(in srgb, ${color} 18%, var(--card))` }
                          : undefined
                      }
                    >
                      {!allDay && (
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ background: color }}
                        />
                      )}
                      {!allDay && (
                        <span className="shrink-0 text-muted-foreground tabular-nums">
                          {fmtClock(o.startDate, lang)}
                        </span>
                      )}
                      <span className="truncate">
                        {continues && '↳ '}
                        {o.title}
                      </span>
                    </button>
                  </EventPopover>
                );
              })}
              {hidden > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowDay(day);
                  }}
                  className="px-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  {t('more', { count: hidden })}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
