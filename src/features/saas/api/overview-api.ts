import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { api } from '@/core/api/client';
import { useTranslation } from '@/core/i18n/use-translation';
import { notify } from '@/core/notify/notify';

import {
  integrationSchema,
  saasOverviewSchema,
  type SaasOverview,
  type SaasRange,
} from '../model/overview';

export const saasApi = {
  overview: (range: SaasRange) =>
    api.get('/dashboards/saas/overview', saasOverviewSchema, { params: { range } }),
  setIntegration: ({ id, enabled }: { id: string; enabled: boolean }) =>
    api.patch(`/dashboards/saas/integrations/${id}`, { enabled }, integrationSchema),
};

export const saasKeys = {
  all: ['saas'] as const,
  overview: (range: SaasRange) => [...saasKeys.all, 'overview', range] as const,
};

export const saasOverviewQuery = (range: SaasRange) =>
  queryOptions({
    queryKey: saasKeys.overview(range),
    queryFn: () => saasApi.overview(range),
    placeholderData: keepPreviousData,
  });

export const useSaasOverview = (range: SaasRange) => useQuery(saasOverviewQuery(range));

/** Optimistic toggle: the switch flips instantly and rolls back on error. */
export function useToggleIntegration() {
  const { t } = useTranslation('saas', { keyPrefix: 'overview' });
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saasApi.setIntegration,
    meta: { invalidates: [saasKeys.all] },
    onMutate: async ({ id, enabled }) => {
      await queryClient.cancelQueries({ queryKey: saasKeys.all });
      const snapshots = queryClient.getQueriesData<SaasOverview>({ queryKey: saasKeys.all });
      queryClient.setQueriesData<SaasOverview>({ queryKey: saasKeys.all }, (old) =>
        old && 'integrations' in old
          ? {
              ...old,
              integrations: old.integrations.map((i) => (i.id === id ? { ...i, enabled } : i)),
            }
          : old,
      );
      return { snapshots };
    },
    onError: (_error, _vars, context) => {
      context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSuccess: (integration) => {
      // Built here (not in meta) because the message depends on the response.
      notify.success(
        t(integration.enabled ? 'integrations.connected' : 'integrations.disconnected', {
          name: integration.name,
        }),
      );
    },
  });
}
