import { env } from '@/core/config/env';

export type Brand = {
  /** Product name: logo text, tab title, "{{brand}}" in translations, loader. */
  name: string;
  description: string;
  /** Full logo image (mark + name) for light backgrounds; null draws the built-in one. */
  logo: string | null;
  /** Optional logo for dark backgrounds; falls back to `logo`. */
  logoDark: string | null;
  /** Square icon for the collapsed sidebar, favicon and loader; null draws the built-in mark. */
  mark: string | null;
};

/**
 * The brand defaults. Edit this file (or set VITE_APP_NAME) to rebrand the app;
 * the Brand panel in the theme sheet overrides it at runtime. Put image files
 * in `public/brand/` and reference them as '/brand/logo.svg'.
 */
export const BRAND: Brand = {
  name: env.APP_NAME,
  description: 'Dashboards, apps and pages for your next product.',
  logo: null,
  logoDark: null,
  mark: null,
};

export const BRAND_STORAGE_KEY = 'zed-dashboard:brand';

/** The built-in mark as SVG markup, colored by the caller (CSS variables or literal colors). */
export const markSvg = (background: string, foreground: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="9" fill="${background}"/><circle cx="16" cy="16" r="6.5" fill="none" stroke="${foreground}" stroke-width="2.5"/><circle cx="23.5" cy="9.5" r="2.6" fill="${foreground}"/></svg>`;
