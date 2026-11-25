import { z } from 'zod';

export const REPEATS = ['none', 'daily', 'weekdays', 'weekly', 'monthly'] as const;
export type Repeat = (typeof REPEATS)[number];

export const CALENDAR_IDS = ['work', 'team', 'personal', 'travel', 'holidays'] as const;
export type CalendarId = (typeof CALENDAR_IDS)[number];

/** Colour per calendar: categorical chart slots, fixed order. */
export const CALENDAR_COLORS: Record<CalendarId, string> = {
  work: 'var(--chart-1)',
  team: 'var(--chart-4)',
  personal: 'var(--chart-2)',
  travel: 'var(--chart-3)',
  holidays: 'var(--chart-5)',
};

export const eventSchema = z.object({
  id: z.string(),
  title: z.string(),
  /** ISO date-time (or start of day for all-day events). */
  start: z.string(),
  end: z.string(),
  allDay: z.boolean(),
  calendarId: z.enum(CALENDAR_IDS),
  location: z.string(),
  guests: z.array(z.string()),
  repeat: z.enum(REPEATS),
  description: z.string(),
});
export type CalendarEvent = z.infer<typeof eventSchema>;

export type EventInput = Omit<CalendarEvent, 'id'>;

/** One drawn instance of an event (recurring events produce several). */
export type Occurrence = CalendarEvent & {
  /** Unique per instance: `${id}@${start}`. */
  key: string;
  startDate: Date;
  endDate: Date;
};

export const VIEWS = ['month', 'week', 'day', 'agenda'] as const;
export type CalendarView = (typeof VIEWS)[number];
