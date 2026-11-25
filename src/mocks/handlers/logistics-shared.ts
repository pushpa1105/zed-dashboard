import { env } from '@/core/config/env';

import { networkDelay, requireAuth } from '../utils';

/** Helpers and reference data shared by the logistics mock modules. */

export function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
export const pick = <T>(rand: () => number, items: readonly T[]) =>
  items[Math.floor(rand() * items.length)]!;

export const API = `${env.API_URL}/logistics`;
export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;
// Rounded "now" so a page load shows consistent relative times.
export const now = () => Math.floor(Date.now() / 60_000) * 60_000;
export const iso = (ms: number) => new Date(ms).toISOString();
export const round1 = (n: number) => Math.round(n * 10) / 10;

export const guarded =
  <T extends unknown[]>(fn: (...args: T) => Promise<Response> | Response) =>
  async (...args: T) => {
    await networkDelay();
    const auth = requireAuth((args[0] as { request: Request }).request);
    if ('error' in auth) return auth.error;
    return fn(...args);
  };

export const CUSTOMERS = [
  'Lumen Health',
  'Parcelpoint',
  'Fieldwork Outdoor',
  'Kestrel & Co',
  'Copperleaf Foods',
  'Brightline Retail',
  'Nordic Oak Furniture',
  'Halden Pharma',
  'Mosaic Labs',
  'Vela Electronics',
];

/** Contracted lanes as [origin, destination, km]; carriers and reports draw from these. */
export const LANES: ReadonlyArray<readonly [string, string, number]> = [
  ['Rotterdam', 'Hamburg', 480],
  ['Rotterdam', 'Paris Nord', 450],
  ['Antwerp', 'Lyon', 760],
  ['Paris Nord', 'Madrid', 1270],
  ['Lyon', 'Milan', 440],
  ['Hamburg', 'Copenhagen', 340],
  ['Hamburg', 'Warsaw', 760],
  ['Munich', 'Vienna', 435],
  ['Prague', 'Warsaw', 630],
  ['Milan', 'Munich', 490],
  ['Barcelona', 'Lyon', 640],
  ['Madrid', 'Lisbon', 625],
];
