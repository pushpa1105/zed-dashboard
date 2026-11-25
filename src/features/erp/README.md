# ERP workspace

A finance and operations back office for a mid-size product company: general ledger, receivables,
purchasing, fixed assets, expenses and planning. It runs under `/erp` with the boxed layout and is
self-contained: its own pages, API layer, Zod models, translations (EN/ES) and MSW mock API.

## Pages

| Page                 | Route                            | What it shows                                                                                                    |
| -------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Overview             | `/erp`                           | KPI row, cash-flow bars, formation tracker, payment success gauge, recent activity                               |
| Chart of accounts    | `/erp/accounting/accounts`       | Expandable account tree with a live trial-balance check                                                          |
| Journal entries      | `/erp/accounting/journal`        | Posted and draft postings with expandable lines                                                                  |
| New journal entry    | `/erp/accounting/journal/new`    | Dynamic debit/credit form (React Hook Form + Zod) that only posts when balanced                                  |
| Bank reconciliation  | `/erp/accounting/reconciliation` | Bank statement vs ledger side by side, match/unmatch, reconciled balance and difference                          |
| Fixed assets         | `/erp/accounting/fixed-assets`   | Asset register, book values, depreciation schedule chart, add-asset dialog                                       |
| Financial statements | `/erp/accounting/reports`        | P&L and balance sheet with collapsible sections and period columns                                               |
| Invoices             | `/erp/sales/invoices`            | Receivables aging (clickable buckets) and invoice list                                                           |
| Invoice              | `/erp/sales/invoices/:invoiceId` | Printable invoice, payment recording, reminders, activity                                                        |
| Receivables          | `/erp/sales/receivables`         | Customer balances by aging bucket, stacked aging chart, reminders, statement sheet (`?view=overdue\|critical`)   |
| Sales orders         | `/erp/sales/orders`              | Quote → confirmed → fulfilled → invoiced, confirm / create-invoice actions, detail sheet with lines (`?status=`) |
| Bills & POs          | `/erp/purchasing/payables`       | Approval queue with a draft → submitted → approved → paid workflow                                               |
| Purchase orders      | `/erp/purchase-orders`           | PO list by status (draft/approved/received/closed), commitments KPIs, inline approval                            |
| Purchase order       | `/erp/purchase-orders/:poId`     | Line items with per-line receiving progress, next-step action (approve/receive/close), history                   |
| Expense claims       | `/erp/purchasing/expense-claims` | Review queue, spend by category, detail sheet with receipt previews, approve/reject with reason                  |
| Vendors              | `/erp/purchasing/vendors`        | Supplier directory with spend mix and performance                                                                |
| Budgets              | `/erp/planning/budgets`          | Budget vs actual per department and quarter                                                                      |
| Cash flow forecast   | `/erp/planning/cash-forecast`    | 13-week inflow/outflow/net and running balance, base/optimistic/pessimistic scenarios, expected items            |
| Projects             | `/erp/planning/projects`         | Project portfolio, operations and summary widgets                                                                |

Every page has loading skeletons, an error state with retry, an empty state, and a responsive
layout from phone width to 1440px. Pages export a `loader` that prefetches their query.

## Code layout

```
erp/
  index.ts            manifest: nav, routes, i18n
  routes.ts           typed route definitions (erpRoutes)
  pages/              one file per route (default export + optional loader)
  api/erp-api.ts      ledger, receivables, payables, vendors
  model/erp.ts        Zod schemas for the above
  sales/              receivables and sales orders (api, model, StatementSheet, OrderSheet…)
  treasury/           13-week cash forecast (api, model, ForecastCharts)
  operations/         purchase orders, reconciliation, fixed assets, expense claims
    api/              operations-api.ts: requests, query keys, queries, mutations
    model/            operations.ts: Zod schemas, poTotals()
    components/       AddAssetDialog, ClaimSheet, ReconciliationList, StatusTabs,
                      PoStatusBadge, ReceivingProgress
  finance/, projects/ overview and projects dashboards (own api/model/components)
  components/         ErrorPanel, ListFilters, TableSkeleton, EmptyRow
  lib/                money.ts (currency, dates), aging.ts (bucket colors)
  i18n/en.json, es.json
```

## API (mock)

