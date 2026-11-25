# Analytics workspace

A web and product analytics dashboard: traffic, acquisition, behavior, retention, conversion
goals and A/B tests. It lives at `/analytics`, uses the `topnav-tabs` layout and is registered by
`index.ts` like every other feature. All data comes from a mock API (MSW) that you can replace
with your own backend without touching the pages.

## Pages

| Route                                  | Page                   | What it shows                                                                                      |
| -------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------- |
| `/analytics`                           | `home-page.tsx`        | KPI cards, visitors chart, weekday × hour heatmap, orders and sales report                         |
| `/analytics/realtime`                  | `realtime-page.tsx`    | Live users (polls every 5 s, pausable), event stream, top pages, devices                           |
| `/analytics/audience`                  | `audience-page.tsx`    | Users, new vs. returning, age groups, devices, countries                                           |
| `/analytics/geography`                 | `geography-page.tsx`   | Tile-grid world map, sessions by region, ranked country table with region filter, country sheet    |
| `/analytics/technology`                | `technology-page.tsx`  | Device, OS and browser charts; conversion rate per device/OS/browser/resolution vs. site average   |
| `/analytics/acquisition`               | `acquisition-page.tsx` | Channels with trends, source/medium table, UTM link builder (form + mutation)                      |
| `/analytics/campaigns`                 | `campaigns-page.tsx`   | Campaign KPIs, traffic, funnel, deals, posts and payout ledger                                     |
| `/analytics/pages`                     | `pages-page.tsx`       | Top pages with views, time on page, bounce and scroll depth                                        |
| `/analytics/funnels`                   | `funnels-page.tsx`     | Funnel builder: pick and reorder 2–7 steps, see drop-off per step                                  |
| `/analytics/retention`                 | `retention-page.tsx`   | Weekly cohort heatmap (percent or users), retention curve, segment and cohort-count filters        |
| `/analytics/events`                    | `events-page.tsx`      | Event list with counts, users, sparklines and change; search, category filter, detail side sheet   |
| `/analytics/goals`                     | `goals-page.tsx`       | Goals with rate vs. target, progress and value; create/edit dialog (React Hook Form + Zod), delete |
| `/analytics/experiments`               | `experiments-page.tsx` | A/B tests with status filter, best lift and confidence, linked to the detail page                  |
| `/analytics/experiments/:experimentId` | `experiment-page.tsx`  | Verdict, variant comparison (rate, lift, confidence), cumulative conversion rate chart             |
| `/analytics/reports`                   | `reports-page.tsx`     | Saved reports with email schedules (dialog form), delete with confirmation                         |
| `/analytics/alerts`                    | `alerts-page.tsx`      | Anomaly feed with acknowledge/mute/reopen, alert rules with on/off switch, create-rule dialog      |

The date range (`?range=7d|28d|90d`) and comparison mode live in the URL, so filtered views can be
shared. Every page has loading skeletons, an error state with retry, and empty states where a
filter can return nothing.

## Data

Request functions, query keys, query options and hooks are in `api/analytics-api.ts` (home and
campaigns have their own `api/` folders; geography, technology and alerts live in
`api/insights-api.ts` with schemas in `model/insights.ts`). Every response is parsed with a Zod schema from
`model/analytics.ts`, so a backend that drifts from the contract fails loudly.

