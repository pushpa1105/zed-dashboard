import { z } from 'zod';

export const GRANULARITIES = ['month', 'week'] as const;
export type Granularity = (typeof GRANULARITIES)[number];

export const ANALYTICS_KPIS = ['pageViews', 'users', 'orders', 'sales'] as const;
export const ORDER_STATUSES = ['approved', 'pending', 'rejected'] as const;
export type AnalyticsOrderStatus = (typeof ORDER_STATUSES)[number];

export const analyticsOverviewSchema = z.object({
  kpis: z.array(
    z.object({
      key: z.enum(ANALYTICS_KPIS),
      value: z.number(),
      delta: z.number(),
      extra: z.number(),
    }),
  ),
  income: z.object({
    total: z.number(),
    days: z.array(z.object({ day: z.string(), value: z.number() })),
  }),
  orders: z.array(
    z.object({
      id: z.string(),
      product: z.string(),
      quantity: z.number(),
      status: z.enum(ORDER_STATUSES),
      amount: z.number(),
    }),
  ),
  report: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      value: z.string(),
      tone: z.enum(['good', 'neutral', 'bad']),
    }),
  ),
  reportTrend: z.array(z.object({ month: z.string(), value: z.number() })),
  heatmap: z.object({
    rows: z.array(z.string()),
    columns: z.array(z.string()),
    values: z.array(z.array(z.number())),
  }),
  salesReport: z.object({
    total: z.number(),
    weeks: z.array(z.object({ day: z.string(), income: z.number(), costs: z.number() })),
  }),
});

export const visitorsSchema = z.object({
  granularity: z.enum(GRANULARITIES),
  points: z.array(z.object({ label: z.string(), pageViews: z.number(), sessions: z.number() })),
});

export type AnalyticsOverview = z.infer<typeof analyticsOverviewSchema>;
export type Visitors = z.infer<typeof visitorsSchema>;
