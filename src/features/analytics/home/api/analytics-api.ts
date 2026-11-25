import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/core/api/client';
import type { Range } from '@/features/analytics/model/analytics';

import { analyticsOverviewSchema, visitorsSchema, type Granularity } from '../model/overview';

export const analyticsApi = {
  overview: (range: Range) =>
    api.get('/analytics/overview', analyticsOverviewSchema, { params: { range } }),
  visitors: (granularity: Granularity) =>
    api.get('/analytics/visitors', visitorsSchema, { params: { granularity } }),
};

export const analyticsKeys = {
  all: ['analytics', 'home'] as const,
  overview: (range: Range) => [...analyticsKeys.all, 'overview', range] as const,
  visitors: (granularity: Granularity) => [...analyticsKeys.all, 'visitors', granularity] as const,
};

export const analyticsOverviewQuery = (range: Range) =>
  queryOptions({
    queryKey: analyticsKeys.overview(range),
    queryFn: () => analyticsApi.overview(range),
    placeholderData: keepPreviousData,
  });

export const visitorsQuery = (granularity: Granularity) =>
  queryOptions({
    queryKey: analyticsKeys.visitors(granularity),
    queryFn: () => analyticsApi.visitors(granularity),
    placeholderData: keepPreviousData,
  });

export const useAnalyticsOverview = (range: Range) => useQuery(analyticsOverviewQuery(range));
export const useVisitors = (granularity: Granularity) => useQuery(visitorsQuery(granularity));
