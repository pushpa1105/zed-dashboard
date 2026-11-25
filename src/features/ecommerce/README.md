# E-commerce workspace

A back office for an online store: sales overview, orders and fulfilment, catalog, customers,
payments, returns, marketing and store configuration. Every page reads from a typed API layer
backed by an in-memory MSW mock, so mutations (refunds, notes, approvals, saved settings) persist
until the page is reloaded.

Feature id and i18n namespace: `ecommerce`. Base path: `/ecommerce`.

## Pages

| Page            | Route                              | What it shows                                                                                                              |
| --------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Overview        | `/ecommerce`                       | KPI cards, order rate, carrying costs, weekly performance, sales by channel, recent orders, top products                   |
| Orders          | `/ecommerce/orders`                | Server-side table: status tabs with counts, search, channel/payment filters, sorting, paging, bulk actions, CSV export     |
| Order detail    | `/ecommerce/orders/:orderId`       | Line items and totals, fulfilment and tracking, timeline with notes, refund dialog, mark shipped/delivered                 |
| Products        | `/ecommerce/products`              | Grid/list catalog with category, stock and sort filters                                                                    |
| Product editor  | `/ecommerce/products/:productId`   | React Hook Form + Zod editor: pricing and margin, variants, SEO, status, unsaved-changes bar                               |
| Categories      | `/ecommerce/categories`            | Category tree with reordering and storefront visibility                                                                    |
| Customers       | `/ecommerce/customers`             | Segment chips, search, lifetime value summary; rows open the customer profile                                              |
| Customer detail | `/ecommerce/customers/:customerId` | Lifetime value, 12-month spend chart, full order history, addresses, team notes                                            |
| Transactions    | `/ecommerce/transactions`          | 30-day volume chart, gross/refunds/fees/net, payout schedule and recent payouts, payments table with status/method filters |
| Returns         | `/ecommerce/returns`               | Return requests by status, approve / reject / refund actions, reasons breakdown chart                                      |
| Reviews         | `/ecommerce/reviews`               | Moderation queue with undoable approve/reject and a rating summary                                                         |
| Discounts       | `/ecommerce/discounts`             | Codes grouped by state, usage against limits, create-discount dialog                                                       |
| Gift cards      | `/ecommerce/gift-cards`            | Balance KPIs, issued vs redeemed by month, status tabs and search, issue-card dialog, detail sheet with redemption history |
| Abandoned carts | `/ecommerce/abandoned-carts`       | Recovery KPIs, weekly recovery rate against a goal, funnel, status tabs, send one or all recovery emails, cart sheet       |
| Sales reports   | `/ecommerce/reports`               | Period and channel filters, revenue trend by channel, channel and category split, top products, CSV export                 |
| Store settings  | `/ecommerce/settings`              | Tabs for general, shipping zones and rates, taxes and notifications; each tab is a Zod-validated form saved on its own     |

Filters that are worth sharing live in the URL (`/ecommerce/orders?status=pending`,
`/ecommerce/transactions?status=failed&method=paypal`, `/ecommerce/settings?tab=shipping`,
`/ecommerce/abandoned-carts?status=not_sent`, `/ecommerce/reports?period=7d&channel=online`).

## Folder layout

```
ecommerce/
  index.ts          manifest: nav, routes, i18n
  routes.ts         typed route table (ecommerceRoutes)
  pages/            one file per route; default export + optional `loader` that prefetches
  components/       building blocks used by the pages (settings/ holds the settings tab forms)
  api/              request functions, query keys, query options and mutation hooks
  model/            Zod schemas and inferred types
  lib/money.ts      currency formatting
  i18n/en.json, es.json
  __tests__/        render tests against the mock API
```

## API (mock endpoints)

All endpoints are served under `${API_URL}/ecommerce` by `src/mocks/handlers/ecommerce.ts`, which
also spreads in `ecommerce-gift-cards.ts`, `ecommerce-carts.ts` and `ecommerce-reports.ts`. The
shared seeded store (products, customers, orders…) lives in `ecommerce-store.ts`. Data is generated
from a seeded random generator, so it is identical on every load.

