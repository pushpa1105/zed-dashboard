# Selling the template

Seller-only. This file, `scripts/release.mjs` and `scripts/lib/zip.mjs` are never included in a
customer package.

## Products

| Product         | Price | Archive                             | Contents                                                    |
| --------------- | ----- | ----------------------------------- | ----------------------------------------------------------- |
| One dashboard   | $10   | `<name>-<dashboard>-v<version>.zip` | That dashboard + the starter kit                            |
| Complete bundle | $50   | `<name>-complete-v<version>.zip`    | Every dashboard, app, showcase, page template, landing page |

The **starter kit** is what turns one dashboard into a runnable app: `auth`, `dashboard`,
`landing`, `settings`, `tasks`, `users`, plus all of `core/`, `shared/`, the shell with its 9
layouts, the theme engine, docs, generators and tooling. Edit `STARTER` in
`scripts/release.mjs` to change it.

A single-dashboard package lands on that dashboard after sign-in and contains only its own mock
data and preview image. Every package includes `PACKAGE.md` (what is inside and where to start)
and `LICENSE.md`.

## Build the archives

```bash
npm run release                  # every dashboard + the bundle → release/
npm run release -- crm hr        # some dashboards
npm run release -- complete      # the bundle only
npm run release -- crm --verify  # typecheck + run the tests inside the package first
```

Run `npm run check` before a release, and `--verify` on at least one single package and the
bundle. The version in the file names comes from `package.json`: bump it for each release.

## Deliver them

Sell through a platform that hosts files and handles tax, licenses and re-downloads, e.g.
Lemon Squeezy, Gumroad or Paddle. Set it up once:

1. Create one product per dashboard (product slug = dashboard id: `crm`, `hr`, …) at $10, and
   one product `complete` at $50.
2. Attach each zip from `release/` as the product's file. Buyers get the download link by email
   and in their account; the platform also issues a license key per order if you want one.
3. For updates, upload the new zips to the same products. Platforms notify past buyers or let
   them re-download.

Offering an upgrade from single dashboards to the bundle is a discount code on `complete`.

## Storefront in the demo

The live demo doubles as the shop window. Set, on the demo deployment only:

```bash
VITE_APP_STORE_URL=https://yourstore.lemonsqueezy.com/buy/{product}
```

`{product}` becomes the dashboard id or `complete`. With it set, each template card shows
**Buy · $10** and the gallery shows the bundle offer. Customer packages ship with the variable
empty, so they show no prices. Prices are in `src/features/landing/lib/store.ts`.

## Adding a dashboard later

`npm run generate` → _workspace_ (see [Adding a dashboard](adding-a-dashboard.md)). The new
dashboard is picked up by the gallery, `template:keep` and `release` automatically. Then create
its product in the store and re-upload the bundle.
