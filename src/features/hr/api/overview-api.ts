import { keepPreviousData, queryOptions, useMutation, useQuery } from '@tanstack/react-query';

import { api } from '@/core/api/client';
import { useTranslation } from '@/core/i18n/use-translation';
import type { MutationOptions } from '@/core/query/query-client';

import {
  hrOverviewSchema,
  openingSchema,
  type HrFilters,
  type NewJobInput,
  type Opening,
} from '../model/overview';

import { hrPageKeys } from './hr-api';

export const hrApi = {
  overview: (filters: HrFilters) => api.get('/hr/overview', hrOverviewSchema, { params: filters }),
  createJob: (input: NewJobInput) => api.post('/hr/jobs', input, openingSchema),
};

export const hrKeys = {
  all: ['hr'] as const,
  overviews: () => [...hrKeys.all, 'overview'] as const,
  overview: (filters: HrFilters) => [...hrKeys.overviews(), filters] as const,
};

export const hrOverviewQuery = (filters: HrFilters) =>
  queryOptions({
    queryKey: hrKeys.overview(filters),
    queryFn: () => hrApi.overview(filters),
    placeholderData: keepPreviousData,
  });

export const useHrOverview = (filters: HrFilters) => useQuery(hrOverviewQuery(filters));

export function useCreateJob(options?: MutationOptions<Opening, NewJobInput>) {
  const { t } = useTranslation('hr');
  return useMutation({
    mutationFn: hrApi.createJob,
    ...options,
    meta: {
      invalidates: [hrKeys.overviews(), hrPageKeys.jobs()],
      successMessage: t('newJob.created'),
      ...options?.meta,
    },
  });
}
