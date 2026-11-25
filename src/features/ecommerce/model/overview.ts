import { z } from 'zod';

export const ECOMMERCE_YEARS = ['2025', '2024', '2023'] as const;
export type EcommerceYear = (typeof ECOMMERCE_YEARS)[number];

export const KPI_KEYS = ['revenue', 'costs', 'profit', 'shipments'] as const;
export const ORDER_STATUSES = ['paid', 'pending', 'shipped', 'refunded'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ecommerceOverviewSchema = z.object({
  kpis: z.array(
    z.object({
      key: z.enum(KPI_KEYS),
      value: z.number(),
      delta: z.number(),
      trend: z.array(z.number()),
    }),
  ),
  orderRate: z.array(z.object({ month: z.string(), thisYear: z.number(), lastYear: z.number() })),
  carrying: z.object({
    total: z.number(),
    delta: z.number(),
    bars: z.array(z.object({ month: z.string(), value: z.number() })),
  }),
  performance: z.array(
    z.object({ day: z.string(), target: z.number(), paid: z.number(), pending: z.number() }),
  ),
  channels: z.array(z.object({ key: z.string(), label: z.string(), value: z.number() })),
  orders: z.array(
    z.object({
      id: z.string(),
      customer: z.string(),
      product: z.string(),
      quantity: z.number(),
      amount: z.number(),
      status: z.enum(ORDER_STATUSES),
      date: z.number(),
    }),
  ),
  topProducts: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      category: z.string(),
      sold: z.number(),
      revenue: z.number(),
      stock: z.number(),
      trend: z.array(z.number()),
    }),
  ),
  ratings: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      orders: z.number(),
      rating: z.number(),
      spent: z.number(),
    }),
  ),
  summary: z.array(z.object({ key: z.string(), label: z.string(), count: z.number() })),
});

export type EcommerceOverview = z.infer<typeof ecommerceOverviewSchema>;