| Method   | Path                                   | Model / body                                                     |
| -------- | -------------------------------------- | ---------------------------------------------------------------- |
| GET      | `/dashboards/ecommerce/overview?year=` | `ecommerceOverviewSchema` (`model/overview.ts`)                  |
| GET      | `/orders`                              | `ordersPageSchema` (query: `OrdersSearch`)                       |
| PATCH    | `/orders`                              | `{ ids, status }`                                                |
| GET      | `/orders/:id`                          | `orderDetailSchema`                                              |
| POST     | `/orders/:id/refund`                   | `{ amount, reason, restock }`                                    |
| POST     | `/orders/:id/notes`                    | `{ text }`                                                       |
| GET      | `/products`, `/products/:id`           | `productsResponseSchema`, `productDetailSchema`                  |
| PUT      | `/products/:id`                        | `ProductForm`                                                    |
| GET      | `/categories`                          | `categorySchema[]`                                               |
| PATCH    | `/categories/:id`                      | `{ direction?, visible? }`                                       |
| GET      | `/customers`                           | `customersResponseSchema` (query: `q`, `segment`)                |
| GET      | `/customers/:id`                       | `customerDetailSchema` (profile, history, addresses, notes)      |
| POST     | `/customers/:id/notes`                 | `{ text }`                                                       |
| GET      | `/transactions`                        | `transactionsPageSchema` (query: `status`, `method`, `page`)     |
| GET      | `/payouts`                             | `payoutsSchema`                                                  |
| GET      | `/returns`                             | `returnsResponseSchema` (query: `status`)                        |
| PATCH    | `/returns/:id`                         | `{ status: 'approved' \| 'rejected' \| 'refunded' }`             |
| GET      | `/settings`                            | `storeSettingsSchema`                                            |
| PUT      | `/settings/:section`                   | one section of `StoreSettings`                                   |
| GET      | `/reviews`, PATCH `/reviews/:id`       | `reviewsResponseSchema`, `{ status }`                            |
| GET/POST | `/discounts`, PATCH `/discounts/:id`   | `discountSchema`, `DiscountForm`, `{ status }`                   |
| GET/POST | `/gift-cards`                          | `giftCardsResponseSchema` (query: `status`, `q`), `GiftCardForm` |
| GET      | `/gift-cards/:id`                      | `giftCardDetailSchema` (with redemptions)                        |
| PATCH    | `/gift-cards/:id`                      | `{ status: 'active'                                              | 'disabled' }` |
| GET      | `/abandoned-carts`                     | `cartsPageSchema` (query: `CartsSearch`)                         |
| POST     | `/abandoned-carts/recovery-emails`     | `{ ids? }` (omit `ids` to email every cart not contacted)        |
| GET      | `/reports/sales`                       | `salesReportSchema` (query: `period`, `channel`)                 |

The mock keeps related data consistent: the transactions ledger is derived from orders, so a
refund (from an order or an approved return) shows up as a refund transaction and lowers the next
payout. Gift card redemptions point at real orders, and sales reports are computed from the live
orders, so refunds lower report revenue too. Returns only move forward
(`requested → approved → refunded`, or `rejected`); other transitions answer `409`.

Models live in `model/store.ts` (orders, catalog, customers, reviews, discounts),
`model/finance.ts` (transactions, payouts, returns), `model/marketing.ts` (gift cards, abandoned
carts), `model/reports.ts` (sales report), `model/settings.ts` (store settings forms) and
`model/overview.ts`.

## Key components

- `CountTabs`: underline filter tabs with counts (orders, reviews, returns).
- `OrderStatusBadge`, `PaymentBadge`, `StockBadge`, `ProductThumb` (`components/store-badges.tsx`).
- `RefundDialog`: partial or full refund form, capped at the refundable amount.
- `NoteForm`: note composer shared by orders and customer profiles.
- `PayoutsCard`: next payout, schedule and recent payouts.
- `StatCards`: row of KPI tiles sharing one loading state.
- `ListTable`: card-framed table with skeleton rows, placeholder dimming and an empty slot.
- `GiftCardSheet`, `IssueGiftCardDialog`: gift card details/actions and the RHF + Zod issue form.
- `CartSheet`, `RecoveryEmailButton`: abandoned cart contents and the recovery email action.
- `ReportProductsCard`: top products of a sales report with revenue share.
- `SettingsCard`: wraps one settings section in a form with Zod validation and Save / Discard.

Shared UI comes from `@/shared/components/**` and `@/shared/ui/**` (charts, data table, forms,
status badges, empty and error states).

## Customizing

**Add a page**

1. Add the path to `routes.ts`.
2. Create `pages/<name>-page.tsx` with a default export and, if it loads data, a `loader` that
   prefetches the query.
3. Register it in `index.ts` under `workspace.routes` and, if it should appear in the sidebar, under
   `workspace.nav`.
4. Add strings to both `i18n/en.json` and `i18n/es.json` (a test checks that the keys match).

**Add an endpoint**

1. Describe the response in `model/` with Zod.
2. Add the request function, query key and hook in `api/`. Mutations declare
   `meta: { invalidates, successMessage }` so caches refresh and a toast appears automatically.
3. Add the mock handler to `src/mocks/handlers/ecommerce.ts`.

**Connect a real backend**

Point `VITE_APP_API_URL` at your server and set `VITE_APP_ENABLE_API_MOCKING=false` in `.env`. The request functions in `api/*.ts` call
`api.get/post/patch/put` with the same paths, and every response is parsed with its Zod schema, so a
shape mismatch fails loudly instead of rendering wrong data. Adjust a path or schema in `api/` or
`model/` if your backend differs; pages do not need to change.

**Theme**

Colors use theme tokens only (`primary`, `muted`, `success`, `chart-1..5`, …), so the workspace
follows light/dark mode and any palette you set in the theme.
