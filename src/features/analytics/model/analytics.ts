import { z } from 'zod';

/** Date ranges and comparison modes shared by every analytics page (kept in the URL). */
export const RANGES = ['7d', '28d', '90d'] as const;
export type Range = (typeof RANGES)[number];
export const COMPARES = ['previous', 'year', 'none'] as const;
export type Compare = (typeof COMPARES)[number];

/* ---- Realtime -------------------------------------------------------------- */
export const EVENT_TYPES = [
  'page_view',
  'signup',
  'add_to_cart',
  'purchase',
  'trial_start',
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const realtimeSchema = z.object({
  activeUsers: z.number(),
  perMinute: z.array(z.object({ minute: z.string(), users: z.number() })),
  events: z.array(
    z.object({
      id: z.string(),
      at: z.string(),
      type: z.enum(EVENT_TYPES),
      page: z.string(),
      country: z.string(),
      device: z.enum(['desktop', 'mobile', 'tablet']),
    }),
  ),
  topPages: z.array(z.object({ path: z.string(), users: z.number() })),
  devices: z.array(z.object({ key: z.enum(['desktop', 'mobile', 'tablet']), value: z.number() })),
});
export type Realtime = z.infer<typeof realtimeSchema>;

/* ---- Audience -------------------------------------------------------------- */
export const audienceSchema = z.object({
  totals: z.object({
    users: z.number(),
    newUsers: z.number(),
    returning: z.number(),
    avgSessionSec: z.number(),
    engagementRate: z.number(),
  }),
  ages: z.array(z.object({ group: z.string(), users: z.number() })),
  devices: z.array(z.object({ key: z.string(), label: z.string(), value: z.number() })),
  countries: z.array(
    z.object({
      code: z.string(),
      country: z.string(),
      users: z.number(),
      share: z.number(),
      sessions: z.number(),
      engagementRate: z.number(),
    }),
  ),
  newVsReturning: z.array(z.object({ date: z.string(), new: z.number(), returning: z.number() })),
});
export type Audience = z.infer<typeof audienceSchema>;

/* ---- Acquisition ----------------------------------------------------------- */
export const utmLinkSchema = z.object({
  id: z.string(),
  url: z.string(),
  source: z.string(),
  medium: z.string(),
  campaign: z.string(),
  createdAt: z.string(),
  clicks: z.number(),
});
export type UtmLink = z.infer<typeof utmLinkSchema>;

export const acquisitionSchema = z.object({
  channels: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      users: z.number(),
      sessions: z.number(),
      conversionRate: z.number(),
      revenue: z.number(),
      delta: z.number(),
      trend: z.array(z.number()),
    }),
  ),
  sources: z.array(
    z.object({
      source: z.string(),
      medium: z.string(),
      sessions: z.number(),
      bounceRate: z.number(),
      conversions: z.number(),
    }),
  ),
  links: z.array(utmLinkSchema),
});
export type Acquisition = z.infer<typeof acquisitionSchema>;

export const UTM_MEDIUMS = ['email', 'cpc', 'social', 'referral', 'display', 'affiliate'] as const;

export const utmInputSchema = z.object({
  url: z.url(),
  source: z.string().trim().min(1).max(60),
  medium: z.enum(UTM_MEDIUMS),
  campaign: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9_-]+$/i),
  term: z.string().trim().max(60).optional(),
  content: z.string().trim().max(60).optional(),
});
export type UtmInput = z.infer<typeof utmInputSchema>;

/* ---- Pages ----------------------------------------------------------------- */
export const pageRowSchema = z.object({
  path: z.string(),
  title: z.string(),
  views: z.number(),
  users: z.number(),
  avgTimeSec: z.number(),
  bounceRate: z.number(),
  entrances: z.number(),
  exits: z.number(),
  scrollDepth: z.number(),
});
export type PageRow = z.infer<typeof pageRowSchema>;

/* ---- Funnels --------------------------------------------------------------- */
export const funnelSchema = z.object({
  events: z.array(z.object({ key: z.string(), label: z.string() })),
  steps: z.array(
    z.object({ key: z.string(), label: z.string(), users: z.number(), medianTimeMin: z.number() }),
  ),
});
export type Funnel = z.infer<typeof funnelSchema>;

/* ---- Reports --------------------------------------------------------------- */
export const REPORT_TYPES = ['traffic', 'acquisition', 'revenue', 'funnel', 'custom'] as const;
export const FREQUENCIES = ['daily', 'weekly', 'monthly'] as const;
export const FORMATS = ['pdf', 'csv'] as const;

