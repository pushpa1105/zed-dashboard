import { z } from 'zod';

import { AGING_BUCKETS, type AgingBucket } from '@/features/erp/model/erp';

/* Receivables ---------------------------------------------------------------- */

export const customerBalanceSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  creditLimit: z.number(),
  lastReminder: z.string().nullable(),
  invoices: z.array(
    z.object({
      id: z.string(),
      issued: z.string(),
      due: z.string(),
      balance: z.number(),
      daysOverdue: z.number(),
      bucket: z.enum(AGING_BUCKETS),
    }),
  ),
});
export type CustomerBalance = z.infer<typeof customerBalanceSchema>;

/** Open balance per aging bucket, plus the total and the overdue part. */
export function customerAging({ invoices }: CustomerBalance) {
  const buckets = Object.fromEntries(
    AGING_BUCKETS.map((b) => [
      b,
      invoices.filter((i) => i.bucket === b).reduce((s, i) => s + i.balance, 0),
    ]),
  ) as Record<AgingBucket, number>;
  const total = invoices.reduce((s, i) => s + i.balance, 0);
  return { buckets, total, overdue: total - buckets.current };
}

/* Sales orders --------------------------------------------------------------- */

export const SO_STATUSES = ['quote', 'confirmed', 'fulfilled', 'invoiced'] as const;
export type SoStatus = (typeof SO_STATUSES)[number];
export type SoAction = 'confirm' | 'invoice';

/** The action that moves an order forward, if the user can take one. */
export const NEXT_ACTION: Partial<Record<SoStatus, SoAction>> = {
  quote: 'confirm',
  fulfilled: 'invoice',
};

export const salesOrderSchema = z.object({
  id: z.string(),
  customer: z.string(),
  email: z.string(),
  rep: z.string(),
  created: z.string(),
  delivery: z.string(),
  status: z.enum(SO_STATUSES),
  invoiceId: z.string().nullable(),
  taxRate: z.number(),
  lines: z.array(
    z.object({
      description: z.string(),
      quantity: z.number(),
      unitPrice: z.number(),
      discount: z.number(),
    }),
  ),
  events: z.array(z.object({ at: z.string(), label: z.string() })),
});
export type SalesOrder = z.infer<typeof salesOrderSchema>;
type SalesOrderLine = SalesOrder['lines'][number];

export const lineTotal = (l: SalesOrderLine) => l.quantity * l.unitPrice * (1 - l.discount);

export function soTotals(so: SalesOrder) {
  const subtotal = so.lines.reduce((s, l) => s + lineTotal(l), 0);
  const tax = subtotal * so.taxRate;
  return { subtotal, tax, total: subtotal + tax };
}
