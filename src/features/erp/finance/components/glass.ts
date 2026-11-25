/**
 * Frosted-glass surface used by every panel on this dashboard. Built from
 * tokens (card, primary, border) so it adapts to presets and dark mode.
 */
export const GLASS =
  'border border-card/70 bg-card/65 shadow-[0_1px_2px_color-mix(in_oklch,var(--foreground)_3%,transparent),0_12px_32px_-16px_color-mix(in_oklch,var(--primary)_30%,transparent)] backdrop-blur-xl dark:border-border/40 dark:bg-card/55';

/** Soft lavender + peach glow painted behind the page. */
export const GLASS_BACKDROP = {
  backgroundImage: [
    'radial-gradient(55% 45% at 12% 0%, color-mix(in srgb, var(--primary) 16%, transparent), transparent 70%)',
    'radial-gradient(45% 40% at 100% 12%, color-mix(in srgb, var(--chart-5) 14%, transparent), transparent 70%)',
    'radial-gradient(50% 45% at 70% 100%, color-mix(in srgb, var(--chart-3) 12%, transparent), transparent 70%)',
  ].join(', '),
} as const;
