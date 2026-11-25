import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/core/api/client';

import {
  dealsSchema,
  marketingOverviewSchema,
  type DealInterval,
  type MarketingPeriod,
} from '../model/marketing';

export const marketingApi = {
  overview: (period: MarketingPeriod) =>
    api.get('/analytics/campaigns/overview', marketingOverviewSchema, { params: { period } }),
  deals: (interval: DealInterval) =>
    api.get('/analytics/campaigns/deals', dealsSchema, { params: { interval } }),
};

export const marketingKeys = {
  all: ['analytics', 'campaigns'] as const,
  overview: (period: MarketingPeriod) => [...marketingKeys.all, 'overview', period] as const,
  deals: (interval: DealInterval) => [...marketingKeys.all, 'deals', interval] as const,
};

export const marketingOverviewQuery = (period: MarketingPeriod) =>
  queryOptions({
    queryKey: marketingKeys.overview(period),
    queryFn: () => marketingApi.overview(period),
    placeholderData: keepPreviousData,
  });

export const dealsQuery = (interval: DealInterval) =>
  queryOptions({
    queryKey: marketingKeys.deals(interval),
    queryFn: () => marketingApi.deals(interval),
    placeholderData: keepPreviousData,
  });

export const useMarketingOverview = (period: MarketingPeriod) =>
  useQuery(marketingOverviewQuery(period));

export const useDeals = (interval: DealInterval) => useQuery(dealsQuery(interval));
