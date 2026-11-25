import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/core/api/client';

import { cashForecastSchema, type Scenario } from '../model/forecast';

export const cashForecastQuery = (scenario: Scenario) =>
  queryOptions({
    queryKey: ['erp', 'cash-forecast', scenario] as const,
    queryFn: () => api.get('/erp/cash-forecast', cashForecastSchema, { params: { scenario } }),
    placeholderData: keepPreviousData,
  });

export const useCashForecast = (scenario: Scenario) => useQuery(cashForecastQuery(scenario));
