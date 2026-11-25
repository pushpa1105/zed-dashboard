import { queryOptions, useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/core/api/client';
import { useTranslation } from '@/core/i18n/use-translation';
import type { MutationOptions } from '@/core/query/query-client';

import { operationSchema, projectsOverviewSchema, type Operation } from '../model/projects';

export const projectsApi = {
  overview: () => api.get('/erp/projects/overview', projectsOverviewSchema),
  operations: () => api.get('/erp/projects/operations', z.array(operationSchema)),
  updateProgress: ({ id, progress }: { id: string; progress: number }) =>
    api.patch(`/erp/projects/operations/${id}`, { progress }, operationSchema),
  remove: (id: string) => api.delete(`/erp/projects/operations/${id}`),
  restore: (id: string) =>
    api.post(`/erp/projects/operations/${id}/restore`, undefined, operationSchema),
};

export const projectsKeys = {
  all: ['erp', 'projects'] as const,
  overview: () => [...projectsKeys.all, 'overview'] as const,
  operations: () => [...projectsKeys.all, 'operations'] as const,
};

export const projectsOverviewQuery = () =>
  queryOptions({ queryKey: projectsKeys.overview(), queryFn: projectsApi.overview });

export const operationsQuery = () =>
  queryOptions({ queryKey: projectsKeys.operations(), queryFn: projectsApi.operations });

export const useProjectsOverview = () => useQuery(projectsOverviewQuery());
export const useOperations = () => useQuery(operationsQuery());

export function useUpdateOperation(
  options?: MutationOptions<Operation, { id: string; progress: number }>,
) {
  const { t } = useTranslation('erp', { keyPrefix: 'projects' });
  return useMutation({
    mutationFn: projectsApi.updateProgress,
    ...options,
    meta: {
      invalidates: [projectsKeys.operations()],
      successMessage: t('operations.toast.updated'),
      ...options?.meta,
    },
  });
}

/** No success message here: the caller shows an "undo" toast instead. */
export function useDeleteOperation(options?: MutationOptions<unknown, string>) {
  return useMutation({
    mutationFn: projectsApi.remove,
    ...options,
    meta: { invalidates: [projectsKeys.operations()], ...options?.meta },
  });
}

export function useRestoreOperation(options?: MutationOptions<Operation, string>) {
  const { t } = useTranslation('erp', { keyPrefix: 'projects' });
  return useMutation({
    mutationFn: projectsApi.restore,
    ...options,
    meta: {
      invalidates: [projectsKeys.operations()],
      successMessage: t('operations.toast.restored'),
      ...options?.meta,
    },
  });
}
