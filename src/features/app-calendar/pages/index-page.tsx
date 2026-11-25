import { addHours, isAfter, startOfHour } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { PageModule } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { ErrorState } from '@/shared/components/display/error-state';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { Button } from '@/shared/ui/button';
import { Calendar } from '@/shared/ui/calendar';
import { Checkbox } from '@/shared/ui/checkbox';
import { Skeleton } from '@/shared/ui/skeleton';

import { eventsQuery, useEvents } from '../api/calendar-api';
import { AgendaView } from '../components/agenda-view';
import { EventDialog, type EventDraft } from '../components/event-dialog';
import { EventPopover } from '../components/event-popover';
import { MonthView } from '../components/month-view';
import { TimeGrid } from '../components/time-grid';
import { daysBetween, expandEvents, shiftDate, viewRange } from '../lib/dates';
import { fmtDay, fmtOccurrenceTime, viewTitle } from '../lib/format';
import {
  CALENDAR_COLORS,
  CALENDAR_IDS,
  VIEWS,
  type CalendarId,
  type CalendarView,
  type Occurrence,
} from '../model/calendar';

export const loader: PageModule['loader'] =
  ({ queryClient }) =>
  async () => {
    await queryClient.prefetchQuery(eventsQuery());
    return null;
  };

export default function CalendarPage() {
  const { t, i18n } = useTranslation('app-calendar');
  const lang = i18n.language;
  const query = useEvents();
  const [view, setView] = useState<CalendarView>('week');
  const [date, setDate] = useState(() => new Date());
  const [hidden, setHidden] = useState<Set<CalendarId>>(new Set());
  const [draft, setDraft] = useState<EventDraft | null>(null);

  const range = viewRange(view, date);
  // Cheap to recompute (tens of events); the React Compiler memoizes it.
  const occurrences = expandEvents(query.data ?? [], range.start, range.end).filter(
    (o) => !hidden.has(o.calendarId),
  );

  const upNext = useMemo(() => {
    const now = new Date();
    return expandEvents(query.data ?? [], now, addHours(now, 24 * 7))
      .filter((o) => isAfter(o.endDate, now) && !o.allDay && !hidden.has(o.calendarId))
      .slice(0, 4);
  }, [query.data, hidden]);

  const createAt = (start: Date, end: Date, allDay = false) => setDraft({ start, end, allDay });
  const newEvent = () => {
    const start = addHours(startOfHour(new Date()), 1);
    createAt(start, addHours(start, 1));
  };
  const edit = (o: Occurrence) => {
    // Editing an occurrence edits its series, so start from the series' own times.
    const master = query.data?.find((e) => e.id === o.id);
    if (!master) return;
    setDraft({
      event: master,
      start: new Date(master.start),
      end: new Date(master.end),
      allDay: master.allDay,
    });
  };
  const showDay = (day: Date) => {
    setDate(day);
    setView('day');
  };

  return (
    <Page
      title={t('title')}
      description={t('description')}
      width="full"
      actions={
        <Button onClick={newEvent}>
          <Plus /> {t('newEvent')}
        </Button>
      }
    >
      <div className="grid overflow-hidden rounded-xl border bg-card shadow-xs lg:h-[calc(100svh-13rem)] lg:min-h-[44rem] lg:grid-cols-[18rem_1fr]">
        <aside className="hidden space-y-6 overflow-y-auto border-r p-4 lg:block">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && setDate(d)}
            month={date}
            onMonthChange={setDate}
            weekStartsOn={1}
            className="mx-auto p-0 [--cell-size:2.15rem]"
          />

          <div className="space-y-2">
            <p className="px-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
              {t('myCalendars')}
            </p>
            <ul className="space-y-0.5">
              {CALENDAR_IDS.map((id) => {
                const checked = !hidden.has(id);
                return (
                  <li key={id}>
                    <label className="flex h-9 cursor-pointer items-center gap-3 rounded-md px-2 text-sm hover:bg-muted/60">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() =>
                          setHidden((prev) => {
                            const next = new Set(prev);
                            if (next.has(id)) next.delete(id);
                            else next.add(id);
                            return next;
                          })
                        }
                        style={
                          checked
                            ? { background: CALENDAR_COLORS[id], borderColor: CALENDAR_COLORS[id] }
                            : { borderColor: CALENDAR_COLORS[id] }
                        }
                      />
                      {t(`calendars.${id}`)}
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="space-y-2">
            <p className="px-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
              {t('upNext')}
            </p>
            {query.isPending ? (
              <Skeleton className="h-32 w-full" />
            ) : upNext.length === 0 ? (
              <p className="px-1 text-sm text-muted-foreground">{t('nothingUpcoming')}</p>
            ) : (
              <ul className="space-y-1">
                {upNext.map((o) => (
                  <li key={o.key}>
                    <EventPopover occurrence={o} onEdit={edit}>
                      <button
                        type="button"
                        className="flex w-full gap-3 rounded-md px-2 py-2 text-left hover:bg-muted/60"
                      >
                        <span
                          className="mt-0.5 h-8 w-1 shrink-0 rounded-full"
                          style={{ background: CALENDAR_COLORS[o.calendarId] }}
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{o.title}</span>
                          <span className="block text-xs text-muted-foreground">
                            {fmtDay(o.startDate, lang, { weekday: 'short' })} ·{' '}
                            {fmtOccurrenceTime(o, lang, t('allDay'))}
                          </span>
                        </span>
                      </button>
                    </EventPopover>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-col">
          <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
            <Button variant="outline" onClick={() => setDate(new Date())}>
              {t('today')}
            </Button>
            <div className="flex">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDate((d) => shiftDate(view, d, -1))}
                aria-label={t('previous')}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDate((d) => shiftDate(view, d, 1))}
                aria-label={t('next')}
              >
                <ChevronRight />
              </Button>
            </div>
            <h2 className="text-lg font-semibold capitalize">{viewTitle(view, date, lang)}</h2>
            <SegmentedControl<CalendarView>
              className="ml-auto"
              value={view}
              onChange={setView}
              aria-label={t('viewLabel')}
              options={VIEWS.map((v) => ({ value: v, label: t(`views.${v}`) }))}
            />
          </div>

          <div className="h-[40rem] min-h-0 overflow-y-auto lg:h-auto lg:flex-1">
            {query.isError ? (
              <ErrorState
                title={t('error.title')}
                description={t('error.description')}
                retryLabel={t('error.retry')}
                onRetry={() => void query.refetch()}
                className="m-6"
              />
            ) : query.isPending ? (
              <div className="space-y-3 p-6">
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : view === 'month' ? (
              <MonthView
                date={date}
                occurrences={occurrences}
                onCreate={(day) => {
                  const start = new Date(day);
                  start.setHours(9, 0, 0, 0);
                  createAt(start, addHours(start, 1));
                }}
                onEdit={edit}
                onShowDay={showDay}
              />
            ) : view === 'agenda' ? (
              <AgendaView date={date} occurrences={occurrences} onEdit={edit} />
            ) : (
              <TimeGrid
                key={view}
                days={view === 'week' ? daysBetween(range.start, 7) : [range.start]}
                occurrences={occurrences}
                onCreate={createAt}
                onEdit={edit}
                onShowDay={showDay}
              />
            )}
          </div>
        </section>
      </div>

      <EventDialog draft={draft} onClose={() => setDraft(null)} />
    </Page>
  );
}
