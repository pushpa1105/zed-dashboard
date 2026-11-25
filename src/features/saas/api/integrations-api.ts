import { queryOptions, useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/core/api/client';
import { useTranslation } from '@/core/i18n/use-translation';

import { integrationSchema, type IntegrationConfig } from '../model/integrations';

const integrationsApi = {
  list: () => api.get('/saas/integrations', z.array(integrationSchema)),
  connect: ({ id, ...config }: IntegrationConfig & { id: string }) =>
    api.put(`/saas/integrations/${id}`, config, integrationSchema),
  disconnect: (id: string) => api.delete(`/saas/integrations/${id}`, integrationSchema),
};

const integrationKeys = { all: ['saas', 'integrations'] as const };

export const integrationsQuery = () =>
  queryOptions({ queryKey: integrationKeys.all, queryFn: integrationsApi.list });
export const useIntegrations = () => useQuery(integrationsQuery());

export function useConnectIntegration() {
  const { t } = useTranslation('saas');
  return useMutation({
    mutationFn: integrationsApi.connect,
    meta: { invalidates: [integrationKeys.all], successMessage: t('integrations.toast.saved') },
  });
}
export function useDisconnectIntegration() {
  const { t } = useTranslation('saas');
  return useMutation({
    mutationFn: integrationsApi.disconnect,
    meta: {
      invalidates: [integrationKeys.all],
      successMessage: t('integrations.toast.disconnected'),
    },
  });
}
