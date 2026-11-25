# SaaS workspace

An admin console for a developer platform or API product: usage and quotas, API keys, webhooks,
request logs, billing and team on the customer side, plus the operator tools a SaaS company runs
internally (customer accounts, feature flags, audit log, status page).

Everything is served by the MSW mock backend with seeded, deterministic data. Mutations are kept in
memory until the page is reloaded.

## Pages

| Route                         | Page            | What it shows                                                                                                   |
| ----------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------- |
| `/saas`                       | Overview        | API calls chart, P&L, plan limits, activity feed, integration switches                                          |
| `/saas/usage`                 | Usage           | Quota meter with projection, stacked daily requests, per-endpoint latency and error table                       |
| `/saas/customers`             | Customers       | Tenant table with plan, MRR, seats, health score and churn risk; search, plan and risk filters; revenue summary |
| `/saas/customers/:customerId` | Customer detail | 30-day usage chart, invoices, account profile and an admin panel to change plan or extend a trial               |
| `/saas/status`                | Status          | Component status grid, 90-day uptime bars, active and past incidents with update timelines, declare/resolve     |
| `/saas/keys`                  | API keys        | Masked keys with scopes, create (secret shown once), revoke                                                     |
| `/saas/webhooks`              | Webhooks        | Endpoints, delivery history, enable/disable, test delivery                                                      |
| `/saas/logs`                  | Logs            | Level filters, search, expandable JSON payloads, cursor pagination                                              |
| `/saas/flags`                 | Feature flags   | Per-environment switches, production rollout slider, targeting rule summary                                     |
| `/saas/billing`               | Billing         | Current plan, meters, plan picker, payment method, invoices                                                     |
| `/saas/team`                  | Team            | Members with roles and MFA, invitations, role reference                                                         |
| `/saas/audit`                 | Audit log       | Security events filtered by category, severity and text; raw JSON in a side sheet; client-side CSV export       |
| `/saas/integrations`          | Integrations    | Marketplace grid with category chips, search and connection filter; config sheet to connect, edit or disconnect |
| `/saas/roles`                 | Roles           | Roles with member counts and a members donut; resources × actions permission matrix; create, duplicate, save    |
| `/saas/support`               | Support inbox   | Tickets by SLA deadline with live countdowns, status (`?status=`), priority and assignee filters; thread sheet  |
| `/saas/settings`              | Settings        | Workspace profile, region, security policy, notifications (React Hook Form + Zod)                               |

`Edge config` in the sidebar is a disabled placeholder that shows how a "coming soon" entry looks.

## Data layer

| Folder              | Contents                                                                                                                           |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `model/overview.ts` | Overview dashboard schemas                                                                                                         |
| `model/platform.ts` | Keys, usage, logs, webhooks, billing, team and settings schemas                                                                    |
| `model/admin.ts`    | `customerSchema`, `customerDetailSchema`, `flagSchema`, `auditEventSchema`, `statusSchema`, `incidentSchema`, `incidentFormSchema` |
| `api/*.ts`          | Endpoint functions, query keys, `queryOptions` factories and mutation hooks                                                        |

Responses are parsed with Zod in `api.get/post/...`, so a backend that drifts from the schema fails
loudly. Mutations declare `meta: { invalidates, successMessage }`; the global mutation cache
refetches those keys and shows the toast.

### Mock endpoints

Defined in `src/mocks/handlers/saas.ts`, `saas-admin.ts` (also exports the shared `seeded`/`guard` helpers), `saas-integrations.ts`, `saas-roles.ts` and `saas-support.ts`. All require auth.

