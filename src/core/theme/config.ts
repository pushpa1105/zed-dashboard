/**
 * Theme registry: the single place that describes which theme options exist.
 *
 * - Presets map to `:root[data-theme='<value>']` blocks in `src/styles/themes.css`.
 * - Fonts map to `:root[data-font='<value>']` blocks.
 * - Scales map to `:root[data-scale='<value>']` blocks.
 *
 * The customizer UI is generated from these arrays, so adding an entry here
 * (plus its CSS block) is all it takes to offer a new option.
 */

export const THEME_MODES = ['light', 'dark', 'system'] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export const THEME_PRESETS = [
  { value: 'lavender', label: 'Lavender', swatch: 'oklch(0.53 0.21 285)' },
  { value: 'neutral', label: 'Neutral', swatch: 'oklch(0.205 0 0)' },
  { value: 'blue', label: 'Blue', swatch: 'oklch(0.546 0.245 262.881)' },
  { value: 'green', label: 'Green', swatch: 'oklch(0.627 0.194 149.214)' },
  { value: 'rose', label: 'Rose', swatch: 'oklch(0.586 0.253 17.585)' },
  { value: 'orange', label: 'Orange', swatch: 'oklch(0.646 0.222 41.116)' },
  { value: 'violet', label: 'Violet', swatch: 'oklch(0.541 0.281 293.009)' },
] as const;
export type ThemePreset = (typeof THEME_PRESETS)[number]['value'];

export const THEME_FONTS = [
  { value: 'geist', label: 'Geist' },
  { value: 'system', label: 'System' },
  { value: 'serif', label: 'Serif' },
  { value: 'mono', label: 'Mono' },
  { value: 'rounded', label: 'Rounded' },
] as const;
export type ThemeFont = (typeof THEME_FONTS)[number]['value'];

export const THEME_SCALES = [
  { value: 'sm', label: 'Compact' },
  { value: 'md', label: 'Default' },
  { value: 'lg', label: 'Large' },
] as const;
export type ThemeScale = (typeof THEME_SCALES)[number]['value'];

/**
 * Shell layouts: the page structure around the content. Every workspace
 * (dashboard product) picks a default in its manifest; the theme panel can
 * force one for all of them (`auto` keeps each workspace's own).
 */
export const SHELL_LAYOUTS = [
  { value: 'sidebar', label: 'Sidebar', hint: 'Collapsible sidebar with nested sections' },
  { value: 'sidebar-dark', label: 'Dark sidebar', hint: 'Same structure on a dark rail' },
  { value: 'inset', label: 'Inset', hint: 'Content floats as a card next to the sidebar' },
  { value: 'floating', label: 'Floating', hint: 'Detached sidebar card' },
  { value: 'rail', label: 'Icon rail', hint: 'Slim icon bar with flyout submenus' },
  { value: 'dual', label: 'Dual sidebar', hint: 'Section rail plus a contextual panel' },
  { value: 'topnav', label: 'Top nav', hint: 'Horizontal menu with dropdowns' },
  { value: 'topnav-tabs', label: 'Top nav + tabs', hint: 'Header bar with a tab row below' },
  { value: 'boxed', label: 'Boxed', hint: 'Centered frame with an inner sidebar' },
] as const;
export type ShellLayout = (typeof SHELL_LAYOUTS)[number]['value'];

export const THEME_LAYOUTS = [
  { value: 'auto', label: 'Auto', hint: "Each dashboard's own layout" },
  ...SHELL_LAYOUTS,
] as const;
export type ThemeLayout = (typeof THEME_LAYOUTS)[number]['value'];

export const THEME_RADII = [0, 0.3, 0.5, 0.625, 0.75, 1, 1.25] as const;

export const THEME_STORAGE_KEY = 'zed-dashboard:theme';

export const DEFAULT_THEME = {
  mode: 'system' as ThemeMode,
  preset: 'lavender' as ThemePreset,
  font: 'geist' as ThemeFont,
  scale: 'md' as ThemeScale,
  radius: 0.75,
  layout: 'auto' as ThemeLayout,
  customPrimary: null as string | null,
};
