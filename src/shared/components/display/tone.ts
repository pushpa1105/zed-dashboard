import type { CSSProperties } from 'react';

/**
 * Semantic + categorical tones shared by Tag, StatusBadge, Callout, Timeline…
 * Each maps to a design token, so every tone follows the theme and dark mode.
 */
export const TONES = {
  neutral: 'var(--muted-foreground)',
  primary: 'var(--primary)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--destructive)',
  info: 'var(--info)',
  violet: 'var(--chart-1)',
  aqua: 'var(--chart-2)',
  orange: 'var(--chart-3)',
  blue: 'var(--chart-4)',
  magenta: 'var(--chart-5)',
} as const;

export type Tone = keyof typeof TONES;

export type ToneAppearance = 'soft' | 'solid' | 'outline';

/** Inline styles for a tone: soft = tinted bg, solid = filled, outline = ring only. */
export function toneStyle(tone: Tone, appearance: ToneAppearance = 'soft'): CSSProperties {
  const color = TONES[tone];
  if (appearance === 'solid') {
    return { background: color, color: 'white', borderColor: 'transparent' };
  }
  if (appearance === 'outline') {
    return {
      background: 'transparent',
      color: `color-mix(in srgb, ${color} 85%, var(--foreground))`,
      borderColor: `color-mix(in srgb, ${color} 45%, transparent)`,
    };
  }
  return {
    background: `color-mix(in srgb, ${color} 13%, transparent)`,
    color: `color-mix(in srgb, ${color} 80%, var(--foreground))`,
    borderColor: 'transparent',
  };
}
