import { z } from 'zod';

export const SCENARIOS = ['base', 'optimistic', 'pessimistic'] as const;
export type Scenario = (typeof SCENARIOS)[number];
export const FLOW_KINDS = ['inflow', 'outflow'] as const;
export type FlowKind = (typeof FLOW_KINDS)[number];
const CATEGORIES = [
  'receipts',
  'bookings',
  'payroll',
  'rent',
  'debt',
  'software',
  'suppliers',
  'tax',
] as const;

export const cashForecastSchema = z.object({
  scenario: z.enum(SCENARIOS),
  minimumCash: z.number(),
  weeks: z.array(
    z.object({
      week: z.number(),
      start: z.string(),
      inflow: z.number(),
      outflow: z.number(),
      opening: z.number(),
      closing: z.number(),
    }),
  ),
  items: z.array(
    z.object({
      id: z.string(),
      date: z.string(),
      week: z.number(),
      kind: z.enum(FLOW_KINDS),
      category: z.enum(CATEGORIES),
      counterparty: z.string(),
      amount: z.number(),
      confidence: z.enum(['committed', 'expected', 'estimated']),
    }),
  ),
});
export type CashForecast = z.infer<typeof cashForecastSchema>;
export type ForecastItem = CashForecast['items'][number];
