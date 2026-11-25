import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query';

import { api } from '@/core/api/client';

import { activityPageSchema, type ActivityFilters } from '../model/activity';

const PAGE_SIZE = 50;

/** Cursor-paginated audit log: each page carries the cursor of the next one. */
export const activityQuery = (filters: ActivityFilters) =>
  infiniteQueryOptions({
    queryKey: ['data-tables', 'activity', filters],
    queryFn: ({ pageParam, signal }) =>
      api.get('/tables/activity', activityPageSchema, {
        params: {
          cursor: pageParam,
          limit: PAGE_SIZE,
          q: filters.q || undefined,
          severity: filters.severity ?? undefined,
        },
        signal,
      }),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

export const useActivity = (filters: ActivityFilters) => useInfiniteQuery(activityQuery(filters));
