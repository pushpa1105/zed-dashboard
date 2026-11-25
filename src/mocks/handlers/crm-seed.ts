import { env } from '@/core/config/env';

import { networkDelay, requireAuth } from '../utils';

/** Seeding helpers shared by the CRM mock handlers. */

export const DAY = 86_400_000;
export const HOUR = 3_600_000;
export const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
export const iso = (ms: number) => new Date(ms).toISOString();

export function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** `pick` and `between` bound to one seeded generator. */
export function seededHelpers(seed: number) {
  const rand = rng(seed);
  return {
    rand,
    pick: <T>(list: readonly T[]) => list[Math.floor(rand() * list.length)]!,
    between: (min: number, max: number) => Math.round(min + rand() * (max - min)),
  };
}

export const OWNERS = ['Maya Chen', 'Daniel Okafor', 'Sofia Alvarez', 'Lucas Meyer', 'Priya Raman'];

export const crmUrl = (path: string) => `${env.API_URL}/crm${path}`;

/** Simulated latency plus the auth check every handler starts with. */
export async function authorize(request: Request) {
  await networkDelay();
  return requireAuth(request);
}

export const fullName = (user: { firstName: string; lastName: string }) =>
  `${user.firstName} ${user.lastName}`;
