# Logistics workspace

An operations dashboard for a European road, rail and sea network. It covers shipment
tracking, exceptions, dispatch, fleet and drivers, route planning, dock scheduling, freight
billing, partner carriers, customer SLAs and performance reporting. All data comes from a seeded mock API, so every page works without a backend.

## Pages

| Route                          | Page                | What it demonstrates                                                                                                        |
| ------------------------------ | ------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `/logistics`                   | Network overview    | KPI cards, SVG network map, delivery volume chart, carrier on-time meters, busiest lanes                                    |
| `/logistics/shipments`         | Shipments           | Data table with search, scopes, column controls and CSV export                                                              |
| `/logistics/shipments/:id`     | Shipment detail     | Tracking timeline, route map, consignment details, proof of delivery, "report exception" dialog                             |
| `/logistics/exceptions`        | Exception queue     | Master/detail triage with severity filter, playbook, resolve/assign/escalate mutations                                      |
| `/logistics/dispatch`          | Dispatch board      | Drag-and-drop (`@dnd-kit`) of orders into driver lanes, keyboard-accessible menu fallback, capacity bars, optimistic update |
| `/logistics/fleet`             | Vehicles            | Vehicle cards with energy gauges, status filter, service alerts                                                             |
| `/logistics/fleet/:vehicleId`  | Vehicle detail      | Specs, odometer, weekly consumption chart, maintenance history, upcoming service, document expiry badges                    |
| `/logistics/drivers`           | Drivers             | Roster with hours-of-service bars and compliance alerts                                                                     |
| `/logistics/drivers/:driverId` | Driver profile      | On-time rate, deliveries, rating, safety score, hours of service today and this week, recent trips, safety events           |
| `/logistics/routes`            | Route planner       | Reorderable stops, live ETA and time-window checks, route map, save mutation                                                |
| `/logistics/docks`             | Dock schedule       | Timeline of dock slots with a "now" marker and a booking dialog                                                             |
| `/logistics/billing`           | Freight billing     | Carrier invoices vs quote, variance flags, approve and dispute actions, cost-per-km chart, variance by carrier              |
| `/logistics/carriers`          | Carriers            | Scorecards by mode, on-time ranking, mode mix, carrier sheet with lanes and contract, activate/suspend                      |
| `/logistics/slas`              | Customer SLAs       | Targets vs actual, weekly trend, root causes, breach list with credit-note dialog, `?status=` filter                        |
| `/logistics/performance`       | Performance reports | On-time, cost per shipment and utilisation for 30d/90d/12m (`?period=`), lane table, CSV export                             |

Vehicle and driver detail pages are reached from the plate on each vehicle card and the
driver's name on the roster (and from dispatch lanes).

## Mock API

Handlers live in `src/mocks/handlers/logistics.ts`, with carriers in `logistics-carriers.ts`,
SLAs and reports in `logistics-reports.ts` and shared helpers in `logistics-shared.ts`. Data is generated from a seeded RNG, so it
is identical on every load; mutations are kept in memory until the page reloads.

