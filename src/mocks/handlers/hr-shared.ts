import { env } from '@/core/config/env';

import { networkDelay, requireAuth } from '../utils';

/** Helpers shared by the HR mock handler files. */

export function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export const DEPARTMENTS = [
  'Engineering',
  'Design',
  'Sales',
  'Marketing',
  'Support',
  'Finance',
  'People',
] as const;

export const url = (path: string) => `${env.API_URL}/hr${path}`;
export const DAY = 86_400_000;
export const startOfToday = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
};
export const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export const guard = async (request: Request) => {
  await networkDelay();
  const auth = requireAuth(request);
  return 'error' in auth ? auth.error : null;
};

/** The slice of an employee record the people-ops handlers need. */
export type Staff = { id: string; name: string; department: string };
