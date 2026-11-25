import { z } from 'zod';

/** Expiry windows are cumulative: "60" means expiring within the next 60 days. */
export const EXPIRY_WINDOWS = ['expired', '30', '60', '90'] as const;
export type ExpiryWindow = (typeof EXPIRY_WINDOWS)[number];

export const batchSchema = z.object({
  id: z.string(),
  sku: z.string(),
  name: z.string(),
  category: z.string(),
  supplier: z.string(),
  warehouse: z.string(),
  bin: z.string(),
  quantity: z.number(),
  unitCost: z.number(),
  received: z.string(),
  expires: z.string(),
  daysLeft: z.number(),
  status: z.enum(['released', 'quarantined']),
});
export type Batch = z.infer<typeof batchSchema>;

export const binLayoutSchema = z.object({
  warehouse: z.string(),
  zones: z.array(
    z.object({
      code: z.string(),
      name: z.string(),
      aisles: z.array(
        z.object({
          code: z.string(),
          bins: z.array(z.object({ code: z.string(), fill: z.number(), skus: z.number() })),
        }),
      ),
    }),
  ),
});
export type BinLayout = z.infer<typeof binLayoutSchema>;
export type Bin = BinLayout['zones'][number]['aisles'][number]['bins'][number];

export const binDetailSchema = z.object({
  warehouse: z.string(),
  code: z.string(),
  fill: z.number(),
  contents: z.array(
    z.object({
      sku: z.string(),
      name: z.string(),
      onHand: z.number(),
      reserved: z.number(),
      unitCost: z.number(),
    }),
  ),
});
export type BinContent = z.infer<typeof binDetailSchema>['contents'][number];

export type MoveStockInput = {
  warehouse: string;
  from: string;
  to: string;
  sku: string;
  quantity: number;
};

export const VALUATION_METHODS = ['fifo', 'average'] as const;
export type ValuationMethod = (typeof VALUATION_METHODS)[number];

export const slowMoverSchema = z.object({
  sku: z.string(),
  name: z.string(),
  category: z.string(),
  onHand: z.number(),
  value: z.number(),
  daysSinceSale: z.number().nullable(),
  coverDays: z.number(),
  class: z.enum(['slow', 'dead']),
});
export type SlowMover = z.infer<typeof slowMoverSchema>;

export const valuationSchema = z.object({
  method: z.enum(VALUATION_METHODS),
  total: z.number(),
  units: z.number(),
  skuCount: z.number(),
  trend: z.array(z.number()),
  categories: z.array(z.object({ name: z.string(), value: z.number() })),
  warehouses: z.array(
    z.object({ code: z.string(), name: z.string(), byCategory: z.record(z.string(), z.number()) }),
  ),
  slowMovers: z.array(slowMoverSchema),
});
export type Valuation = z.infer<typeof valuationSchema>;
