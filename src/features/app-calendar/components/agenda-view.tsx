import { isToday, isTomorrow } from 'date-fns';
import { CalendarX2, MapPin, Users } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { EmptyState } from '@/shared/components/display/empty-state';

import { daysBetween, onDay, viewRange } from '../lib/dates';
import { fmtDay, fmtOccurrenceTime } from '../lib/format';
import { CALENDAR_COLORS, type Occurrence } from '../model/calendar';

import { EventPopover } from './event-popover';

/** The next 30 days as a list, grouped by day; empty days are skipped. */
export function AgendaView({
  date,
  occurrences,
  onEdit,
}: {
  date: Date;
  occurrences: Occurrence[];
  onEdit: (o: Occurrence) => void;
}) {
  const { t, i18n } = useTranslation('app-calendar');
  const lang = i18n.language;
  const { start } = viewRange('agenda', date);
  const groups = daysBetween(start, 30)
    .map((day) => ({ day, items: onDay(occurrences, day) }))
    .filter((g) => g.items.length);

  if (!groups.length) {
    return (
      <EmptyState
        variant="plain"
        icon={CalendarX2}
        title={t('agenda.emptyTitle')}
        description={t('agenda.emptyDescription')}
        className="py-24"
      />
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {groups.map(({ day, items }) => (
        <section key={day.toISOString()}>
          <h3 className="sticky top-0 z-10 flex items-baseline gap-3 border-b bg-card/95 px-6 py-2.5 backdrop-blur">
            <span className="text-2xl font-semibold tabular-nums">{day.getDate()}</span>
            <span className="text-sm font-medium">
              {isToday(day)
                ? t('agenda.today')
                : isTomorrow(day)
                  ? t('agenda.tomorrow')
                  : fmtDay(day, lang, { weekday: 'long' })}
            </span>
            <span className="text-xs text-muted-foreground">
              {fmtDay(day, lang, { month: 'long', year: 'numeric' })}
            </span>
          </h3>
          <ul className="divide-y">
            {items.map((o) => (
              <li key={o.key}>
                <EventPopover occurrence={o} onEdit={onEdit}>
                  <button
                    type="button"
                    className="grid w-full grid-cols-[9rem_auto_1fr] items-start gap-4 px-6 py-3 text-left transition-colors hover:bg-muted/40"
                  >
                    <span className="pt-0.5 text-sm text-muted-foreground tabular-nums">
                      {fmtOccurrenceTime(o, lang, t('allDay'))}
                    </span>
                    <span
                      className="mt-1 h-4 w-1 rounded-full"
                      style={{ background: CALENDAR_COLORS[o.calendarId] }}
                    />
                    <span className="min-w-0 space-y-1">
                      <span className="block truncate text-sm font-medium">{o.title}</span>
                      <span className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>{t(`calendars.${o.calendarId}`)}</span>
                        {o.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3" /> {o.location}
                          </span>
                        )}
                        {o.guests.length > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Users className="size-3" /> {t('guests', { count: o.guests.length })}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                </EventPopover>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
