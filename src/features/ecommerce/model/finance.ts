import { z } from 'zod';

/* Transactions & payouts -------------------------------------------------- */

export const TRANSACTION_STATUSES = ['succeeded', 'pending', 'failed'] as const;
export const PAYMENT_METHODS = ['card', 'apple_pay', 'paypal', 'in_person'] as const;

const transactionSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  orderNumber: z.string(),
  customerName: z.string(),
  type: z.enum(['charge', 'refund']),
  status: z.enum(TRANSACTION_STATUSES),
  method: z.enum(PAYMENT_METHODS),
  card: z.string().nullable(),
  amount: z.number(),
  fee: z.number(),
  createdAt: z.number(),
});
export type Transaction = z.infer<typeof transactionSchema>;

export const transactionsSearchSchema = z.object({
  status: z.string().catch(''),
  method: z.string().catch(''),
  page: z.coerce.number().int().min(1).catch(1),
});
export type TransactionsSearch = z.infer<typeof transactionsSearchSchema>;

export const transactionsPageSchema = z.object({
  data: z.array(transactionSchema),
  meta: z.object({ page: z.number(), total: z.number(), totalPages: z.number() }),
  summary: z.object({ gross: z.number(), refunds: z.number(), fees: z.number(), net: z.number() }),
  daily: z.array(z.object({ day: z.string(), gross: z.number(), net: z.number() })),
});

const PAYOUT_STATUSES = ['paid', 'in_transit', 'scheduled'] as const;

const payoutSchema = z.object({
  id: z.string(),
  amount: z.number(),
  transactions: z.number(),
  arrivesAt: z.number(),
  status: z.enum(PAYOUT_STATUSES),
});
export type Payout = z.infer<typeof payoutSchema>;

export const payoutsSchema = z.object({
  schedule: z.object({ interval: z.enum(['daily', 'weekly', 'monthly']), delayDays: z.number() }),
  account: z.object({ bank: z.string(), last4: z.string() }),
  pending: z.number(),
  next: payoutSchema.nullable(),
  payouts: z.array(payoutSchema),
});

/* Returns ----------------------------------------------------------------- */

export const RETURN_REASONS = [
  'damaged',
  'wrongItem',
  'notAsDescribed',
  'changedMind',
  'other',
] as const;
export const RETURN_STATUSES = ['requested', 'approved', 'rejected', 'refunded'] as const;
export const RETURN_TABS = ['all', ...RETURN_STATUSES] as const;
export type ReturnStatus = (typeof RETURN_STATUSES)[number];
export type ReturnTab = (typeof RETURN_TABS)[number];

export const returnRequestSchema = z.object({
  id: z.string(),
  number: z.string(),
  orderId: z.string(),
  orderNumber: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  item: z.object({ name: z.string(), variant: z.string(), hue: z.number(), qty: z.number() }),
  reason: z.enum(RETURN_REASONS),
  comment: z.string(),
  amount: z.number(),
  status: z.enum(RETURN_STATUSES),
  createdAt: z.number(),
});
export type ReturnRequest = z.infer<typeof returnRequestSchema>;

export const returnsResponseSchema = z.object({
  data: z.array(returnRequestSchema),
  counts: z.record(z.enum(RETURN_TABS), z.number()),
  reasons: z.array(z.object({ reason: z.enum(RETURN_REASONS), count: z.number() })),
  refunded: z.number(),
});
