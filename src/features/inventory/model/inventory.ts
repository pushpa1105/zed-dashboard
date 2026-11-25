import { z } from 'zod';

export const STOCK_STATUSES = ['ok', 'low', 'out'] as const;
export type StockStatus = (typeof STOCK_STATUSES)[number];

export const itemRowSchema = z.object({
  sku: z.string(),
  name: z.string(),
  category: z.string(),
  unitCost: z.number(),
  onHand: z.number(),
  reserved: z.number(),
  available: z.number(),
  reorderPoint: z.number(),
  location: z.string(),
  warehouses: z.array(z.string()),
  status: z.enum(STOCK_STATUSES),
  lifecycle: z.enum(['active', 'discontinued']),
  supplier: z.string(),
  lastMovement: z.string(),
});
export type ItemRow = z.infer<typeof itemRowSchema>;

export const overviewSchema = z.object({
  stockValue: z.number(),
  units: z.number(),
  skuCount: z.number(),
  lowCount: z.number(),
  outCount: z.number(),
  turns: z.number(),
  valueTrend: z.array(z.number()),
  flow: z.array(z.object({ week: z.string(), inbound: z.number(), outbound: z.number() })),
  categories: z.array(z.object({ name: z.string(), value: z.number() })),
  warehouses: z.array(
    z.object({ code: z.string(), name: z.string(), used: z.number(), capacity: z.number() }),
  ),
  alerts: z.array(itemRowSchema),
  suggestions: z.array(
    z.object({
      sku: z.string(),
      name: z.string(),
      available: z.number(),
      reorderPoint: z.number(),
      quantity: z.number(),
      supplier: z.string(),
      supplierId: z.string(),
      leadTimeDays: z.number(),
      cost: z.number(),
    }),
  ),
});
export type Overview = z.infer<typeof overviewSchema>;

export const MOVEMENT_TYPES = [
  'receipt',
  'shipment',
  'transfer-in',
  'transfer-out',
  'adjustment',
  'count',
] as const;

export const movementSchema = z.object({
  id: z.string(),
  at: z.string(),
  sku: z.string(),
  type: z.enum(MOVEMENT_TYPES),
  warehouse: z.string(),
  quantity: z.number(),
  reference: z.string(),
  user: z.string(),
});
export type Movement = z.infer<typeof movementSchema>;

export const itemDetailSchema = itemRowSchema.extend({
  reorderQty: z.number(),
  autoReorder: z.boolean(),
  supplierId: z.string(),
  levels: z.array(
    z.object({
      warehouse: z.string(),
      warehouseName: z.string(),
      bin: z.string(),
      onHand: z.number(),
      reserved: z.number(),
    }),
  ),
  movements: z.array(movementSchema),
  suppliers: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      leadTimeDays: z.number(),
      onTimeRate: z.number(),
      unitCost: z.number(),
      preferred: z.boolean(),
    }),
  ),
});
export type ItemDetail = z.infer<typeof itemDetailSchema>;

export type ReorderSettings = {
  reorderPoint: number;
  reorderQty: number;
  supplierId: string;
  autoReorder: boolean;
};

export const warehouseSchema = z.object({
  code: z.string(),
  name: z.string(),
  city: z.string(),
  manager: z.string(),
  capacity: z.number(),
  used: z.number(),
  skuCount: z.number(),
  value: z.number(),
  zones: z.array(
    z.object({
      code: z.string(),
      name: z.string(),
      aisles: z.array(
        z.object({
          code: z.string(),
          bins: z.array(z.object({ code: z.string(), occupancy: z.number() })),
        }),
      ),
    }),
  ),
});
export type Warehouse = z.infer<typeof warehouseSchema>;

export const TRANSFER_STATUSES = ['requested', 'picking', 'in-transit', 'received'] as const;
export type TransferStatus = (typeof TRANSFER_STATUSES)[number];

