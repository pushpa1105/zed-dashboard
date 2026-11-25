import { HttpResponse } from 'msw';

import { networkDelay, requireAuth } from '../utils';

/** Deterministic pseudo-random numbers so every load shows the same data. */
export function seeded(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Date ranges offered by every analytics page (`?range=`), and how they scale totals. */
export const RANGE_FACTOR: Record<string, number> = { '7d': 0.27, '28d': 1, '90d': 3.05 };
export const RANGE_DAYS: Record<string, number> = { '7d': 7, '28d': 28, '90d': 90 };
export const readRange = (request: Request) => {
  const value = new URL(request.url).searchParams.get('range') ?? '28d';
  return value in RANGE_DAYS ? value : '28d';
};

export const isoDay = (daysAgo: number) => {
  const d = new Date(Date.UTC(2026, 10, 24));
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
};

/** Splits `total` across `labels` with decaying, slightly random weights (largest first). */
export function split(total: number, labels: readonly string[], rand: () => number) {
  const weights = labels.map((_, i) => (0.5 + rand()) / (i + 1));
  const sum = weights.reduce((a, b) => a + b, 0);
  return labels.map((value, i) => ({ value, count: Math.round((total * weights[i]!) / sum) }));
}

/** Simulated latency plus auth check; returns the error response, if any. */
export const authed = async (request: Request) => {
  await networkDelay();
  const auth = requireAuth(request);
  return 'error' in auth ? auth.error : null;
};

export const notFound = (what: string) =>
  HttpResponse.json({ message: `${what} not found` }, { status: 404 });
