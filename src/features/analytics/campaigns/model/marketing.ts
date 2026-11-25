import { z } from 'zod';

export const MARKETING_PERIODS = ['7d', '30d', '90d'] as const;
export type MarketingPeriod = (typeof MARKETING_PERIODS)[number];

export const DEAL_INTERVALS = ['monthly', 'weekly'] as const;
export type DealInterval = (typeof DEAL_INTERVALS)[number];

export const KPI_KEYS = ['domains', 'projects', 'clicks', 'links'] as const;

const ledgerRowSchema = z.object({
  id: z.string(),
  type: z.string(),
  date: z.string(),
  amount: z.number(),
});

export const marketingOverviewSchema = z.object({
  kpis: z.array(
    z.object({
      key: z.enum(KPI_KEYS),
      value: z.number(),
      delta: z.number(),
      spark: z.array(z.number()),
    }),
  ),
  traffic: z.array(z.object({ date: z.string(), impressions: z.number(), uniques: z.number() })),
  earnings: z.array(ledgerRowSchema),
  expenses: z.array(ledgerRowSchema),
  payouts: z.array(ledgerRowSchema.extend({ status: z.enum(['paid', 'pending', 'failed']) })),
  posts: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      kind: z.string(),
      reach: z.number(),
      delta: z.number(),
    }),
  ),
  postStats: z.array(z.object({ day: z.string(), posts: z.number() })),
  channels: z.array(z.object({ channel: z.string(), current: z.number(), previous: z.number() })),
  funnel: z.array(z.object({ stage: z.string(), value: z.number() })),
});

export type MarketingOverview = z.infer<typeof marketingOverviewSchema>;
export type LedgerRow = MarketingOverview['earnings'][number];
export type PayoutRow = MarketingOverview['payouts'][number];

export const dealsSchema = z.array(
  z.object({ label: z.string(), open: z.number(), closed: z.number() }),
);
export type DealsSeries = z.infer<typeof dealsSchema>;
