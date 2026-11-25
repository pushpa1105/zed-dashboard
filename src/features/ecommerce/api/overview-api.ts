import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/core/api/client';

import { ecommerceOverviewSchema, type EcommerceYear } from '../model/overview';

export const ecommerceApi = {
  overview: (year: EcommerceYear) =>
    api.get('/dashboards/ecommerce/overview', ecommerceOverviewSchema, { params: { year } }),
};

export const ecommerceKeys = {
  all: ['ecommerce'] as const,
  overview: (year: EcommerceYear) => [...ecommerceKeys.all, 'overview', year] as const,
};

export const ecommerceOverviewQuery = (year: EcommerceYear) =>
  queryOptions({
    queryKey: ecommerceKeys.overview(year),
    queryFn: () => ecommerceApi.overview(year),
    placeholderData: keepPreviousData,
  });

export const useEcommerceOverview = (year: EcommerceYear) => useQuery(ecommerceOverviewQuery(year));