export const scheduleSchema = z.object({
  frequency: z.enum(FREQUENCIES),
  recipients: z.array(z.email()).min(1),
  format: z.enum(FORMATS),
});
export type Schedule = z.infer<typeof scheduleSchema>;

export const reportSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(REPORT_TYPES),
  owner: z.string(),
  updatedAt: z.string(),
  schedule: scheduleSchema.nullable(),
});
export type Report = z.infer<typeof reportSchema>;

/* ---- Retention ------------------------------------------------------------- */
export const RETENTION_SEGMENTS = ['all', 'organic', 'paid', 'referral'] as const;
export type RetentionSegment = (typeof RETENTION_SEGMENTS)[number];
export const COHORT_COUNTS = ['8', '12'] as const;
export type CohortCount = (typeof COHORT_COUNTS)[number];

export const retentionSchema = z.object({
  cohorts: z.array(
    z.object({
      /** Monday the cohort signed up (ISO date). */
      week: z.string(),
      size: z.number(),
      /** Users still active N weeks later; index 0 is the signup week (= size). */
      retained: z.array(z.number()),
    }),
  ),
});
export type Retention = z.infer<typeof retentionSchema>;

/* ---- Events ---------------------------------------------------------------- */
export const EVENT_CATEGORIES = ['engagement', 'conversion', 'system'] as const;

export const eventRowSchema = z.object({
  key: z.string(),
  label: z.string(),
  category: z.enum(EVENT_CATEGORIES),
  count: z.number(),
  users: z.number(),
  delta: z.number(),
  trend: z.array(z.number()),
});
export type EventRow = z.infer<typeof eventRowSchema>;

export const eventDetailSchema = eventRowSchema.extend({
  daily: z.array(z.object({ date: z.string(), count: z.number() })),
  properties: z.array(
    z.object({
      key: z.string(),
      values: z.array(z.object({ value: z.string(), count: z.number() })),
    }),
  ),
});
export type EventDetail = z.infer<typeof eventDetailSchema>;

/* ---- Goals ----------------------------------------------------------------- */
export const GOAL_EVENTS = [
  'signup',
  'trial_start',
  'demo_request',
  'add_to_cart',
  'purchase',
  'subscribe',
] as const;

export const goalInputSchema = z.object({
  name: z.string().trim().min(2, 'analytics:goals.form.errors.name').max(60, 'validation.tooLong'),
  event: z.enum(GOAL_EVENTS),
  /** Target conversion rate, in percent of visitors. */
  target: z
    .number()
    .min(0.1, 'analytics:goals.form.errors.target')
    .max(100, 'analytics:goals.form.errors.target'),
  /** Revenue attributed to each conversion, in USD. */
  value: z
    .number()
    .min(0, 'analytics:goals.form.errors.value')
    .max(100_000, 'analytics:goals.form.errors.value'),
});
export type GoalInput = z.infer<typeof goalInputSchema>;

export const goalSchema = goalInputSchema.extend({
  id: z.string(),
  conversions: z.number(),
  conversionRate: z.number(),
  trend: z.array(z.number()),
});
export type Goal = z.infer<typeof goalSchema>;

/* ---- Experiments ----------------------------------------------------------- */
export const EXPERIMENT_STATUSES = ['running', 'completed', 'paused', 'draft'] as const;
export type ExperimentStatus = (typeof EXPERIMENT_STATUSES)[number];

export const variantSchema = z.object({
  key: z.string(),
  name: z.string(),
  control: z.boolean(),
  visitors: z.number(),
  conversions: z.number(),
});
export type Variant = z.infer<typeof variantSchema>;

export const experimentSchema = z.object({
  id: z.string(),
  name: z.string(),
  hypothesis: z.string(),
  status: z.enum(EXPERIMENT_STATUSES),
  goal: z.enum(GOAL_EVENTS),
  startedAt: z.string().nullable(),
  endedAt: z.string().nullable(),
  variants: z.array(variantSchema),
});
export type Experiment = z.infer<typeof experimentSchema>;

export const experimentDetailSchema = experimentSchema.extend({
  /** Cumulative conversion rate (%) per day, keyed by variant key. */
  daily: z.array(z.record(z.string(), z.union([z.string(), z.number()]))),
});
export type ExperimentDetail = z.infer<typeof experimentDetailSchema>;
