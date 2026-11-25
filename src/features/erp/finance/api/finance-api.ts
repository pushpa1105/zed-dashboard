import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/core/api/client';

import { financeOverviewSchema, type FinanceFilters } from '../model/overview';

export const financeApi = {
  overview: (filters: FinanceFilters) =>
    api.get('/erp/finance/overview', financeOverviewSchema, { params: filters }),
};

export const financeKeys = {
  all: ['erp', 'finance'] as const,
  overview: (filters: FinanceFilters) => [...financeKeys.all, 'overview', filters] as const,
};

export const financeOverviewQuery = (filters: FinanceFilters) =>
  queryOptions({
    queryKey: financeKeys.overview(filters),
    queryFn: () => financeApi.overview(filters),
    placeholderData: keepPreviousData,
  });

export const useFinanceOverview = (filters: FinanceFilters) =>
  useQuery(financeOverviewQuery(filters));
