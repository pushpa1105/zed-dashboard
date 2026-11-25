import { z } from 'zod';

export const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'overdue'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const customerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  address: z.string(),
  taxId: z.string(),
});

export const invoiceSummarySchema = z.object({
  id: z.string(),
  number: z.string(),
  customer: z.object({ id: z.string(), name: z.string(), email: z.string() }),
  status: z.enum(INVOICE_STATUSES),
  issueDate: z.number(),
  dueDate: z.number(),
  total: z.number(),
  currency: z.string(),
});

export const lineSchema = z.object({
  description: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
});

export const invoiceSchema = invoiceSummarySchema.extend({
  customer: customerSchema,
  paidAt: z.number().nullable(),
  items: z.array(lineSchema),
  taxRate: z.number(),
  discount: z.number(),
  notes: z.string(),
  subtotal: z.number(),
  discountAmount: z.number(),
  tax: z.number(),
});

export const invoiceListSchema = z.object({
  data: z.array(invoiceSummarySchema),
  byStatus: z.array(
    z.object({ status: z.enum(INVOICE_STATUSES), count: z.number(), amount: z.number() }),
  ),
});

export type Customer = z.infer<typeof customerSchema>;
export type InvoiceSummary = z.infer<typeof invoiceSummarySchema>;
export type Invoice = z.infer<typeof invoiceSchema>;
export type InvoiceList = z.infer<typeof invoiceListSchema>;
export type Line = z.infer<typeof lineSchema>;

/** Editor form. Messages are `common:validation.*` keys or feature keys (translated on render). */
export const invoiceFormSchema = z
  .object({
    customerId: z.string().min(1, 'validation.required'),
    issueDate: z.date(),
    dueDate: z.date(),
    items: z
      .array(
        z.object({
          description: z.string().trim().min(1, 'validation.required'),
          quantity: z.number().min(1),
          unitPrice: z.number().min(0),
        }),
      )
      .min(1),
    taxRate: z.number().min(0).max(100),
    discount: z.number().min(0),
    notes: z.string().max(500, 'validation.tooLong'),
  })
  .refine((v) => v.dueDate >= v.issueDate, {
    path: ['dueDate'],
    message: 'Due date must be on or after the issue date',
  });

export type InvoiceForm = z.infer<typeof invoiceFormSchema>;

/** Same math as the server, so the editor's totals match the saved invoice. */
export function computeTotals(items: Line[], taxRate: number, discount: number) {
  const subtotal = items.reduce((s, l) => s + (l.quantity || 0) * (l.unitPrice || 0), 0);
  const discountAmount = Math.min(discount || 0, subtotal);
  const tax = ((subtotal - discountAmount) * (taxRate || 0)) / 100;
  return { subtotal, discountAmount, tax, total: subtotal - discountAmount + tax };
}

export const money = (amount: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

/** Badge tones per status (shared by the list and the detail page). */
export const INVOICE_TONES = {
  draft: 'neutral',
  sent: 'blue',
  paid: 'success',
  overdue: 'danger',
} as const satisfies Record<InvoiceStatus, 'neutral' | 'blue' | 'success' | 'danger'>;
