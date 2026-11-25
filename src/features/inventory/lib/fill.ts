/** Bin and site fill: room left, tight (80%+) or full (95%+). */
export const fillColor = (pct: number) =>
  pct >= 95 ? 'var(--destructive)' : pct >= 80 ? 'var(--warning)' : 'var(--primary)';
