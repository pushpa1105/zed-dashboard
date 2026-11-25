import { isSameDay } from 'date-fns';

import type { CalendarView, Occurrence } from '../model/calendar';

import { viewRange } from './dates';

export const fmtTime = (d: Date, locale: string) =>
  new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(d);

/** Compact 24-hour clock ("09:30") for dense cells. */
export const fmtClock = (d: Date, locale: string) =>
  new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(
    d,
  );

export const fmtDay = (d: Date, locale: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(locale, opts).format(d);

/** "9:30 – 10:00", or "All day" / a date span for all-day items. */
export function fmtOccurrenceTime(o: Occurrence, locale: string, allDayLabel: string) {
  if (o.allDay) {
    const last = new Date(o.endDate.getTime() - 1);
    return isSameDay(o.startDate, last)
      ? allDayLabel
      : `${fmtDay(o.startDate, locale, { day: 'numeric', month: 'short' })} – ${fmtDay(last, locale, { day: 'numeric', month: 'short' })}`;
  }
  return `${fmtTime(o.startDate, locale)} – ${fmtTime(o.endDate, locale)}`;
}

/** Toolbar title for the current view. */
export function viewTitle(view: CalendarView, date: Date, locale: string) {
  const { start, end } = viewRange(view, date);
  switch (view) {
    case 'month':
      return fmtDay(date, locale, { month: 'long', year: 'numeric' });
    case 'day':
      return fmtDay(date, locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    default: {
      const sameMonth = start.getMonth() === end.getMonth();
      const from = fmtDay(
        start,
        locale,
        sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'short' },
      );
      const to = fmtDay(end, locale, { day: 'numeric', month: 'short', year: 'numeric' });
      return `${from} – ${to}`;
    }
  }
}
