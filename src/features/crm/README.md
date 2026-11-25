# CRM workspace

A sales CRM for a small-to-mid B2B team: pipeline and deals, accounts and contacts, lead triage,
outreach sequences, activities, forecasting and reporting. It mounts at `/crm` and uses the `dual`
shell: each nav section is an icon in the left rail, and its pages open in the panel next to it.

Everything lives in `src/features/crm`. The mock API is in `src/mocks/handlers/crm*.ts`.

## Pages

| Route                       | Page              | What it demonstrates                                                                                                                          |
| --------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `/crm`                      | Sales overview    | Quota attainment, KPI cards, pipeline by stage, forecast vs target chart, leaderboard, deals closing soon                                     |
| `/crm/pipeline`             | Pipeline          | Drag-and-drop kanban with optimistic stage moves, filters, and a quick-add deal dialog                                                        |
| `/crm/deals`                | All deals         | Data table with sorting, faceted filters, column visibility, pagination and CSV export                                                        |
| `/crm/deals/:dealId`        | Deal detail       | Stage progress, contacts, line items, activity timeline, notes with a mutation                                                                |
| `/crm/quotes`               | Quotes            | Acceptance KPIs, status chips synced to `?status=` (the "Awaiting reply" nav link), quotes table with expiry flags, "new quote" dialog        |
| `/crm/quotes/:quoteId`      | Quote builder     | Editable line items from the price book, discount and tax with live totals, save draft, mark as sent / accepted / declined                    |
| `/crm/products`             | Price book        | Catalog KPIs, margin by category chart, search and filters, active toggle, create/edit dialog (React Hook Form + Zod)                         |
| `/crm/people`               | People            | Contact table with status and tags                                                                                                            |
| `/crm/companies`            | Companies         | Filterable account cards; each card links to the company page                                                                                 |
| `/crm/companies/:companyId` | Company detail    | Firmographics, account KPIs, open deals, contacts at the company, activity timeline                                                           |
| `/crm/contacts/:contactId`  | Contact detail    | Profile sidebar with tabs for activity, emails, deals and files                                                                               |
| `/crm/leads`                | Leads inbox       | Status filter chips, search, source filter, lead score, row actions and bulk selection to qualify, disqualify or convert leads into deals     |
| `/crm/activity`             | Activity feed     | Team timeline of calls, emails, meetings, notes and stage changes; type/owner/date filters, activity by day and by rep, "log activity" dialog |
| `/crm/tasks`                | Tasks             | Tasks grouped by due date, toggled optimistically                                                                                             |
| `/crm/meetings`             | Calls & meetings  | Agenda of upcoming and past calls, plus a "log a call" form                                                                                   |
| `/crm/sequences`            | Email sequences   | Sequence cards with step chains, enrolment and open/reply rates; a side-sheet editor (React Hook Form + Zod, dynamic step list)               |
| `/crm/reports`              | Win/loss report   | Win rate and cycle trends, source attribution, loss reasons, per-rep stats                                                                    |
| `/crm/forecast`             | Forecast & quotas | Commit / best case / pipeline by month (stacked bar chart), quarter outlook against team quota, rep leaderboard with quota attainment         |
| `/crm/settings`             | Pipeline settings | Stage probabilities and hygiene rules form                                                                                                    |

Every page has a `loader` that prefetches its query, a skeleton while loading, an inline error with
retry, and an empty state where a list can be empty.

## Data layer

- `model/crm.ts`: Zod schemas and the types inferred from them. Responses are parsed with these
  schemas, so a backend that drifts from the contract fails loudly.
- `model/quotes.ts`, `model/activity.ts`: price book, quotes (with `quoteTotals`) and the activity feed.
- `api/crm-api.ts`: `crmApi` (one function per endpoint), `crmKeys` (query keys), `*Query`
  option factories used by loaders, and `use*` hooks. Mutations declare
  `meta: { invalidates, successMessage }` so cache refreshes and toasts are handled globally.
  `api/quotes-api.ts` and `api/activity-api.ts` follow the same pattern.

### Endpoints

