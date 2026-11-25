# Adding a dashboard

A dashboard (a _workspace_ in the code) is a feature module whose manifest declares
`workspace: { … }`. It gets its own URL prefix, shell layout, menu and pages, and it appears in
the workspace switcher, ⌘K, the template gallery and `npm run template:keep` without further
wiring.

## Generate it

```bash
npm run generate        # pick "workspace", enter a name (e.g. "clinic"), pick a layout
npm run format && npm run check
```

You get a working, registered dashboard at `/clinic` with two pages, a mock API and a test:

```
src/features/clinic/
├── index.ts              manifest: name, layout, menu, routes
├── routes.ts             typed routes, all under /clinic
├── README.md             page list for whoever maintains it
├── model/clinic.ts       Zod schema → types
├── api/clinic.ts         request + TanStack Query options/hooks
├── pages/                overview-page.tsx, records-page.tsx
├── i18n/                 en.json, es.json (the "clinic" namespace)
└── __tests__/            workspace.test.tsx
src/mocks/handlers/clinic.ts   mock endpoints (MSW)
```

The generator also adds one line each to `src/app/modules.ts`, `src/app/i18n-resources.d.ts` and
`src/mocks/handlers/index.ts`.

## Fill it in

1. **Name and summary:** `workspace.name`, `description` and `category` in `i18n/en.json` (and
   every other language). These show in the switcher and the gallery.
2. **Data:** describe each resource with a Zod schema in `model/`, add request functions and
   query options in `api/`, and matching mock endpoints in `src/mocks/handlers/<name>.ts`.
   See [Data fetching](data-fetching.md) and [Mock backend](mock-backend.md).
3. **Pages:** one file per page in `pages/`, default-exporting the component. Wrap it in
   `<Page title description width>` from `@/core/layout/page`. Export a `loader` to prefetch.
4. **Routes and menu:** add the path to `routes.ts`, the lazy page to `workspace.routes`, and an
   entry to `workspace.nav`. Detail pages (`/clinic/patients/:id`) need a route but no menu entry.
5. **Preview image:** with the dev server running, `node scripts/capture-previews.mjs clinic`,
   then set `preview: '/previews/clinic.png'` in the manifest.

## Rules that keep dashboards independent

- Import only from `@/core/*` and `@/shared/*`. Never from another feature: copy, or move the
  shared piece down to `shared/` (generic) or `core/` (app-specific). ESLint enforces this.
- Every user-visible string goes through `t()`. The parity test fails if a language is missing a
  key.
- Colors come from theme tokens only (see [Theming](theming.md)). The token guard fails the
  build on `text-white`, hex values and the like.
- Mock files are named `<name>.ts` or `<name>-*.ts`, so `template:keep` and the release script
  can remove a dashboard completely.

## Remove it

```bash
npm run template:keep -- --list
npm run template:keep -- <the dashboards to keep>
```
