import { z } from 'zod';

export const PRODUCT_CATEGORIES = ['platform', 'addon', 'services', 'support'] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

const productFields = z.object({
  name: z.string().trim().min(1, 'validation.required').max(60, 'validation.tooLong'),
  sku: z.string().trim().min(1, 'validation.required').max(16, 'validation.tooLong'),
  category: z.enum(PRODUCT_CATEGORIES),
  listPrice: z.number().positive('validation.required'),
  cost: z.number().min(0, 'validation.required'),
  active: z.boolean(),
});

export const productInputSchema = productFields.refine((p) => p.cost <= p.listPrice, {
  path: ['cost'],
  message: 'crm:products.form.costAboveList',
});
export type ProductInput = z.infer<typeof productInputSchema>;

export const productSchema = productFields.extend({ id: z.string() });
export type Product = z.infer<typeof productSchema>;

/** Gross margin as a percentage of list price. */
export const marginOf = ({ listPrice, cost }: Pick<Product, 'listPrice' | 'cost'>) =>
  listPrice ? ((listPrice - cost) / listPrice) * 100 : 0;

export const QUOTE_STATUSES = ['draft', 'sent', 'accepted', 'declined'] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

/** Status changes a quote allows; accepted and declined are final. */
export const NEXT_QUOTE_STATUS: Record<QuoteStatus, Exclude<QuoteStatus, 'draft'>[]> = {
  draft: ['sent'],
  sent: ['declined', 'accepted'],
  accepted: [],
  declined: [],
};

const quoteLineSchema = z.object({
  productId: z.string(),
  name: z.string(),
  quantity: z.number().int().min(1, 'validation.required').max(999, 'validation.tooLong'),
  unitPrice: z.number().min(0, 'validation.required'),
});

export const quoteDraftSchema = z.object({
  lines: z.array(quoteLineSchema).min(1, 'validation.required'),
  discountPct: z.number().min(0).max(50, 'validation.tooLong'),
  taxRate: z.number().min(0).max(30, 'validation.tooLong'),
});
export type QuoteDraft = z.infer<typeof quoteDraftSchema>;

export const quoteSchema = quoteDraftSchema.extend({
  id: z.string(),
  number: z.string(),
  title: z.string(),
  dealId: z.string(),
  company: z.string(),
  contact: z.string(),
  owner: z.string(),
  status: z.enum(QUOTE_STATUSES),
  total: z.number(),
  createdAt: z.string(),
  validUntil: z.string(),
});
export type Quote = z.infer<typeof quoteSchema>;

export const newQuoteSchema = z.object({
  dealId: z.string().min(1, 'validation.required'),
  validDays: z.number(),
});
export type NewQuoteInput = z.infer<typeof newQuoteSchema>;

/** Subtotal, discount, tax and grand total of a quote draft. */
export function quoteTotals({ lines, discountPct, taxRate }: QuoteDraft) {
  const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const discount = (subtotal * discountPct) / 100;
  const tax = ((subtotal - discount) * taxRate) / 100;
  return { subtotal, discount, tax, total: subtotal - discount + tax };
}
