import { z } from 'zod';

/* Purchase orders ------------------------------------------------------------ */

export const PO_STATUSES = ['draft', 'approved', 'received', 'closed'] as const;
export type PoStatus = (typeof PO_STATUSES)[number];
export type PoAction = 'approve' | 'receive' | 'close';

export const purchaseOrderSchema = z.object({
  id: z.string(),
  vendor: z.string(),
  buyer: z.string(),
  created: z.string(),
  expected: z.string(),
  status: z.enum(PO_STATUSES),
  lines: z.array(
    z.object({
      sku: z.string(),
      description: z.string(),
      quantity: z.number(),
      received: z.number(),
      unitPrice: z.number(),
    }),
  ),
  events: z.array(z.object({ at: z.string(), label: z.string() })),
});
export type PurchaseOrder = z.infer<typeof purchaseOrderSchema>;

/** Order value and receiving progress (by units) derived from the lines. */
export function poTotals(po: PurchaseOrder) {
  const sum = (pick: (l: PurchaseOrder['lines'][number]) => number) =>
    po.lines.reduce((s, l) => s + pick(l), 0);
  const ordered = sum((l) => l.quantity);
  return {
    total: sum((l) => l.quantity * l.unitPrice),
    receivedPct: ordered ? (sum((l) => l.received) / ordered) * 100 : 0,
  };
}

/* Bank reconciliation -------------------------------------------------------- */

const bankLineSchema = z.object({
  id: z.string(),
  date: z.string(),
  amount: z.number(),
  matchId: z.string().nullable(),
});

export const reconciliationSchema = z.object({
  account: z.string(),
  period: z.string(),
  openingBalance: z.number(),
  statement: z.array(bankLineSchema.extend({ description: z.string() })),
  ledger: z.array(bankLineSchema.extend({ reference: z.string(), memo: z.string() })),
});
export type Reconciliation = z.infer<typeof reconciliationSchema>;

/* Fixed assets --------------------------------------------------------------- */

export const ASSET_CATEGORIES = [
  'buildings',
  'machinery',
  'vehicles',
  'computers',
  'furniture',
] as const;
export const DEPRECIATION_METHODS = ['straight-line', 'declining-balance'] as const;

export const assetInputSchema = z.object({
  name: z.string(),
  category: z.enum(ASSET_CATEGORIES),
  location: z.string(),
  acquired: z.string(),
  cost: z.number(),
  salvage: z.number(),
  usefulLife: z.number(),
  method: z.enum(DEPRECIATION_METHODS),
});
export type AssetInput = z.infer<typeof assetInputSchema>;

export const assetSchema = assetInputSchema.extend({
  id: z.string(),
  bookValue: z.number(),
  accumulated: z.number(),
  schedule: z.array(
    z.object({ year: z.number(), depreciation: z.number(), bookValue: z.number() }),
  ),
});
export type Asset = z.infer<typeof assetSchema>;

/* Expense claims ------------------------------------------------------------- */

export const CLAIM_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];
export const CLAIM_CATEGORIES = [
  'travel',
  'lodging',
  'meals',
  'software',
  'equipment',
  'mileage',
] as const;

export const expenseClaimSchema = z.object({
  id: z.string(),
  employee: z.string(),
  department: z.string(),
  submitted: z.string(),
  category: z.enum(CLAIM_CATEGORIES),
  description: z.string(),
  amount: z.number(),
  receipts: z.number(),
  status: z.enum(CLAIM_STATUSES),
  note: z.string().nullable(),
});
export type ExpenseClaim = z.infer<typeof expenseClaimSchema>;
