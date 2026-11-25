import { z } from 'zod';

export const DEAL_STAGES = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const;
export type DealStage = (typeof DEAL_STAGES)[number];
/** Stages that appear as pipeline columns (closed deals are summarized separately). */
export const OPEN_STAGES = ['lead', 'qualified', 'proposal', 'negotiation'] as const;
export const PIPELINE_STAGES = [...OPEN_STAGES, 'won'] as const;

export const DEAL_SOURCES = ['Inbound', 'Outbound', 'Referral', 'Partner', 'Event'] as const;

export const dealSchema = z.object({
  id: z.string(),
  name: z.string(),
  companyId: z.string(),
  company: z.string(),
  contactId: z.string(),
  value: z.number(),
  stage: z.enum(DEAL_STAGES),
  probability: z.number(),
  owner: z.string(),
  source: z.enum(DEAL_SOURCES),
  closeDate: z.string(),
  createdAt: z.string(),
});
export type Deal = z.infer<typeof dealSchema>;

export const personSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
  companyId: z.string(),
  company: z.string(),
  email: z.string(),
  phone: z.string(),
  owner: z.string(),
  tags: z.array(z.string()),
  status: z.enum(['customer', 'prospect', 'churned']),
  lastContactedAt: z.string(),
});
export type Person = z.infer<typeof personSchema>;

export const companySchema = z.object({
  id: z.string(),
  name: z.string(),
  industry: z.string(),
  employees: z.number(),
  revenue: z.number(),
  city: z.string(),
  owner: z.string(),
  tags: z.array(z.string()),
  website: z.string(),
});
export const companyRowSchema = companySchema.extend({
  contacts: z.number(),
  openDeals: z.number(),
  pipeline: z.number(),
});
export type CompanyRow = z.infer<typeof companyRowSchema>;

export const overviewSchema = z.object({
  quota: z.number(),
  won: z.number(),
  stats: z.object({
    pipelineValue: z.number(),
    weighted: z.number(),
    openDeals: z.number(),
    winRate: z.number(),
  }),
  pipeline: z.array(z.object({ stage: z.enum(DEAL_STAGES), count: z.number(), value: z.number() })),
  forecast: z.array(
    z.object({
      week: z.string(),
      closed: z.number().nullable(),
      forecast: z.number(),
      target: z.number(),
    }),
  ),
  leaderboard: z.array(
    z.object({ owner: z.string(), won: z.number(), deals: z.number(), quota: z.number() }),
  ),
  closingSoon: z.array(dealSchema),
});
export type CrmOverview = z.infer<typeof overviewSchema>;

const activitySchema = z.object({
  id: z.string(),
  kind: z.string(),
  title: z.string(),
  at: z.string(),
  actor: z.string().optional(),
});
export type CrmActivity = z.infer<typeof activitySchema>;

export const noteSchema = z.object({
  id: z.string(),
  author: z.string(),
  body: z.string(),
  at: z.string(),
});
export type Note = z.infer<typeof noteSchema>;

export const dealDetailSchema = z.object({
  deal: dealSchema,
  contacts: z.array(personSchema),
  products: z.array(z.object({ name: z.string(), price: z.number(), quantity: z.number() })),
  activity: z.array(activitySchema),
  notes: z.array(noteSchema),
});
export type DealDetail = z.infer<typeof dealDetailSchema>;

export const contactDetailSchema = z.object({
  person: personSchema,
  company: companySchema,
  deals: z.array(dealSchema),
  activity: z.array(activitySchema),
  emails: z.array(
    z.object({
      id: z.string(),
      subject: z.string(),
      snippet: z.string(),
      at: z.string(),
      direction: z.enum(['in', 'out']),
    }),
  ),
  files: z.array(z.object({ id: z.string(), name: z.string(), size: z.number(), at: z.string() })),
});
export type ContactDetail = z.infer<typeof contactDetailSchema>;

export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  dealId: z.string().nullable(),
  related: z.string(),
  owner: z.string(),
  dueAt: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
  done: z.boolean(),
});
export type CrmTask = z.infer<typeof taskSchema>;

export const meetingSchema = z.object({
  id: z.string(),
  kind: z.enum(['call', 'meeting', 'demo']),
  title: z.string(),
  with: z.string(),
  company: z.string(),
  startsAt: z.string(),
  durationMin: z.number(),
  owner: z.string(),
  outcome: z.string().nullable(),
});
export type Meeting = z.infer<typeof meetingSchema>;