| Method | Path                   | Schema                                                  |
| ------ | ---------------------- | ------------------------------------------------------- |
| GET    | `/crm/overview`        | `overviewSchema`                                        |
| GET    | `/crm/deals`           | `dealSchema[]`                                          |
| POST   | `/crm/deals`           | body `newDealSchema` → `dealSchema`                     |
| GET    | `/crm/deals/:id`       | `dealDetailSchema`                                      |
| PATCH  | `/crm/deals/:id`       | body `{ stage }` → `dealSchema`                         |
| POST   | `/crm/deals/:id/notes` | body `{ body }` → `noteSchema`                          |
| GET    | `/crm/people`          | `personSchema[]`                                        |
| GET    | `/crm/companies`       | `companyRowSchema[]`                                    |
| GET    | `/crm/companies/:id`   | `companyDetailSchema`                                   |
| GET    | `/crm/contacts/:id`    | `contactDetailSchema`                                   |
| GET    | `/crm/leads`           | `leadSchema[]`                                          |
| POST   | `/crm/leads/actions`   | body `{ ids, action }` → `leadSchema[]` (changed leads) |
| GET    | `/crm/sequences`       | `sequenceSchema[]`                                      |
| POST   | `/crm/sequences`       | body `sequenceInputSchema` → `sequenceSchema`           |
| PUT    | `/crm/sequences/:id`   | body `sequenceInputSchema` → `sequenceSchema`           |
| GET    | `/crm/forecast`        | `forecastSchema`                                        |
| GET    | `/crm/tasks`           | `taskSchema[]`                                          |
| PATCH  | `/crm/tasks/:id`       | body `{ done }` → `taskSchema`                          |
| GET    | `/crm/meetings`        | `meetingSchema[]`                                       |
| POST   | `/crm/calls`           | body `logCallSchema` → `meetingSchema`                  |
| GET    | `/crm/products`        | `productSchema[]`                                       |
| POST   | `/crm/products`        | body `productInputSchema` → `productSchema`             |
| PATCH  | `/crm/products/:id`    | body partial `productInputSchema` → `productSchema`     |
| GET    | `/crm/quotes`          | `quoteSchema[]`                                         |
| GET    | `/crm/quotes/:id`      | `quoteSchema`                                           |
| POST   | `/crm/quotes`          | body `newQuoteSchema` → `quoteSchema` (draft)           |
| PUT    | `/crm/quotes/:id`      | body `quoteDraftSchema` → `quoteSchema` (drafts only)   |
| PATCH  | `/crm/quotes/:id`      | body `{ status }` → `quoteSchema`                       |
| GET    | `/crm/activity`        | `feedItemSchema[]`                                      |
| POST   | `/crm/activity`        | body `logActivitySchema` → `feedItemSchema`             |
| GET    | `/crm/reports`         | `reportsSchema`                                         |

The mock seeds its data with a fixed random seed, so every reload looks the same. Mutations change
the in-memory data until the page reloads. Converting a lead creates a deal in the Qualified stage
(and the company, if it is new), so it shows up in the pipeline, deals table and forecast.
Accepting a quote marks its deal as won. Quotes, products and the activity feed live in
`crm-quotes.ts` and `crm-activity.ts`, seeded from the same deals; `crm-seed.ts` holds the shared
seeding helpers.

## Key components

- `components/crm-parts.tsx`: `WidgetError`, `StageBadge`, `CompanyMark` (initials logo),
  `QuoteStatusBadge`, `QuoteExpiry`, `FilterChips` (status chips with counts).
- `components/leads-table.tsx`: selectable leads table with row actions and lead score.
- `components/sequence-sheet.tsx`: create/edit sequence sheet with a dynamic step list.
- `components/quote-builder.tsx`, `components/quote-lines.tsx`: the quote form with live totals.
- `components/activity-timeline.tsx`: feed grouped by day.
- `components/forecast-leaderboard.tsx`: rep ranking with quota attainment bars.
- `components/new-deal-dialog.tsx`, `components/log-call-dialog.tsx`: form dialogs.
- `lib/format.ts`: currency, date and relative-time helpers.

Shared building blocks come from `@/shared/components/**` (charts, `SectionCard`, `StatCard`,
`Timeline`, `DataTable`, `DataTableBulkBar`) and `@/shared/ui/**` (shadcn/ui).

## Customizing

**Theme.** Components use design tokens only (`primary`, `success`, `chart-1`…). Stage colours are
in `STAGE_COLOR` and forecast category colours in `FORECAST_COLOR` (`model/crm.ts`).

**Text.** All strings are in `i18n/en.json` and `i18n/es.json`. Both files must have the same keys.

**Add a page.**

1. Add the route to `routes.ts`, e.g. `playbooks: defineRoute('/crm/playbooks')`.
2. Create `pages/playbooks-page.tsx` with a default-exported component wrapped in `Page`, and a
   `loader` if it fetches data.
3. Register it in `index.ts` under `workspace.routes`, and add a nav item to the right section.
4. Add the schema to `model/`, the endpoint to `crmApi`, a key to `crmKeys` and a hook.
5. Add translations to both language files.

**Use a real API.** Set `VITE_APP_API_URL` to your backend and turn off mocking
(`VITE_APP_ENABLE_API_MOCKING=false`), or remove `crmHandlers` from `src/mocks/handlers/index.ts`
to mock the other workspaces only. The endpoints above are the contract: as long as responses match the Zod schemas, the pages
work unchanged. Pages never call `fetch` directly, so `api/crm-api.ts` is the only file to touch if
your paths differ.
