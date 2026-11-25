import { z } from 'zod';

import { ORDER_CHANNELS } from './store';

export const REPORT_PERIODS = ['7d', '30d', '60d'] as const;

export const salesReportSearchSchema = z.object({
  period: z.enum(REPORT_PERIODS).catch('30d'),
  channel: z.string().catch(''),
});
export type SalesReportSearch = z.infer<typeof salesReportSearchSchema>;

const metricSchema = z.object({ value: z.number(), delta: z.number() });

export const salesReportSchema = z.object({
  summary: z.object({
    revenue: metricSchema,
    orders: metricSchema,
    units: metricSchema,
    aov: metricSchema,
  }),
  daily: z.array(
    z.object({
      day: z.string(),
      online: z.number(),
      pos: z.number(),
      marketplace: z.number(),
      social: z.number(),
    }),
  ),
  channels: z.array(
    z.object({ channel: z.enum(ORDER_CHANNELS), revenue: z.number(), orders: z.number() }),
  ),
  categories: z.array(
    z.object({ id: z.string(), name: z.string(), revenue: z.number(), units: z.number() }),
  ),
  products: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      category: z.string(),
      hue: z.number(),
      units: z.number(),
      orders: z.number(),
      revenue: z.number(),
    }),
  ),
});
export type SalesReport = z.infer<typeof salesReportSchema>;
