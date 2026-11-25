import { z } from 'zod';

/* Chart of accounts ------------------------------------------------------- */

export const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'revenue', 'expense'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export type AccountNode = {
  code: string;
  name: string;
  type: AccountType;
  debit: number;
  credit: number;
  balance: number;
  children?: AccountNode[];
};

export const accountNodeSchema: z.ZodType<AccountNode> = z.lazy(() =>
  z.object({
    code: z.string(),
    name: z.string(),
    type: z.enum(ACCOUNT_TYPES),
    debit: z.number(),
    credit: z.number(),
    balance: z.number(),
    children: z.array(accountNodeSchema).optional(),
  }),
);

export const accountOptionSchema = z.object({ code: z.string(), name: z.string() });
export type AccountOption = z.infer<typeof accountOptionSchema>;

/* Journal ------------------------------------------------------------------ */

export const journalLineSchema = z.object({
  account: z.string(),
  accountName: z.string(),
  debit: z.number(),
  credit: z.number(),
});

export const journalEntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  memo: z.string(),
  reference: z.string(),
  status: z.enum(['posted', 'draft']),
  author: z.string(),
  lines: z.array(journalLineSchema),
});
export type JournalEntry = z.infer<typeof journalEntrySchema>;

export type JournalEntryInput = {
  date: string;
  memo: string;
  reference: string;
  post: boolean;
  lines: Array<{ account: string; debit: number; credit: number }>;
};

/* Budgets ------------------------------------------------------------------ */

export const budgetsSchema = z.object({
  quarter: z.number(),
  departments: z.array(
    z.object({
      name: z.string(),
      owner: z.string(),
      annual: z.number(),
      budget: z.number(),
      actual: z.number(),
      ytdBudget: z.number(),
      ytdActual: z.number(),
    }),
  ),
});
export type Budgets = z.infer<typeof budgetsSchema>;

/* Statements --------------------------------------------------------------- */

const statementLineSchema = z.object({ label: z.string(), values: z.array(z.number()) });
export const statementSchema = z.object({
  columns: z.array(z.string()),
  sections: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      lines: z.array(statementLineSchema),
      total: statementLineSchema,
    }),
  ),
});
export type Statement = z.infer<typeof statementSchema>;
export type StatementKind = 'pnl' | 'balance';

/* Receivables ---------------------------------------------------------------- */

export const INVOICE_STATUSES = ['draft', 'open', 'overdue', 'paid'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export const AGING_BUCKETS = ['current', '1-30', '31-60', '61-90', '90+'] as const;
export type AgingBucket = (typeof AGING_BUCKETS)[number];

export const invoiceSummarySchema = z.object({
  id: z.string(),
  customer: z.string(),
  email: z.string(),
  issued: z.string(),
  due: z.string(),
  amount: z.number(),
  paid: z.number(),
  status: z.enum(INVOICE_STATUSES),
  terms: z.string(),
  bucket: z.enum(AGING_BUCKETS),
  daysOverdue: z.number(),
});
export type InvoiceSummary = z.infer<typeof invoiceSummarySchema>;

export const invoicesResponseSchema = z.object({
  buckets: z.array(z.object({ key: z.enum(AGING_BUCKETS), count: z.number(), amount: z.number() })),
  collectedThisMonth: z.number(),
  averageDaysToPay: z.number(),
  invoices: z.array(invoiceSummarySchema),
});
export type InvoicesResponse = z.infer<typeof invoicesResponseSchema>;

export const invoiceDetailSchema = invoiceSummarySchema.extend({
  lines: z.array(
    z.object({ description: z.string(), quantity: z.number(), unitPrice: z.number() }),
  ),
  events: z.array(z.object({ at: z.string(), label: z.string() })),
});
export type InvoiceDetail = z.infer<typeof invoiceDetailSchema>;

export type InvoiceFilters = { status?: InvoiceStatus; bucket?: AgingBucket };

/* Payables ------------------------------------------------------------------ */

export const PAYABLE_STATUSES = ['draft', 'pending', 'approved', 'paid', 'rejected'] as const;
export type PayableStatus = (typeof PAYABLE_STATUSES)[number];
export type PayableAction = 'submit' | 'approve' | 'reject' | 'pay';

export const payableSchema = z.object({
  id: z.string(),
  kind: z.enum(['po', 'bill']),
  vendor: z.string(),
  description: z.string(),
  amount: z.number(),
  created: z.string(),
  due: z.string(),
  status: z.enum(PAYABLE_STATUSES),
  requester: z.string(),
  approver: z.string(),
  steps: z.array(
    z.object({
      key: z.enum(['submitted', 'approved', 'paid']),
      by: z.string().nullable(),
      at: z.string().nullable(),
    }),
  ),
  note: z.string().nullable(),
});
export type Payable = z.infer<typeof payableSchema>;

/* Vendors ------------------------------------------------------------------- */

export const vendorSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  contact: z.string(),
  email: z.string(),
  terms: z.string(),
  country: z.string(),
  rating: z.number(),
  balance: z.number(),
  ytdSpend: z.number(),
  onTimeRate: z.number(),
  status: z.enum(['active', 'on-hold']),
});
export type Vendor = z.infer<typeof vendorSchema>;