export const transferSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  status: z.enum(TRANSFER_STATUSES),
  carrier: z.string(),
  requestedBy: z.string(),
  created: z.string(),
  eta: z.string(),
  lines: z.array(z.object({ sku: z.string(), name: z.string(), quantity: z.number() })),
});
export type Transfer = z.infer<typeof transferSchema>;

export type TransferInput = {
  from: string;
  to: string;
  carrier: string;
  lines: Array<{ sku: string; quantity: number }>;
};

export const receiptSchema = z.object({
  id: z.string(),
  po: z.string(),
  supplierId: z.string(),
  supplier: z.string(),
  warehouse: z.string(),
  expected: z.string(),
  status: z.enum(['open', 'partial', 'complete']),
  lines: z.array(
    z.object({ sku: z.string(), name: z.string(), expected: z.number(), received: z.number() }),
  ),
});
export type Receipt = z.infer<typeof receiptSchema>;

export const countSheetSchema = z.object({
  warehouse: z.string(),
  zone: z.string(),
  scheduled: z.string(),
  lines: z.array(
    z.object({
      bin: z.string(),
      sku: z.string(),
      name: z.string(),
      system: z.number(),
      unitCost: z.number(),
    }),
  ),
});
export type CountSheet = z.infer<typeof countSheetSchema>;

export const supplierSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  contact: z.string(),
  leadTimeDays: z.number(),
  onTimeRate: z.number(),
  fillRate: z.number(),
  openPOs: z.number(),
  spendYtd: z.number(),
  leadTimeTrend: z.array(z.number()),
  skuCount: z.number(),
});
export type Supplier = z.infer<typeof supplierSchema>;

/** Warehouse codes and names, used by selects across pages. */
export const WAREHOUSE_CODES = ['RNO', 'DFW', 'EWR', 'RTM'] as const;

export const movementRowSchema = movementSchema.extend({ name: z.string() });
export type MovementRow = z.infer<typeof movementRowSchema>;

export type MovementFilters = {
  type?: Movement['type'];
  warehouse?: string;
  from?: string;
  to?: string;
};

export const PO_STATUSES = ['draft', 'sent', 'partial', 'received'] as const;
export type PurchaseOrderStatus = (typeof PO_STATUSES)[number];

export const purchaseOrderSchema = z.object({
  id: z.string(),
  supplierId: z.string(),
  supplier: z.string(),
  warehouse: z.string(),
  status: z.enum(PO_STATUSES),
  created: z.string(),
  expected: z.string(),
  deliveredOn: z.string().nullable(),
  createdBy: z.string(),
  total: z.number(),
  lines: z.array(
    z.object({
      sku: z.string(),
      name: z.string(),
      quantity: z.number(),
      received: z.number(),
      unitCost: z.number(),
    }),
  ),
});
export type PurchaseOrder = z.infer<typeof purchaseOrderSchema>;

export type PurchaseOrderInput = {
  supplierId: string;
  warehouse: string;
  expected: string;
  status: 'draft' | 'sent';
  lines: Array<{ sku: string; quantity: number; unitCost: number }>;
};

export const reorderLineSchema = z.object({
  sku: z.string(),
  name: z.string(),
  category: z.string(),
  available: z.number(),
  onOrder: z.number(),
  reorderPoint: z.number(),
  reorderQty: z.number(),
  dailyUsage: z.number(),
  leadTimeDays: z.number(),
  unitCost: z.number(),
  supplierId: z.string(),
  supplier: z.string(),
});
export type ReorderLine = z.infer<typeof reorderLineSchema>;

export const supplierDetailSchema = supplierSchema.extend({
  email: z.string(),
  phone: z.string(),
  terms: z.string(),
  onTimeTrend: z.array(z.number()),
  items: z.array(
    itemRowSchema
      .pick({
        sku: true,
        name: true,
        category: true,
        unitCost: true,
        available: true,
        reorderPoint: true,
        status: true,
      })
      .extend({ preferred: z.boolean() }),
  ),
  purchaseOrders: z.array(purchaseOrderSchema),
});
export type SupplierDetail = z.infer<typeof supplierDetailSchema>;