| Method   | Endpoint                                  | Schema                             |
| -------- | ----------------------------------------- | ---------------------------------- |
| `GET`    | `/analytics/overview`, `/visitors`        | `home/model/overview.ts`           |
| `GET`    | `/analytics/campaigns/overview`, `/deals` | `campaigns/model/marketing.ts`     |
| `GET`    | `/analytics/realtime`                     | `realtimeSchema`                   |
| `GET`    | `/analytics/audience?range=`              | `audienceSchema`                   |
| `GET`    | `/analytics/acquisition?range=`           | `acquisitionSchema`                |
| `POST`   | `/analytics/utm-links`                    | `utmInputSchema` → `utmLinkSchema` |
| `GET`    | `/analytics/pages?range=`                 | `pageRowSchema[]`                  |
| `GET`    | `/analytics/funnel?range=&steps=`         | `funnelSchema`                     |
| `GET`    | `/analytics/retention?segment=&cohorts=`  | `retentionSchema`                  |
| `GET`    | `/analytics/events?range=`                | `eventRowSchema[]`                 |
| `GET`    | `/analytics/events/:key?range=`           | `eventDetailSchema`                |
| `GET`    | `/analytics/goals?range=`                 | `goalSchema[]`                     |
| `POST`   | `/analytics/goals`                        | `goalInputSchema` → `goalSchema`   |
| `PATCH`  | `/analytics/goals/:id`                    | `goalInputSchema` → `goalSchema`   |
| `DELETE` | `/analytics/goals/:id`                    | —                                  |
| `GET`    | `/analytics/experiments`                  | `experimentSchema[]`               |
| `GET`    | `/analytics/experiments/:id`              | `experimentDetailSchema`           |
| `GET`    | `/analytics/reports`                      | `reportSchema[]`                   |
| `PATCH`  | `/analytics/reports/:id/schedule`         | `scheduleSchema` → `reportSchema`  |
| `DELETE` | `/analytics/reports/:id`                  | —                                  |
| `GET`    | `/analytics/geography?range=`             | `countryRowSchema[]`               |
| `GET`    | `/analytics/geography/:code?range=`       | `countryDetailSchema`              |
| `GET`    | `/analytics/technology?range=`            | `technologySchema`                 |
| `GET`    | `/analytics/alerts`                       | `alertSchema[]`                    |
| `PATCH`  | `/analytics/alerts/:id`                   | `{ status }` → `alertSchema`       |
| `GET`    | `/analytics/alert-rules`                  | `alertRuleSchema[]`                |
| `POST`   | `/analytics/alert-rules`                  | `alertRuleInputSchema` → rule      |
| `PATCH`  | `/analytics/alert-rules/:id`              | `{ enabled }` → `alertRuleSchema`  |
| `DELETE` | `/analytics/alert-rules/:id`              | —                                  |

Mutations declare `meta: { invalidates, successMessage }`; the app's query client refetches the
listed keys and shows the toast, so components only call `mutate`.

The mock lives in `src/mocks/handlers/analytics.ts` (geography, technology and alerts in
`analytics-insights.ts`, shared helpers in `analytics-utils.ts`). Data is generated from seeded random
numbers, so it is identical on every load; goals, UTM links, report schedules, alert statuses
and alert rules are kept in memory until the page reloads.

Experiment statistics are computed on the client in `lib/stats.ts`: conversion rate, relative
lift over the control and a two-sided two-proportion z-test for confidence (significant at 95%).
If your experimentation backend already returns these, use its values instead.

## Key components

- `components/range-control.tsx`: date range and comparison selectors bound to the URL.
- `components/cohort-table.tsx`: cohort heatmap; cell color is `--primary` mixed by retention.
- `components/event-sheet.tsx`: event side sheet with daily volume and property breakdown.
- `components/goal-dialog.tsx`: create/edit goal form.
- `components/experiment-parts.tsx`: status tag, lift and confidence meter shared by both experiment pages.
- `components/schedule-dialog.tsx`, `components/utm-builder.tsx`: other forms.
- `components/tile-map.tsx`: tile-grid world map; tile color is `--primary` mixed by sessions.
- `components/country-sheet.tsx`, `components/segments-card.tsx`: country detail and conversion by segment.
- `components/alert-feed.tsx`, `components/alert-rules-card.tsx`, `components/rule-dialog.tsx`: alerts page parts.
- `components/query-error.tsx`: error alert with retry used by every page.

Pages are built from the shared kit (`@/shared/components/charts`, `dashboard`, `display`,
`forms` and `@/shared/ui`). Colors come only from theme tokens, so the workspace follows light,
dark and custom themes.

## Customizing

**Add a page**

1. Add the route to `routes.ts`, e.g. `cohorts: defineRoute('/analytics/cohorts')`.
2. Create `pages/cohorts-page.tsx` with a default-export component (and an optional `loader`
   that prefetches its query). Wrap it in `Page` from `@/core/layout/page`.
3. Register it in `index.ts` under `workspace.routes`, and add a `nav` entry if it should appear
   in the menu. Pages with route params need no nav entry; link to them with
   `analyticsRoutes.x.href({ ... })`.
4. Add strings to both `i18n/en.json` and `i18n/es.json` (a test checks the keys match).

**Use your real API**

1. Point `VITE_APP_API_URL` at your backend and stop mocking these endpoints (remove
   `analyticsHandlers` from `src/mocks/handlers/index.ts`).
2. Make your endpoints return the shapes in `model/analytics.ts`, or adapt the schemas and the
   request functions in `api/analytics-api.ts`. Pages only use the hooks, so nothing else changes.

**Remove pages you don't need**: delete the page file, its route in `routes.ts` and `index.ts`,
and its nav entry.