All endpoints are served by MSW from `src/mocks/handlers/erp*.ts` (composed in `erp.ts`). Data is
generated from a seeded RNG, so it is identical on every load; mutations are kept in memory until
reload.

| Method | Endpoint                                    | Model / body                                                          |
| ------ | ------------------------------------------- | --------------------------------------------------------------------- |
| GET    | `/erp/accounts`, `/erp/accounts/leaves`     | `accountNodeSchema`, `accountOptionSchema`                            |
| GET    | `/erp/journal` · POST `/erp/journal`        | `journalEntrySchema`                                                  |
| GET    | `/erp/budgets?quarter=`                     | `budgetsSchema`                                                       |
| GET    | `/erp/reports/:pnl\|balance`                | `statementSchema`                                                     |
| GET    | `/erp/invoices`, `/erp/invoices/:id`        | `invoicesResponseSchema`, `invoiceDetailSchema`                       |
| POST   | `/erp/invoices/:id/actions`                 | `{ action: 'remind' \| 'payment', amount? }`                          |
| GET    | `/erp/payables` · PATCH `/erp/payables/:id` | `payableSchema`, `{ action, note? }`                                  |
| GET    | `/erp/vendors`                              | `vendorSchema`                                                        |
| GET    | `/erp/purchase-orders`, `/:id`              | `purchaseOrderSchema`                                                 |
| PATCH  | `/erp/purchase-orders/:id`                  | `{ action: 'approve' \| 'receive' \| 'close' }` (409 if not allowed)  |
| GET    | `/erp/reconciliation`                       | `reconciliationSchema`                                                |
| POST   | `/erp/reconciliation/matches`               | `{ statementId, ledgerId }`; amounts must be equal (422)              |
| DELETE | `/erp/reconciliation/matches/:statementId`  | returns the updated `reconciliationSchema`                            |
| GET    | `/erp/assets` · POST `/erp/assets`          | `assetSchema`; body `assetInputSchema`, schedule computed server-side |
| GET    | `/erp/expense-claims`                       | `expenseClaimSchema`                                                  |
| PATCH  | `/erp/expense-claims/:id`                   | `{ action: 'approve' \| 'reject', note? }`                            |
| GET    | `/erp/receivables`                          | `customerBalanceSchema` (open invoices per customer)                  |
| POST   | `/erp/receivables/:id/reminders`            | reminds every overdue invoice (409 if none)                           |
| GET    | `/erp/sales-orders`                         | `salesOrderSchema`                                                    |
| PATCH  | `/erp/sales-orders/:id`                     | `{ action: 'confirm' \| 'invoice' }`; invoicing adds an open invoice  |
| GET    | `/erp/cash-forecast?scenario=`              | `cashForecastSchema` (weeks and items, built from open invoices)      |

Depreciation uses a full-year convention: straight-line spreads `cost − salvage` evenly;
declining balance is double-declining, floored at salvage, with the remainder in the last year.

## Customizing

**Add a page**

1. Define the route in `routes.ts`.
2. Create `pages/<name>-page.tsx` with a default-export component wrapped in `Page` and, if it
   fetches data, a `loader` that calls `queryClient.prefetchQuery(...)`.
3. Register it in `index.ts` under `workspace.routes`, and add a `nav` entry (detail routes with
   params need no nav entry; link to them from their list page).
4. Add its strings to both `i18n/en.json` and `i18n/es.json`. A test fails if the keys differ.

**Add an endpoint**: add a Zod schema in the relevant `model/` file, a request in the `api/` file
(`api.get(url, schema)`), a query key and `queryOptions`, and for writes a `useMutation` with
`meta: { invalidates, successMessage, errorMessage }` so caches refresh and toasts show
automatically.

**Use a real backend**: set `VITE_APP_API_URL` to your server and `VITE_APP_ENABLE_API_MOCKING=false`.
The UI only depends on the request functions in `api/`; responses are validated by the Zod
schemas, so a mismatched payload fails loudly. Remove `erpHandlers` from the mock registry when
it is no longer needed.

**Theming**: colors come from design tokens only (`bg-primary`, `text-success`, `var(--chart-1)`
…), so presets and dark mode apply everywhere. Do not use Tailwind palette or hex colors; a test
enforces this.
