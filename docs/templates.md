# Templates

zed-dashboard ships **9 dashboard workspaces** (complete products, each with its own page layout),
**6 apps**, a **component library** with showcase pages, **page templates** and **5 landing
pages**. Each one is a normal feature module, so you can keep what you need and delete the rest.

## Dashboard workspaces

A workspace is a full product: its own URL prefix, menu, pages and **shell layout**. Use the
switcher at the top of the menu (or ⌘K) to move between them.

| Workspace                                         | URL          | Layout         | Pages | Pages (examples)                                                                                                                                                                                                         |
| ------------------------------------------------- | ------------ | -------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [E-commerce](../src/features/ecommerce/README.md) | `/ecommerce` | Sidebar        | 16    | Overview, orders + detail, abandoned carts, returns, transactions, products + editor, categories, customers + detail, reviews, discounts, gift cards, sales reports, store settings                                      |
| [Analytics](../src/features/analytics/README.md)  | `/analytics` | Top nav + tabs | 16    | Overview, realtime, audience, geography, devices & technology, acquisition, campaigns, pages, events, funnels, retention, goals, A/B experiments + detail, reports, alerts                                               |
| [CRM](../src/features/crm/README.md)              | `/crm`       | Dual sidebar   | 19    | Overview, pipeline, deals + detail, leads inbox, quotes + builder, price book, people, contact, companies + detail, activity feed, email sequences, tasks, meetings, forecast, reports, settings                         |
| [ERP](../src/features/erp/README.md)              | `/erp`       | Boxed          | 19    | Finance overview, accounts, journal, bank reconciliation, fixed assets, receivables, sales orders, invoices, payables, vendors, purchase orders + detail, expense claims, budgets, cash flow forecast, projects, reports |
| [Inventory](../src/features/inventory/README.md)  | `/inventory` | Dark sidebar   | 15    | Overview, items + detail, batches & expiry, bin locations, warehouses, transfers, receiving, counts, stock movements, valuation, purchase orders, reorder planner, suppliers + detail                                    |
| [HR](../src/features/hr/README.md)                | `/hr`        | Icon rail      | 18    | Overview, directory + profile, org chart, onboarding, recruitment + job + candidate, time off, attendance, payroll + pay run, benefits, performance, training, engagement surveys, documents & policies, settings        |
| [Academy](../src/features/academy/README.md)      | `/academy`   | Top nav        | 17    | Learner home, catalog, course + builder, lesson player, quiz, assignments + grading, discussions + thread, schedule, live sessions, students + profile, certificates, instructors, reports                               |
| [Logistics](../src/features/logistics/README.md)  | `/logistics` | Floating       | 15    | Live map overview, dispatch board, shipments + tracking, fleet + vehicle, drivers + profile, routes, docks, exceptions, carriers, customer SLAs, freight billing, performance reports                                    |
| [SaaS](../src/features/saas/README.md)            | `/saas`      | Inset          | 16    | Overview, usage, customers + detail, status & incidents, support inbox, integrations, API keys, webhooks, logs, feature flags, billing, team, roles & permissions, audit log, settings                                   |

Each linked README lists every route, the mock endpoints and the main components. Each workspace
owns its whole stack:

```
src/features/<workspace>/
├── index.ts        manifest: `workspace: { basePath, layout, nav, routes, … }` + translations
├── routes.ts       the workspace's typed route table (all under its base path)
├── model/          Zod schemas → types
├── api/            request functions + TanStack Query options/hooks
├── components/     widgets specific to this workspace
├── pages/          one file per page (+ loaders that prefetch)
├── i18n/           en.json, es.json
└── __tests__/      smoke tests
src/mocks/handlers/<workspace>.ts   its mock API (MSW)
```

Workspaces only import from `core/` and `shared/`, never from each other.

### Layouts

The shell around a workspace is chosen by `layout` in its manifest:

| Layout         | Structure                                                          |
| -------------- | ------------------------------------------------------------------ |
| `sidebar`      | Collapsible sidebar with nested, collapsible sections              |
| `sidebar-dark` | The same on a dark surface                                         |
| `inset`        | Content as a rounded card next to the sidebar                      |
| `floating`     | Detached sidebar card                                              |
| `rail`         | Slim dark icon rail; entries with children open flyout menus       |
| `dual`         | A rail of sections plus a panel listing the chosen section's pages |
| `topnav`       | Horizontal menu; dropdowns, and mega panels for large groups       |
| `topnav-tabs`  | Header bar plus an underline tab row                               |
| `boxed`        | Centered frame on a tinted canvas with the menu inside the frame   |

The theme panel's **Layout** option can force one layout on every workspace (`Auto` keeps each
one's own). The **Layouts** page (`/app/ui/layouts`) shows them all with wireframes.

### Menus

A workspace menu is a list of sections (`NavSection`), each with entries (`NavNode`). Entries
nest to any depth and support `icon`, `badge` (count or tag, optionally translated and toned),
`disabled`, `external`, `description` (shown in mega menus) and `roles`. Breadcrumbs, the
mobile menu and ⌘K search are generated from the same data.

