import { defineRoute } from '@/core/config/routes';

/** Routes of the Inventory workspace. Every path starts with the workspace prefix. */
export const inventoryRoutes = {
  overview: defineRoute('/inventory'),
  items: defineRoute('/inventory/items'),
  item: defineRoute('/inventory/items/:sku'),
  counts: defineRoute('/inventory/counts'),
  batches: defineRoute('/inventory/batches'),
  valuation: defineRoute('/inventory/valuation'),
  transfers: defineRoute('/inventory/transfers'),
  receiving: defineRoute('/inventory/receiving'),
  movements: defineRoute('/inventory/movements'),
  purchaseOrders: defineRoute('/inventory/purchase-orders'),
  reorder: defineRoute('/inventory/reorder'),
  warehouses: defineRoute('/inventory/warehouses'),
  bins: defineRoute('/inventory/bins'),
  suppliers: defineRoute('/inventory/suppliers'),
  supplier: defineRoute('/inventory/suppliers/:supplierId'),
} as const;
