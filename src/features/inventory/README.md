# Inventory workspace

A multi-warehouse inventory and purchasing dashboard: stock levels, movements, transfers,
receiving, cycle counts, purchase orders, reorder planning and supplier performance. It runs
entirely on the bundled mock API, so every page works out of the box, and every mutation
(adjustments, transfers, receipts, counts, purchase orders) updates the in-memory data until
the page reloads.

## Pages

| Page             | Route                              | Demonstrates                                                                                                                                       |
| ---------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Overview         | `/inventory`                       | KPI cards, inbound/outbound area chart, warehouse capacity meters, stock alerts, reorder suggestions                                               |
| Items            | `/inventory/items`                 | Full data table: faceted filters, pinned/hidden columns, density, CSV export, bulk stock adjustment                                                |
| Item detail      | `/inventory/items/:sku`            | Stock by location, movement ledger, supplier comparison, reorder rules form                                                                        |
| Stock counts     | `/inventory/counts`                | Cycle count sheet with live variance and tolerance checks; posting creates adjustments                                                             |
| Batches & expiry | `/inventory/batches`               | Lot-tracked stock with received/expiry dates, days-to-expiry badges, expiry window tabs (kept in the URL), expiry outlook chart, quarantine action |
| Stock valuation  | `/inventory/valuation`             | FIFO/average toggle, value trend, value by category and by warehouse, slow-moving and dead stock table with CSV export                             |
| Transfers        | `/inventory/transfers`             | Status board (requested → picking → in transit → received), create-transfer dialog with line items                                                 |
| Receiving        | `/inventory/receiving`             | Check inbound orders at the dock, scan SKUs, post full or partial receipts                                                                         |
| Stock movements  | `/inventory/movements`             | Audit ledger of every movement, filters by type/warehouse/date (kept in the URL), weekly stacked trend, CSV export                                 |
| Purchase orders  | `/inventory/purchase-orders`       | PO list with status tabs and KPIs; create-PO dialog (React Hook Form + Zod field array), save as draft or send                                     |
| Reorder planner  | `/inventory/reorder`               | Items below reorder point, suggested quantities from daily usage and lead time, bulk "create PO from selection"                                    |
| Warehouses       | `/inventory/warehouses`            | Capacity per site, zone/aisle/bin layout heatmap                                                                                                   |
| Bin locations    | `/inventory/bins`                  | Warehouse picker, aisle/rack/bin map shaded by fill; a bin opens a sheet with its contents and a move-stock form                                   |
| Suppliers        | `/inventory/suppliers`             | Lead-time ranking and trend, on-time and fill rates, spend                                                                                         |
| Supplier detail  | `/inventory/suppliers/:supplierId` | Profile, KPIs, lead-time and on-time charts, supplied items, recent purchase orders                                                                |

Useful deep links: `/inventory/items?status=low`, `/inventory/items?warehouse=DFW`,
`/inventory/batches?window=30`, `/inventory/bins?warehouse=RTM`, `/inventory/valuation?method=average`,
`/inventory/movements?type=receipt&warehouse=RNO&from=2026-10-01`,
`/inventory/purchase-orders?new=1&supplier=SUP-101` (opens the create dialog for that supplier).

### How the pages connect

- Sending a purchase order (from the dialog or the **Send** button on a draft) adds it to
  **Receiving**. Posting that receipt updates the PO to partially received or received and
  writes `receipt` movements to the ledger.
- The reorder planner creates one draft PO per supplier for the selected items.
- Moving stock between bins updates the item's stock locations (item detail, cycle counts, bin map).
  Bin fill compares stock with a slot sized at three reorder points per SKU.
- Valuation: dead stock has no sale in 45 days (or is discontinued); slow stock has more than 365
  days of cover at its daily usage. FIFO values stock at the latest purchase prices.
- Suggested quantity = daily usage × (lead time + cover days) − available − on order, and at
  least the item's reorder quantity. Daily usage is the average shipped per day over the last
  84 days; "on order" counts sent and partially received POs.

## Mock API

Handlers live in `src/mocks/handlers/inventory.ts` (batches, bins and valuation in
`inventory-stock.ts`); seeded data (deterministic, see `seeded()`)
in `src/mocks/handlers/inventory-data.ts`. All paths are under `${API_URL}/inventory`.

