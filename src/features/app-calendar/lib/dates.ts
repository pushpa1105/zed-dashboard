import {
  addDays,
  addMonths,
  addWeeks,
  areIntervalsOverlapping,
  differenceInCalendarDays,
  endOfDay,
  endOfWeek,
  isSameDay,
  isWeekend,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

import type { CalendarEvent, CalendarView, Occurrence } from '../model/calendar';

export const WEEK_STARTS_ON = 1 as const; // Monday

/** The date range a view displays. */
export function viewRange(view: CalendarView, date: Date): { start: Date; end: Date } {
  switch (view) {
    case 'month': {
      const start = startOfWeek(startOfMonth(date), { weekStartsOn: WEEK_STARTS_ON });
      return { start, end: endOfDay(addDays(start, 41)) };
    }
    case 'week':
      return {
        start: startOfWeek(date, { weekStartsOn: WEEK_STARTS_ON }),
        end: endOfWeek(date, { weekStartsOn: WEEK_STARTS_ON }),
      };
    case 'day':
      return { start: startOfDay(date), end: endOfDay(date) };
    case 'agenda':
      return { start: startOfDay(date), end: endOfDay(addDays(date, 29)) };
  }
}

export function shiftDate(view: CalendarView, date: Date, direction: 1 | -1) {
  switch (view) {
    case 'month':
      return addMonths(date, direction);
    case 'week':
      return addWeeks(date, direction);
    case 'day':
      return addDays(date, direction);
    case 'agenda':
      return addDays(date, direction * 30);
  }
}

export const daysBetween = (start: Date, count: number) =>
  Array.from({ length: count }, (_, i) => addDays(start, i));

/**
 * Expands recurring events into the occurrences that fall in [from, to].
 * Durations are preserved; "weekdays" skips Saturday and Sunday.
 */
export function expandEvents(events: CalendarEvent[], from: Date, to: Date): Occurrence[] {
  const out: Occurrence[] = [];
  for (const event of events) {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const duration = end.getTime() - start.getTime();
    const push = (s: Date) => {
      const e = new Date(s.getTime() + duration);
      if (
        areIntervalsOverlapping({ start: s, end: e }, { start: from, end: to }, { inclusive: true })
      ) {
        out.push({ ...event, key: `${event.id}@${s.toISOString()}`, startDate: s, endDate: e });
      }
    };

    if (event.repeat === 'none') {
      push(start);
      continue;
    }
    // Walk forward from the series start; cap iterations defensively.
    let cursor = start;
    for (let i = 0; i < 800 && cursor <= to; i++) {
      if (event.repeat !== 'weekdays' || !isWeekend(cursor)) push(cursor);
      cursor =
        event.repeat === 'monthly'
          ? addMonths(start, i + 1)
          : event.repeat === 'weekly'
            ? addWeeks(start, i + 1)
            : addDays(start, i + 1);
    }
  }
  return out.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}

/** True when the occurrence should sit in the all-day lane. */
export const isAllDayLike = (o: Occurrence) =>
  o.allDay || differenceInCalendarDays(o.endDate, o.startDate) >= 1;

/** Occurrences touching a given day. */
export const onDay = (items: Occurrence[], day: Date) =>
  items.filter(
    (o) =>
      isSameDay(o.startDate, day) || (o.startDate < startOfDay(day) && o.endDate > startOfDay(day)),
  );

export type PositionedEvent = { occurrence: Occurrence; column: number; columns: number };

/**
 * Side-by-side layout for overlapping timed events in one day column:
 * events are grouped into clusters of transitive overlaps, and each cluster
 * is split into the minimum number of columns.
 */
export function layoutDay(items: Occurrence[]): PositionedEvent[] {
  const sorted = [...items].sort(
    (a, b) =>
      a.startDate.getTime() - b.startDate.getTime() || b.endDate.getTime() - a.endDate.getTime(),
  );
  const result: PositionedEvent[] = [];
  let cluster: Array<{ occurrence: Occurrence; column: number }> = [];
  let columnEnds: number[] = [];
  let clusterEnd = 0;

  const flush = () => {
    const columns = columnEnds.length;
    for (const item of cluster) result.push({ ...item, columns });
    cluster = [];
    columnEnds = [];
  };

  for (const occurrence of sorted) {
    const start = occurrence.startDate.getTime();
    const end = Math.max(occurrence.endDate.getTime(), start + 15 * 60_000);
    if (cluster.length && start >= clusterEnd) flush();
    let column = columnEnds.findIndex((columnEnd) => columnEnd <= start);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(end);
    } else {
      columnEnds[column] = end;
    }
    cluster.push({ occurrence, column });
    clusterEnd = Math.max(clusterEnd, end);
  }
  if (cluster.length) flush();
  return result;
}

/** Minutes since midnight. */
export const minutesOf = (d: Date) => d.getHours() * 60 + d.getMinutes();

/** "2026-11-25" in local time. */
export const toDateInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** "09:30" in local time. */
export const toTimeInput = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** Combines local date + time inputs into a Date. */
export function fromInputs(date: string, time: string) {
  const [y = 1970, m = 1, d = 1] = date.split('-').map(Number);
  const [h = 0, min = 0] = time.split(':').map(Number);
  return new Date(y, m - 1, d, h, min);
}
