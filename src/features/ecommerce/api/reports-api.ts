import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/core/api/client';

import { salesReportSchema, type SalesReportSearch } from '../model/reports';

import { storeKeys } from './store-api';

export const salesReportQuery = (search: SalesReportSearch) =>
  queryOptions({
    queryKey: [...storeKeys.all, 'sales-report', search] as const,
    queryFn: () => api.get('/ecommerce/reports/sales', salesReportSchema, { params: search }),
    placeholderData: keepPreviousData,
  });

export const useSalesReport = (search: SalesReportSearch) => useQuery(salesReportQuery(search));