| Method   | Path                                    | Response schema                     |
| -------- | --------------------------------------- | ----------------------------------- |
| GET      | `/overview`                             | `overviewSchema`                    |
| GET      | `/items?warehouse=`                     | `itemRowSchema[]`                   |
| GET      | `/items/:sku`                           | `itemDetailSchema`                  |
| PATCH    | `/items/:sku`                           | reorder settings                    |
| POST     | `/adjustments`                          | `{ updated }`                       |
| GET      | `/warehouses`                           | `warehouseSchema[]`                 |
| GET/POST | `/transfers`                            | `transferSchema`                    |
| PATCH    | `/transfers/:id`                        | `transferSchema`                    |
| GET      | `/receipts`                             | `receiptSchema[]`                   |
| POST     | `/receipts/:id/receive`                 | `receiptSchema`                     |
| GET/POST | `/counts`                               | `countSheetSchema` / `{ adjusted }` |
| GET      | `/movements?type=&warehouse=&from=&to=` | `movementRowSchema[]`               |
| GET      | `/purchase-orders`                      | `purchaseOrderSchema[]`             |
| POST     | `/purchase-orders`                      | `purchaseOrderSchema`               |
| POST     | `/purchase-orders/:id/send`             | `purchaseOrderSchema`               |
| GET      | `/reorder-plan`                         | `reorderLineSchema[]`               |
| GET      | `/batches`                              | `batchSchema[]`                     |
| POST     | `/batches/:id/quarantine`               | `batchSchema`                       |
| GET      | `/bins?warehouse=`                      | `binLayoutSchema`                   |
| GET      | `/bins/:warehouse/:bin`                 | `binDetailSchema`                   |
| POST     | `/bins/move`                            | `{ moved }`                         |
| GET      | `/valuation?method=`                    | `valuationSchema`                   |
| GET      | `/suppliers`                            | `supplierSchema[]`                  |
| GET      | `/suppliers/:id`                        | `supplierDetailSchema`              |

Schemas and input types are in `model/inventory.ts` and `model/stock.ts`. Every response is parsed with its Zod
schema, so a backend that drifts from the contract fails loudly in development.

## Structure

```
inventory/
  index.ts          manifest: nav, routes, translations
  routes.ts         typed route table (inventoryRoutes.supplier.href({ supplierId }))
  api/              API functions, query keys, queryOptions, hooks and mutations
  model/            Zod schemas and types
  pages/            one file per route (default export + optional loader)
  components/       dialogs, column definitions, badges shared by pages
  lib/              formatting and small domain helpers
  i18n/             en.json, es.json (same keys; a test enforces parity)
```

Key components:

- `create-purchase-order-dialog.tsx`, `create-transfer-dialog.tsx`, `adjust-stock-dialog.tsx`: forms that post to the API.
- `item-columns.tsx`, `purchase-order-columns.tsx`, `movement-columns.tsx`, `reorder-columns.tsx`: data-table column sets (`sortable()` in `sortable-header.tsx` builds the sortable headers).
- `batch-columns.tsx`, `valuation-columns.tsx`: batch and slow-mover tables; `bin-cell.tsx` (bin square + fill legend, shared by the warehouses and bin pages) and `bin-sheet.tsx` (bin contents and move form).
- `movement-type.tsx`, `stock-status-badge.tsx`, `po-status-badge.tsx`: consistent labels and tones.
- `error-panel.tsx`: the retry state used by every page.

## Customizing

**Add a page**

1. Add a route to `routes.ts`.
2. Create `pages/<name>-page.tsx` with a default-exported component (wrap it in `Page`) and,
   if it loads data, a `loader` that prefetches the query.
3. Register it in `index.ts` under `workspace.routes`, and add a `nav` entry if it should
   appear in the sidebar.
4. Add its strings to both `i18n/en.json` and `i18n/es.json`.

**Add an endpoint**: add a schema to `model/`, a function, key and hook to
`api/inventory-api.ts`, and a handler to `src/mocks/handlers/inventory.ts`. Mutations declare
`meta: { invalidates, successMessage | errorMessage }`; the app's query client handles cache
invalidation and toasts.

**Use a real backend**: point `API_URL` at your server and turn off the mock service worker
(see `docs/mock-backend.md`). Nothing in the pages changes as long as your endpoints return the
shapes in `model/inventory.ts`. If they differ, adapt them in `api/inventory-api.ts` and keep
the schemas as the contract.

**Change currency, warehouses or reorder rules**: currency and number formats are in
`lib/format.ts`; warehouse codes for selects are `WAREHOUSE_CODES` in `model/inventory.ts`; the
reorder formula is `plan()` in `pages/reorder-page.tsx`.
