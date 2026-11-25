# Theming

The theme engine is built on **CSS variables** (shadcn/ui design tokens in OKLCH) and **Tailwind
v4's CSS-first configuration**. There is no `tailwind.config.js`.

## How it works

```
 ThemeCustomizer / ModeToggle / ⌘K ──▶ useThemeStore (Zustand, persisted: "zed-dashboard:theme")
                                              │
                                              ▼  applyTheme()   (core/theme/engine.ts)
 <html class="dark" data-theme="violet" data-font="geist" data-scale="md"
       style="--radius: 0.75rem; --primary: #ff5a1f; --accent: color-mix(…)">
                                              │
                                              ▼
 styles/globals.css + styles/themes.css ──▶ every utility (bg-primary, rounded-lg, text-sm…)
```

| Option       | Mechanism                                                  | Defined in                         |
| ------------ | ---------------------------------------------------------- | ---------------------------------- |
| Mode         | `.dark` class on `<html>`                                  | `globals.css` (`.dark { … }`)      |
| Color preset | `data-theme` attribute                                     | `themes.css`                       |
| Custom color | inline `--primary`, `--ring`, accent and sidebar tints     | `core/theme/engine.ts`             |
| Radius       | inline `--radius`                                          | `globals.css` (`--radius-*` scale) |
| Font         | `data-font` attribute                                      | `themes.css`                       |
| Density      | `data-scale` sets the root `font-size`                     | `themes.css`                       |
| Layout       | store value read by the workspace shell (no CSS attribute) | `app/shell/workspace-shell.tsx`    |
| Chart colors | `--chart-1` … `--chart-5` (+ dark steps)                   | `globals.css`                      |

The default preset is **Lavender** (soft lavender canvas, white cards, violet brand).

The chart palette is categorical and assigned in fixed order (violet, aqua, orange, blue,
magenta). It was checked for color-blind separation in light and dark mode; if you replace it,
replace it as a set and keep the order stable so a series never changes color when others are
hidden.

**No flash of the wrong theme:** an inline script in `index.html` applies the stored theme before
React loads. `initTheme()` in `main.tsx` then keeps the DOM in sync with the store and with the
OS color scheme. The browser's `theme-color` follows the page background.

## Token reference

Every color in the UI is one of these tokens. Each has a light and a dark value, and presets or a
custom brand color override them, so anything built from tokens follows every theme.

| Token (Tailwind name)                                         | Use for                                   |
| ------------------------------------------------------------- | ----------------------------------------- |
| `background`, `foreground`                                    | Page canvas and body text                 |
| `card`, `popover` (+ `-foreground`)                           | Surfaces: cards, menus, dialogs           |
| `primary` (+ `-foreground`)                                   | Brand: main buttons, active states        |
| `secondary`, `muted`, `accent` (+ `-foreground`)              | Quiet fills, hover and selected rows      |
| `success`, `warning`, `info`, `destructive` (+ `-foreground`) | Status colors and the text placed on them |
| `border`, `input`, `ring`                                     | Lines, field borders, focus rings         |
| `chart-1` … `chart-5`                                         | Data series                               |
| `sidebar-*`                                                   | Navigation surfaces                       |
| `overlay`, `overlay-foreground`                               | Scrims over images or video, text on them |
| `scrollbar`, `scrollbar-hover`                                | Scrollbar thumb (derived from muted text) |

Opacity modifiers are fine (`bg-primary/10`). For an inverted band, swap the pair:
`bg-foreground text-background`. The `.sidebar-dark` class re-scopes the tokens for a dark menu,
so components inside it need no special styling.

### The rule, and how it is enforced

Use tokens only: no Tailwind palette colors (`bg-blue-500`, `text-white`, `bg-black/40`), no hex
and no `oklch()`/`rgb()` literals outside `src/styles` and `src/core/theme`.
`src/styles/__tests__/theme-tokens.test.ts` fails the build otherwise and prints the file, line
and value.

Some exceptions are real: third-party brand marks, print output, a QR code that must stay black
on white. Put `// theme-exempt: <reason>` on the line before; it covers that statement.

### Custom brand color

A custom color from the customizer sets `--primary`, `--ring` and an auto-contrast
`--primary-foreground`, and derives `--accent` and the `--sidebar-*` brand tints from it with
`color-mix()`. Hover states and the active menu row match the brand, not the preset.

## Scrollbars

Every scroll container gets a thin, rounded scrollbar colored from tokens (`styles/globals.css`).
Two utilities cover the special cases:

| Class             | Effect                                                      |
| ----------------- | ----------------------------------------------------------- |
| `scrollbar-none`  | Still scrollable, no visible bar (tab rows, chip strips)    |
| `scrollbar-hover` | The thumb appears only while the area is hovered or focused |

## Files

| File                                    | Role                                                                |
| --------------------------------------- | ------------------------------------------------------------------- |
| `core/theme/config.ts`                  | Registry of modes, presets, fonts, scales, layouts, radii, defaults |
| `core/theme/store.ts`                   | Persisted Zustand store                                             |
| `core/theme/engine.ts`                  | `applyTheme`, `initTheme`, `useResolvedThemeMode`, `buildThemeCss`  |
| `core/theme/components/`                | `ModeToggle`, `ThemeSheet`, `ThemeCustomizer`, `ThemedToaster`      |
| `styles/globals.css`                    | Base tokens (`:root`, `.dark`), Tailwind mapping, scrollbars        |
| `styles/themes.css`                     | Presets, fonts, scales                                              |
| `styles/__tests__/theme-tokens.test.ts` | The token guard                                                     |

## Change the default look

Edit `DEFAULT_THEME` in `core/theme/config.ts`:

```ts
export const DEFAULT_THEME = {
  mode: 'system',
  preset: 'blue',
  font: 'geist',
  scale: 'md',
  radius: 0.75,
  layout: 'auto',
  customPrimary: null,
};
```

Keep the fallbacks in the `index.html` script in sync.

### Design it live, then export

1. Open the customizer (palette icon) and build the look you want.
2. Click **Copy CSS**. You get the current tokens as a `:root { … }` (or `.dark { … }`) block.
3. Paste it into the matching block in `styles/globals.css`. Repeat in dark mode.

## Add a color preset

1. CSS in `styles/themes.css` (override only what you need):

   ```css
   :root[data-theme='teal'] {
     --primary: oklch(0.6 0.118 184.704);
     --primary-foreground: oklch(0.985 0 0);
     --ring: oklch(0.704 0.14 182.503);
   }
   :root[data-theme='teal'].dark {
     --primary: oklch(0.704 0.14 182.503);
     --primary-foreground: oklch(0.145 0 0);
   }
   ```

2. Register it in `core/theme/config.ts`:

   ```ts
   { value: 'teal', label: 'Teal', swatch: 'oklch(0.6 0.118 184.704)' },
   ```

The customizer is generated from the registry, so the preset appears automatically. Fonts and
scales work the same way.

## Add a design token

```css
/* globals.css */
:root {
  --brand-2: oklch(0.6 0.2 240);
}
.dark {
  --brand-2: oklch(0.7 0.18 240);
}

@theme inline {
  --color-brand-2: var(--brand-2); /* enables bg-brand-2, text-brand-2, border-brand-2… */
}
```

## Use the theme in code

```tsx
import { useResolvedThemeMode } from '@/core/theme/engine';
import { useThemeStore } from '@/core/theme/store';

const preset = useThemeStore((s) => s.preset);
const setMode = useThemeStore((s) => s.setMode);
const mode = useResolvedThemeMode(); // 'light' | 'dark', with system resolved
```
