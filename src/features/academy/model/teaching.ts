import { z } from 'zod';

import { rate } from '../lib/format';

import { CATEGORIES, LESSON_TYPES } from './academy';

/* ---- Course builder --------------------------------------------------------- */

export const builderLessonSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(LESSON_TYPES),
  durationMin: z.number(),
  preview: z.boolean(),
  summary: z.string(),
});
export type BuilderLesson = z.infer<typeof builderLessonSchema>;

export const builderSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  lessons: z.array(builderLessonSchema),
});
export type BuilderSection = z.infer<typeof builderSectionSchema>;

export const builderSchema = z.object({
  courseId: z.string(),
  title: z.string(),
  color: z.string(),
  category: z.enum(CATEGORIES),
  published: z.boolean(),
  updatedAt: z.string(),
  sections: z.array(builderSectionSchema),
});
export type CourseBuilder = z.infer<typeof builderSchema>;

export const lessonInputSchema = builderLessonSchema.omit({ id: true }).extend({
  sectionId: z.string().min(1, 'validation.required'),
  title: z
    .string()
    .trim()
    .min(3, 'academy:builder.form.errors.title')
    .max(80, 'validation.tooLong'),
  durationMin: z
    .number('validation.required')
    .int()
    .min(1, 'academy:builder.form.errors.duration')
    .max(180, 'academy:builder.form.errors.duration'),
  summary: z.string().max(280, 'validation.tooLong'),
});
export type LessonInput = z.infer<typeof lessonInputSchema>;

/* ---- Live sessions ---------------------------------------------------------- */

export const LIVE_FILTERS = ['upcoming', 'past', 'going'] as const;
export type LiveFilter = (typeof LIVE_FILTERS)[number];
export const LIVE_DURATIONS = [30, 45, 60, 90, 120] as const;

export const liveSessionSchema = z.object({
  id: z.string(),
  title: z.string(),
  courseId: z.string(),
  courseTitle: z.string(),
  color: z.string(),
  host: z.object({ name: z.string(), title: z.string() }),
  startsAt: z.string(),
  durationMin: z.number(),
  capacity: z.number(),
  registered: z.number(),
  /** Null until the session has happened. */
  attended: z.number().nullable(),
  going: z.boolean(),
  joinUrl: z.string(),
  agenda: z.array(z.string()),
  attendees: z.array(z.string()),
  recording: z.object({ durationMin: z.number(), views: z.number() }).nullable(),
});
export type LiveSession = z.infer<typeof liveSessionSchema>;

export const liveInputSchema = z.object({
  title: z.string().trim().min(3, 'academy:live.form.errors.title').max(80, 'validation.tooLong'),
  courseId: z.string().min(1, 'validation.required'),
  startsAt: z
    .date('validation.required')
    .refine((d) => d.getTime() > Date.now(), 'academy:live.form.errors.past'),
  durationMin: z.number(),
  capacity: z
    .number('validation.required')
    .int()
    .min(5, 'academy:live.form.errors.capacity')
    .max(500, 'academy:live.form.errors.capacity'),
});
export type LiveInput = z.infer<typeof liveInputSchema>;

const endsAt = (s: LiveSession) => new Date(s.startsAt).getTime() + s.durationMin * 60_000;
export const isPast = (s: LiveSession) => endsAt(s) < Date.now();
/** Joinable from 15 minutes before the start until the end. */
export const isJoinable = (s: LiveSession) =>
  !isPast(s) && new Date(s.startsAt).getTime() - 15 * 60_000 <= Date.now();

/** Share of registered learners who showed up; null before the session. */
export const attendanceRate = (s: LiveSession) =>
  s.attended === null ? null : rate(s.attended, s.registered);

/* ---- Reports ---------------------------------------------------------------- */

export const REPORT_RANGES = ['30d', '90d', '12m'] as const;
export type ReportRange = (typeof REPORT_RANGES)[number];

const totalsSchema = z.object({
  enrolments: z.number(),
  completions: z.number(),
  revenue: z.number(),
});
export type ReportTotals = z.infer<typeof totalsSchema>;

export const reportsSchema = z.object({
  /** The range this data covers, so labels never mix with a range still loading. */
  range: z.enum(REPORT_RANGES),
  series: z.array(totalsSchema.extend({ period: z.string() })),
  previous: totalsSchema,
  courses: z.array(
    totalsSchema.extend({
      id: z.string(),
      title: z.string(),
      color: z.string(),
      rating: z.number(),
    }),
  ),
  /** Share of enrolled learners (%) who reached each lesson, per course. */
  dropoff: z.record(z.string(), z.array(z.object({ title: z.string(), learners: z.number() }))),
});
export type Reports = z.infer<typeof reportsSchema>;
export type CourseReport = Reports['courses'][number];