export const reportsSchema = z.object({
  winRate: z.number(),
  avgCycleDays: z.number(),
  avgDealSize: z.number(),
  trend: z.array(z.object({ month: z.string(), winRate: z.number(), cycle: z.number() })),
  bySource: z.array(
    z.object({ source: z.string(), deals: z.number(), won: z.number(), revenue: z.number() }),
  ),
  lossReasons: z.array(z.object({ reason: z.string(), count: z.number() })),
  byOwner: z.array(z.object({ owner: z.string(), winRate: z.number(), cycle: z.number() })),
});
export type CrmReports = z.infer<typeof reportsSchema>;

export const newDealSchema = z.object({
  name: z.string().trim().min(1, 'validation.required').max(80, 'validation.tooLong'),
  company: z.string().min(1, 'validation.required'),
  value: z.number().min(1, 'validation.required'),
  stage: z.enum(OPEN_STAGES),
});
export type NewDealInput = z.infer<typeof newDealSchema>;

export const logCallSchema = z.object({
  with: z.string().min(1, 'validation.required'),
  title: z.string().trim().min(1, 'validation.required').max(80, 'validation.tooLong'),
  durationMin: z.number().min(1, 'validation.required'),
  outcome: z.string().min(1, 'validation.required'),
});
export type LogCallInput = z.infer<typeof logCallSchema>;

/** Tone per stage for badges, chart bars and kanban column dots. */
export const STAGE_COLOR: Record<DealStage, string> = {
  lead: 'var(--chart-4)',
  qualified: 'var(--chart-2)',
  proposal: 'var(--chart-1)',
  negotiation: 'var(--chart-3)',
  won: 'var(--success)',
  lost: 'var(--muted-foreground)',
};

export const companyDetailSchema = z.object({
  company: companySchema,
  contacts: z.array(personSchema),
  deals: z.array(dealSchema),
  activity: z.array(activitySchema),
  wonRevenue: z.number(),
});
export type CompanyDetail = z.infer<typeof companyDetailSchema>;

export const LEAD_STATUSES = ['new', 'qualified', 'disqualified', 'converted'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export const LEAD_ACTIONS = ['qualify', 'disqualify', 'convert'] as const;
export type LeadAction = (typeof LEAD_ACTIONS)[number];

export const leadSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
  email: z.string(),
  company: z.string(),
  source: z.enum(DEAL_SOURCES),
  score: z.number(),
  interest: z.string(),
  estimatedValue: z.number(),
  status: z.enum(LEAD_STATUSES),
  owner: z.string(),
  dealId: z.string().nullable(),
  createdAt: z.string(),
});
export type Lead = z.infer<typeof leadSchema>;

export const SEQUENCE_STATUSES = ['active', 'paused', 'draft'] as const;
export const STEP_KINDS = ['email', 'call', 'task'] as const;

export const sequenceStepSchema = z.object({
  kind: z.enum(STEP_KINDS),
  delayDays: z.number().int().min(0, 'validation.required').max(30, 'validation.tooLong'),
  subject: z.string().trim().min(1, 'validation.required').max(80, 'validation.tooLong'),
});

export const sequenceInputSchema = z.object({
  name: z.string().trim().min(1, 'validation.required').max(60, 'validation.tooLong'),
  status: z.enum(SEQUENCE_STATUSES),
  steps: z.array(sequenceStepSchema).min(1, 'validation.required'),
});
export type SequenceInput = z.infer<typeof sequenceInputSchema>;

export const sequenceSchema = sequenceInputSchema.extend({
  id: z.string(),
  owner: z.string(),
  enrolled: z.number(),
  active: z.number(),
  openRate: z.number(),
  replyRate: z.number(),
  updatedAt: z.string(),
});
export type Sequence = z.infer<typeof sequenceSchema>;

export const forecastSchema = z.object({
  quota: z.number(),
  closed: z.number(),
  months: z.array(
    z.object({
      month: z.string(),
      closed: z.number(),
      commit: z.number(),
      bestCase: z.number(),
      pipeline: z.number(),
    }),
  ),
  reps: z.array(
    z.object({
      owner: z.string(),
      quota: z.number(),
      closed: z.number(),
      commit: z.number(),
      bestCase: z.number(),
      wonDeals: z.number(),
    }),
  ),
});
export type Forecast = z.infer<typeof forecastSchema>;

/** Forecast categories, most to least certain. */
export const FORECAST_COLOR = {
  closed: 'var(--success)',
  commit: 'var(--chart-1)',
  bestCase: 'var(--chart-4)',
  pipeline: 'var(--chart-2)',
} as const;
