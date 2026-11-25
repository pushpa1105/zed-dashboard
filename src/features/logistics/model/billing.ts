import { z } from 'zod';

export const INVOICE_STATUSES = ['pending', 'approved', 'disputed'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const invoiceSchema = z.object({
  id: z.string(),
  number: z.string(),
  carrier: z.string(),
  shipmentId: z.string(),
  origin: z.string(),
  destination: z.string(),
  issuedAt: z.string(),
  distanceKm: z.number(),
  quoted: z.number(),
  invoiced: z.number(),
  status: z.enum(INVOICE_STATUSES),
  disputeReason: z.string().nullable(),
});
export type Invoice = z.infer<typeof invoiceSchema>;

export const billingSchema = z.object({
  invoices: z.array(invoiceSchema),
  costPerKm: z.array(z.object({ month: z.string(), road: z.number(), rail: z.number() })),
  /** Contracted road rate in EUR per km. */
  contractRate: z.number(),
});
export type Billing = z.infer<typeof billingSchema>;

export type InvoiceAction =
  { id: string; action: 'approve' } | { id: string; action: 'dispute'; reason: string };

/** Invoices more than 2% above the quote need a look; above 10% they're flagged. */
export function variance(invoice: Pick<Invoice, 'quoted' | 'invoiced'>) {
  const pct = ((invoice.invoiced - invoice.quoted) / invoice.quoted) * 100;
  return { pct, level: pct > 10 ? 'high' : pct > 2 ? 'review' : 'ok' } as const;
}