| Method  | Endpoint                              | Model (Zod)            |
| ------- | ------------------------------------- | ---------------------- |
| `GET`   | `/logistics/overview`                 | `overviewSchema`       |
| `GET`   | `/logistics/shipments`                | `shipmentSchema[]`     |
| `GET`   | `/logistics/shipments/:id`            | `shipmentDetailSchema` |
| `POST`  | `/logistics/shipments/:id/exception`  | `{ ok }`               |
| `GET`   | `/logistics/exceptions`               | `exceptionSchema[]`    |
| `PATCH` | `/logistics/exceptions/:id`           | `{ ok }`               |
| `GET`   | `/logistics/dispatch`                 | `dispatchBoardSchema`  |
| `PATCH` | `/logistics/dispatch/orders/:id`      | `dispatchOrderSchema`  |
| `GET`   | `/logistics/fleet`                    | `vehicleSchema[]`      |
| `GET`   | `/logistics/fleet/:id`                | `vehicleDetailSchema`  |
| `GET`   | `/logistics/drivers`                  | `driverSchema[]`       |
| `GET`   | `/logistics/drivers/:id`              | `driverDetailSchema`   |
| `GET`   | `/logistics/routes`                   | `plannedRouteSchema[]` |
| `PUT`   | `/logistics/routes/:id/stops`         | `plannedRouteSchema`   |
| `GET`   | `/logistics/docks`                    | `dockDaySchema`        |
| `POST`  | `/logistics/docks/slots`              | `dockSlotSchema`       |
| `GET`   | `/logistics/billing`                  | `billingSchema`        |
| `PATCH` | `/logistics/billing/invoices/:id`     | `invoiceSchema`        |
| `GET`   | `/logistics/carriers`                 | `carrierSchema[]`      |
| `GET`   | `/logistics/carriers/:id`             | `carrierDetailSchema`  |
| `PATCH` | `/logistics/carriers/:id`             | `carrierSchema`        |
| `GET`   | `/logistics/slas`                     | `slasSchema`           |
| `POST`  | `/logistics/slas/breaches/:id/credit` | `breachSchema`         |
| `GET`   | `/logistics/performance?period=`      | `performanceSchema`    |

Schemas are in `model/`: `logistics.ts` (shipments, exceptions, fleet, drivers, routes, docks),
`dispatch.ts`, `billing.ts`, `carriers.ts`, `slas.ts` and `performance.ts`. Every response is parsed with its schema, so a contract change
in the backend surfaces as a typed error instead of a broken page.

## Structure

```
logistics/
  api/logistics-api.ts   request functions, query keys, queryOptions, hooks and mutations
  api/partners-api.ts    the same for carriers, customer SLAs and performance reports
  model/                 Zod schemas, inferred types and small domain helpers (variance, totalWeight)
  pages/                 one file per route; each exports a default component and a `loader`
  components/            map, timeline, badges, dispatch board, invoice table, query states
  lib/                   formatters, geometry, route planning, hours-of-service limits
  i18n/en.json, es.json  every visible string (both files must have the same keys)
  routes.ts              typed paths used for links and route registration
  index.ts               workspace manifest: navigation, routes, translations
```

Key components:

- `DispatchBoard`: drag-and-drop lanes with an assign menu on each card for keyboard and touch.
- `InvoiceTable`: variance badges, approve and dispute (with reason) actions.
- `NetworkMap`, `RouteMap`: SVG maps drawn with theme tokens only.
- `QueryBoundary` / `LoadError`: shared loading and error handling for pages.
- `CarrierSheet`: scorecard radar, contract dates with expiry badge, contracted lanes.
- `BreachesCard` / `CreditNoteDialog`: breach list with root-cause filter and credit notes.
- `TargetBar`: progress bar with a target marker (on-time, transit time).
- `useSearchParam`: keeps a page filter in the query string, so nav links like `?status=breached` work.
- `StatusBadge` wrappers in `badges.tsx` for shipment, vehicle, driver, invoice, expiry, carrier,
  grade and SLA states, plus `ModeLabel`.

## Customising

**Add a page**

1. Add a path to `routes.ts`.
2. Create `pages/<name>-page.tsx` with a default export wrapped in `Page` and, if it fetches
   data, a `loader` that prefetches its query.
3. Register it in `index.ts` under `workspace.routes`, and add a `nav` item if it should
   appear in the sidebar (pages with `:params` are linked from other pages instead).
4. Add its strings to both `i18n/en.json` and `i18n/es.json`.

**Connect a real API**

1. Set `VITE_APP_API_URL` to your backend and `VITE_APP_ENABLE_API_MOCKING=false`.
2. Keep the paths in `api/logistics-api.ts` and `api/partners-api.ts` or change them there;
   nothing else calls the API.
3. Adjust the Zod schemas in `model/` if your payloads differ. Pages only use the inferred
   types, so the compiler shows every place that needs a change.
4. Delete `src/mocks/handlers/logistics*.ts` once they are no longer needed.

**Theming**: components use design tokens (`primary`, `chart-1..5`, `success`, `warning`,
`destructive`, `overlay`…) only, so they follow the active theme and dark mode.