## Keep only what you need

```bash
npm run template:keep -- --list                       # workspaces and other modules
npm run template:keep -- crm --dry-run                # preview
npm run template:keep -- crm                          # keep CRM, remove the other workspaces
npm run template:keep -- crm erp --home               # keep two, land on CRM after sign-in
npm run template:keep -- crm --strip-showcases        # also remove the component showcases
npm run template:keep -- crm --remove app-chat,app-mail   # also remove any listed modules
npm run check
```

The script deletes the removed feature folders and their mock files and removes their lines from
`src/app/modules.ts`, `src/app/i18n-resources.d.ts` and `src/mocks/handlers/index.ts`.
`--home` points `HOME_AFTER_LOGIN` at the first kept workspace.

The shared components stay in `src/shared/components/` either way; delete the ones you don't use.

## Apps (inside the main app)

| App      | URL             | What it is                                                           |
| -------- | --------------- | -------------------------------------------------------------------- |
| Chat     | `/app/chat`     | Conversations, threads, attachments, typing indicator, details panel |
| Mail     | `/app/mail`     | Folders and labels, message list with bulk actions, reader, compose  |
| Calendar | `/app/calendar` | Month, week, day and agenda views; create and edit events            |
| Kanban   | `/app/kanban`   | Boards, drag and drop, WIP limits, card details, swimlanes           |
| Files    | `/app/files`    | Folder tree, grid/list, upload, rename, preview, storage meter       |
| Invoices | `/app/invoices` | List, editor with line items, printable invoice                      |
| Tasks    | `/app/tasks`    | The original CRUD example                                            |

## Components and showcases

Reusable components live in `src/shared/components/` and know nothing about this app (no
translations, no API calls):

| Folder        | Contents                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| `charts/`     | Area, line, bar, donut, radial, radar, sparkline, gauge, progress ring, heatmap                              |
| `dashboard/`  | `SectionCard`, `StatCard`, `StatStrip`, `TrendBadge`, `MeterList`                                            |
| `widgets/`    | 25 dashboard widgets (goals, leaderboard, status, todo, balance card, NPS…)                                  |
| `data-table/` | TanStack Table v9 kit: server/client modes, filters, resizing, pinning, virtual rows, spreadsheet, tree data |
| `forms/`      | Multi-select, async autocomplete, tree select, date pickers, masks, rich text, signature, uploads, wizard…   |
| `display/`    | Tags, badges, avatars, kanban, empty/error states, cards, code block…                                        |
| `tree/`       | Tree view, file tree, tree table, org chart                                                                  |
| `timeline/`   | Vertical, alternating, horizontal, roadmap, changelog, order tracking…                                       |
| `navigation/` | Tab variants, nested menu, mega menu, breadcrumbs, pagination                                                |

Showcase pages (sidebar → Components / Apps):

| Area           | Pages                                                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Forms          | `/app/ui/forms`, `selects`, `overlays`, `form-layouts`, `auth-forms`, `inputs`                                                          |
| Elements       | `/app/ui/data-display`, `charts`, `feedback`, `navigation`, `menus`, `trees`, `timelines`, `widgets`, `layouts`                         |
| Data tables    | `/app/tables` (server), `client`, `grid` (AG Grid), `spreadsheet`, `tree`, `master-detail`, `infinite`, `views`, `reorder`, `financial` |
| Page templates | `/app/pages` gallery: auth variants, error and status pages, pricing, profile, account settings, help center, onboarding                |

## Landing pages and previews

The `landing` feature owns the public pages: `/` (product, with a **Templates** section),
`/templates` (full gallery with filters), `/landing/startup`, `/landing/product`,
`/landing/agency` and `/landing/ai`.

Every template card has **Live preview**, which links to
`/login?demo=admin&redirectTo=<workspace>` and signs the visitor in automatically. While the mock
API is on, the sign-in form is also prefilled and offers one-click "Admin demo" / "Member demo"
buttons (configured in `siteConfig.demo`).

Preview images live in `public/previews/<workspace>.png`. Regenerate them after changing a
workspace (dev server running):

```bash
node scripts/capture-previews.mjs            # every workspace
node scripts/capture-previews.mjs crm erp    # some
```

## Connecting a real API

Every screen talks to the mock backend through normal HTTP calls (`api.get(url, schema)`). To use
your backend, implement the same endpoints (see the workspace's mock file) or change the URLs in
its `api/` folder, keep or adapt the Zod schemas in `model/`, then set
`VITE_APP_ENABLE_API_MOCKING=false` and `VITE_APP_API_URL` in `.env`.

## Customizing the look

The theme panel (palette icon) changes mode, color preset, brand color, radius, font, density and
layout; "Copy CSS" exports the result. Controls use one size scale (36px default, 32px small,
40px large) and cards use 24px padding, so pages stay consistent when you add your own. See
[Theming](theming.md).
