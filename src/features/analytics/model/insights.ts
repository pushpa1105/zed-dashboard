import { z } from 'zod';

/* ---- Geography ------------------------------------------------------------- */
export const REGIONS = ['americas', 'europe', 'africa', 'asia', 'oceania'] as const;
export type Region = (typeof REGIONS)[number];

export const countryRowSchema = z.object({
  /** ISO 3166-1 alpha-2 code; the name is localized on the client. */
  code: z.string(),
  region: z.enum(REGIONS),
  sessions: z.number(),
  users: z.number(),
  engagementRate: z.number(),
  conversionRate: z.number(),
  delta: z.number(),
});
export type CountryRow = z.infer<typeof countryRowSchema>;

const CHANNELS = ['organic', 'direct', 'paid', 'referral', 'social'] as const;
const DEVICE_CATEGORIES = ['desktop', 'mobile', 'tablet'] as const;
export type DeviceCategory = (typeof DEVICE_CATEGORIES)[number];

const breakdownSchema = <T extends readonly [string, ...string[]]>(keys: T) =>
  z.array(z.object({ key: z.enum(keys), sessions: z.number() }));

export const countryDetailSchema = countryRowSchema.extend({
  daily: z.array(z.object({ date: z.string(), sessions: z.number() })),
  channels: breakdownSchema(CHANNELS),
  devices: breakdownSchema(DEVICE_CATEGORIES),
});

/* ---- Devices & technology -------------------------------------------------- */
const segmentSchema = z.object({
  name: z.string(),
  sessions: z.number(),
  conversions: z.number(),
  avgSessionSec: z.number(),
});
export type Segment = z.infer<typeof segmentSchema>;

export const TECH_DIMENSIONS = ['categories', 'os', 'browsers', 'resolutions'] as const;
export type TechDimension = (typeof TECH_DIMENSIONS)[number];

export const technologySchema = z.record(z.enum(TECH_DIMENSIONS), z.array(segmentSchema));
export type Technology = z.infer<typeof technologySchema>;

/* ---- Alerts ---------------------------------------------------------------- */
export const ALERT_METRICS = [
  'sessions',
  'conversionRate',
  'bounceRate',
  'revenue',
  'pageLoad',
  'signups',
] as const;
export type AlertMetric = (typeof ALERT_METRICS)[number];
export const SEVERITIES = ['critical', 'warning', 'info'] as const;
export type Severity = (typeof SEVERITIES)[number];
export const ALERT_STATUSES = ['open', 'acknowledged', 'muted'] as const;
export type AlertStatus = (typeof ALERT_STATUSES)[number];

export const alertSchema = z.object({
  id: z.string(),
  metric: z.enum(ALERT_METRICS),
  severity: z.enum(SEVERITIES),
  status: z.enum(ALERT_STATUSES),
  /** Observed value vs. the expected (forecast) value; `change` is the relative gap in %. */
  value: z.number(),
  expected: z.number(),
  change: z.number(),
  segment: z.string(),
  at: z.string(),
});
export type Alert = z.infer<typeof alertSchema>;

export const CONDITIONS = ['drops', 'rises', 'changes'] as const;
export const WINDOWS = ['1h', '24h', '7d'] as const;
export const NOTIFY_CHANNELS = ['email', 'slack', 'inApp'] as const;

export const alertRuleInputSchema = z.object({
  name: z.string().trim().min(3, 'analytics:alerts.form.errors.name').max(60, 'validation.tooLong'),
  metric: z.enum(ALERT_METRICS),
  condition: z.enum(CONDITIONS),
  /** Relative change vs. the forecast that fires the alert, in percent. */
  threshold: z
    .number()
    .min(1, 'analytics:alerts.form.errors.threshold')
    .max(500, 'analytics:alerts.form.errors.threshold'),
  window: z.enum(WINDOWS),
  severity: z.enum(SEVERITIES),
  notify: z.enum(NOTIFY_CHANNELS),
});
export type AlertRuleInput = z.infer<typeof alertRuleInputSchema>;

export const alertRuleSchema = alertRuleInputSchema.extend({
  id: z.string(),
  enabled: z.boolean(),
  /** Times the rule fired in the last 30 days. */
  triggered: z.number(),
});
export type AlertRule = z.infer<typeof alertRuleSchema>;
