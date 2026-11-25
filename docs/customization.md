# Customization

Everything you are likely to change, and the one place to change it. Runtime options (theme panel,
Brand tab) are saved per device; edit the files to change the default for everyone.

## Brand

| What                   | Where                                                                           |
| ---------------------- | ------------------------------------------------------------------------------- |
| Product name           | `VITE_APP_NAME` in `.env`, or `name` in `core/brand/config.ts`                  |
| Description (meta tag) | `description` in `core/brand/config.ts`                                         |
| Logo, dark-mode logo   | `logo`, `logoDark`: put files in `public/brand/`, reference `'/brand/logo.svg'` |
| Square icon            | `mark` (collapsed sidebar, workspace switcher, favicon, app loader)             |
| Static favicon         | `public/favicon.svg` (used before the app starts)                               |

With no logo image, every logo is drawn as the icon plus the product name, in the brand color. The
name also replaces `{{brand}}` in any translation, so landing copy and page templates follow it.

The **Brand** tab of the theme panel (palette icon) changes the name, logos and icon live, which
is useful to show a client their brand before you edit the files.

Brand pieces: `core/brand/config.ts` (defaults), `store.ts` (runtime overrides),
`engine.ts` (favicon, `{{brand}}`, loader snapshot), `components/brand-logo.tsx`
(`<BrandLogo>`, `<BrandMark>`). Use `<BrandLogo>` wherever the logo appears in new code.

## Look and feel

| What                                      | Where                                                             |
| ----------------------------------------- | ----------------------------------------------------------------- |
| Default mode, preset, font, radius, scale | `DEFAULT_THEME` in `core/theme/config.ts`                         |
| Brand color                               | a preset in `styles/themes.css`, or the customizer's custom color |
| Any color, globally                       | tokens in `styles/globals.css` ([Theming](theming.md))            |
| Fonts                                     | `THEME_FONTS` + `styles/themes.css`                               |
| Shell layout for every dashboard          | `layout: 'auto'` → one value in `DEFAULT_THEME`                   |
| Shell layout for one dashboard            | `workspace.layout` in its `index.ts`                              |

## App loader

The loader in `index.html` shows until the app has painted. It uses the last brand and colors seen
on the device, so it matches a customized brand from the second visit on. Style and animation are
the `#splash` rules in the same file.

## Navigation and pages

| What                         | Where                                                                        |
| ---------------------------- | ---------------------------------------------------------------------------- |
| Page after sign-in           | `HOME_AFTER_LOGIN` in `core/config/routes.ts`                                |
| A dashboard's menu           | `workspace.nav` in its `index.ts` (sections, icons, badges, nesting)         |
| Order in the switcher        | `workspace.order`                                                            |
| Hide a page from some roles  | `roles` on the route and the menu entry ([Auth](auth.md))                    |
| Remove dashboards or modules | `npm run template:keep` ([Templates](templates.md))                          |
| Add a dashboard              | `npm run generate` → workspace ([Adding a dashboard](adding-a-dashboard.md)) |

## Text and languages

| What             | Where                                                                            |
| ---------------- | -------------------------------------------------------------------------------- |
| Any wording      | the feature's `i18n/<lang>.json`, or `core/i18n/locales` for shared UI           |
| Add a language   | `LANGUAGES` in `core/i18n/languages.ts` + a JSON per namespace ([i18n](i18n.md)) |
| Default language | `VITE_APP_DEFAULT_LOCALE`                                                        |

## Data and environment

| What                     | Where                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| Real API instead of mock | `VITE_APP_ENABLE_API_MOCKING=false`, `VITE_APP_API_URL` ([Mock backend](mock-backend.md)) |
| Mock latency             | `networkDelay` in `src/mocks/utils.ts`                                                    |
| Demo accounts on sign-in | `siteConfig.demo` in `core/config/site.ts`                                                |
| Any library              | its adapter file ([Swapping libraries](swapping-libraries.md))                            |
