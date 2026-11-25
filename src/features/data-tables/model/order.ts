import { z } from 'zod';

import { paginationMetaSchema } from '@/core/api/schemas';

export const ORDER_STATUSES = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_CHANNELS = ['web', 'mobile', 'marketplace', 'retail'] as const;
export type OrderChannel = (typeof ORDER_CHANNELS)[number];

export const ORDER_COUNTRIES = [
  'Australia',
  'Brazil',
  'Canada',
  'France',
  'Germany',
  'India',
  'Japan',
  'Nepal',
  'Netherlands',
  'Spain',
  'United Kingdom',
  'United States',
] as const;

export const orderSchema = z.object({
  id: z.string(),
  number: z.string(),
  customerName: z.string(),
  customerEmail: z.string(),
  status: z.enum(ORDER_STATUSES),
  channel: z.enum(ORDER_CHANNELS),
  country: z.string(),
  items: z.number(),
  total: z.number(),
  paid: z.boolean(),
  createdAt: z.string(),
  assignee: z.string().nullable(),
});
export type Order = z.infer<typeof orderSchema>;

export const ordersPageSchema = z.object({
  data: z.array(orderSchema),
  meta: paginationMetaSchema,
  /** Counts per value with every other filter applied (for faceted filters). */
  facets: z.object({
    status: z.record(z.string(), z.number()),
    channel: z.record(z.string(), z.number()),
  }),
});
export type OrdersPage = z.infer<typeof ordersPageSchema>;

/**
 * Table state kept in the URL (`?page=2&sort=total:desc&status=shipped…`).
 * Invalid values fall back to defaults instead of throwing.
 */
export const ordersSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(5).max(200).catch(20),
  sort: z.string().catch('createdAt:desc'),
  q: z.string().catch(''),
  status: z.string().catch(''),
  channel: z.string().catch(''),
  from: z.string().catch(''),
  to: z.string().catch(''),
  min: z.string().catch(''),
  max: z.string().catch(''),
  /** JSON-encoded advanced filter tree. */
  filters: z.string().catch(''),
});
export type OrdersSearch = z.infer<typeof ordersSearchSchema>;

export const ORDERS_SEARCH_DEFAULTS: OrdersSearch = ordersSearchSchema.parse({});