| Method                | Path                                                             | Notes                                               |
| --------------------- | ---------------------------------------------------------------- | --------------------------------------------------- |
| GET                   | `/dashboards/saas/overview?range=`                               | `6h`, `24h`, `7d`                                   |
| PATCH                 | `/dashboards/saas/integrations/:id`                              | `{ enabled }`                                       |
| GET/POST/DELETE       | `/saas/keys`, `/saas/keys/:id`                                   | List, create (returns the secret once), revoke      |
| GET                   | `/saas/usage?range=`                                             | `14d`, `30d`                                        |
| GET                   | `/saas/logs?levels=&q=&cursor=`                                  | 50 per page                                         |
| GET/PATCH/POST        | `/saas/webhooks`, `/:id`, `/:id/deliveries`, `/:id/test`         |                                                     |
| GET/POST              | `/saas/billing`, `/saas/billing/plan`                            |                                                     |
| GET/PATCH/DELETE/POST | `/saas/team`, `/saas/team/members/:id`, `/saas/team/invites`     |                                                     |
| GET/PUT               | `/saas/settings`                                                 | Slug `taken` returns 409 to demo server errors      |
| GET                   | `/saas/customers`                                                | All tenants                                         |
| GET                   | `/saas/customers/:id`                                            | Tenant + 30-day usage + invoices; 404 if unknown    |
| POST                  | `/saas/customers/:id/plan`                                       | `{ plan }`, recalculates MRR                        |
| POST                  | `/saas/customers/:id/trial`                                      | `{ days }`, starts or extends the trial             |
| GET                   | `/saas/flags`                                                    |                                                     |
| PATCH                 | `/saas/flags/:id`                                                | `{ environments?: Partial<…>, rollout? }`           |
| GET                   | `/saas/audit`                                                    | 140 events, newest first                            |
| GET                   | `/saas/status`                                                   | Components with 90 days of downtime, incidents      |
| POST                  | `/saas/status/incidents`                                         | Declares an incident and degrades its components    |
| POST                  | `/saas/status/incidents/:id/resolve`                             | Resolves it and restores component status           |
| GET/PUT/DELETE        | `/saas/integrations`, `/saas/integrations/:id`                   | PUT `{ account, events, sync }` connects or updates |
| GET/POST              | `/saas/roles`                                                    | POST `{ name, description, from }` copies a role    |
| PUT                   | `/saas/roles/:id/permissions`                                    | `{ permissions }`; system roles return 403          |
| GET                   | `/saas/support`                                                  | `{ agents, tickets }` with message threads          |
| POST/PATCH            | `/saas/support/tickets/:id/replies`, `/saas/support/tickets/:id` | Reply (sets pending), `{ status?, assignee? }`      |

## Components

Local to this feature in `components/`:

- `customer-badges.tsx`: `PlanTag`, `RiskTag`, `CustomerStatus`, `HealthMeter`
- `customer-actions.tsx`: change plan / extend trial panel
- `flag-row.tsx`: environment switches and rollout slider (commits on release)
- `audit-event-sheet.tsx`, `severity-tag.tsx`: audit detail sheet and severity chip
- `uptime-bars.tsx`: 90-day bar strip
- `incident-card.tsx`, `declare-incident-dialog.tsx`: incident timeline and the declare form
- `filter-select.tsx`, `chip-filter.tsx`: labelled select and single-choice chip row used in list toolbars
- `integration-sheet.tsx`: connect/configure form (React Hook Form + Zod)
- `permission-matrix.tsx`, `role-dialog.tsx`: editable resources × actions grid and the create/duplicate form
- `ticket-badges.tsx` (`PriorityTag`, `TicketStatusBadge`, `SlaTimer`), `ticket-sheet.tsx`: ticket chips and the conversation sheet
- `hooks/use-now.ts`: ticking clock for countdowns
- `lib/csv.ts`: `downloadCsv()`; `lib/format.ts`: `money()`, `compact()`, `duration()`; `lib/uptime.ts`: `uptimeOf()`

Shared building blocks come from `@/shared/components` (`SectionCard`, `StatStrip`, `Tag`,
`StatusBadge`, `Timeline`, `CodeBlock`, charts) and `@/shared/ui` (shadcn/ui).

## Customizing

**Add a page**

1. Create `pages/<name>-page.tsx` with a default-export component and an optional `loader` that
   prefetches its query.
2. Add the route to `routes.ts`, then to `workspace.routes` in `index.ts`.
3. Add a sidebar entry to `workspace.nav` in `index.ts` (skip it for detail pages with params).
4. Add strings to `i18n/en.json` and `i18n/es.json`; both files must have the same keys.
5. Add a render test to `__tests__/workspace.test.tsx`.

**Use a real API**

The endpoint functions in `api/*.ts` call `api.get('/saas/...')` relative to `VITE_APP_API_URL`. Point
that variable at your backend, make it return the shapes in `model/*.ts`, and turn off the mock
worker with `VITE_APP_ENABLE_API_MOCKING=false` (see `docs/mock-backend.md`). Nothing in the pages needs to change. If your API uses other
paths or field names, adapt them in `api/*.ts` or with a Zod `.transform()` in the model.

**Remove a page**

Delete its file, its route in `routes.ts` and `index.ts`, its nav entry and its i18n keys.
