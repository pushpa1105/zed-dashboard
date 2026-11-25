import { useSearchParams } from '@/core/router/router';

import { COMPARES, RANGES, type Compare, type Range } from '../model/analytics';

const pick = <T extends string>(value: string | null, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

/** Reads `?range=` for a page loader. */
export const rangeFromRequest = (request: Request): Range =>
  pick(new URL(request.url).searchParams.get('range'), RANGES, '28d');

/** Date range + comparison mode kept in the URL, shared by every analytics page. */
export function useRangeParams() {
  const [params, setParams] = useSearchParams();
  const range = pick(params.get('range'), RANGES, '28d');
  const compare = pick(params.get('compare'), COMPARES, 'previous');

  const set = (key: 'range' | 'compare', value: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set(key, value);
        return next;
      },
      { replace: true },
    );

  return {
    range,
    compare,
    setRange: (value: Range) => set('range', value),
    setCompare: (value: Compare) => set('compare', value),
  };
}
