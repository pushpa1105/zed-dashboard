import { useCallback, useMemo } from 'react';

import { useSearchParams } from '@/core/router/router';

import { ORDERS_SEARCH_DEFAULTS, ordersSearchSchema, type OrdersSearch } from '../model/order';

/** Keys whose change sends the user back to page 1. */
const FILTER_KEYS: Array<keyof OrdersSearch> = [
  'q',
  'status',
  'channel',
  'from',
  'to',
  'min',
  'max',
  'filters',
  'pageSize',
  'sort',
];

/**
 * Orders table state, stored in the URL: shareable, bookmarkable and kept
 * across reloads and back/forward navigation. Defaults are omitted from the URL.
 */
export function useOrdersSearch() {
  const [params, setParams] = useSearchParams();

  const search = useMemo(
    () => ordersSearchSchema.parse(Object.fromEntries(params.entries())),
    [params],
  );

  const update = useCallback(
    (patch: Partial<OrdersSearch>) => {
      setParams(
        (prev) => {
          const current = ordersSearchSchema.parse(Object.fromEntries(prev.entries()));
          const next: OrdersSearch = { ...current, ...patch };
          if (FILTER_KEYS.some((key) => key in patch && patch[key] !== current[key])) {
            next.page = patch.page ?? 1;
          }
          const out = new URLSearchParams();
          for (const [key, value] of Object.entries(next)) {
            if (value !== ORDERS_SEARCH_DEFAULTS[key as keyof OrdersSearch])
              out.set(key, String(value));
          }
          return out;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const reset = useCallback(
    () => update({ ...ORDERS_SEARCH_DEFAULTS, pageSize: search.pageSize, sort: search.sort }),
    [update, search.pageSize, search.sort],
  );

  return { search, update, reset, query: params.toString(), setQuery: setParams };
}
