import {
  keepPreviousData,
  queryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
} from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/core/api/client';
import { useTranslation } from '@/core/i18n/use-translation';

import {
  apiKeySchema,
  billingSchema,
  createdKeySchema,
  deliverySchema,
  logsPageSchema,
  memberSchema,
  settingsSchema,
  teamSchema,
  usageSchema,
  webhookSchema,
  type KeyForm,
  type LogLevel,
  type Role,
  type Settings,
  type UsageRange,
  type Webhook,
} from '../model/platform';

const ok = z.unknown();

export const platformApi = {
  keys: () => api.get('/saas/keys', z.array(apiKeySchema)),
  createKey: (input: KeyForm) => api.post('/saas/keys', input, createdKeySchema),
  revokeKey: (id: string) => api.delete(`/saas/keys/${id}`, apiKeySchema),
  usage: (range: UsageRange) => api.get('/saas/usage', usageSchema, { params: { range } }),
  logs: (params: { levels: string; q: string; cursor: number }) =>
    api.get('/saas/logs', logsPageSchema, { params }),
  webhooks: () => api.get('/saas/webhooks', z.array(webhookSchema)),
  deliveries: (id: string) => api.get(`/saas/webhooks/${id}/deliveries`, z.array(deliverySchema)),
  setWebhook: ({ id, status }: { id: string; status: Webhook['status'] }) =>
    api.patch(`/saas/webhooks/${id}`, { status }, webhookSchema),
  testWebhook: (id: string) => api.post(`/saas/webhooks/${id}/test`, {}, deliverySchema),
  billing: () => api.get('/saas/billing', billingSchema),
  changePlan: (planId: string) => api.post('/saas/billing/plan', { planId }, ok),
  team: () => api.get('/saas/team', teamSchema),
  setRole: ({ id, role }: { id: string; role: Role }) =>
    api.patch(`/saas/team/members/${id}`, { role }, memberSchema),
  removeMember: (id: string) => api.delete(`/saas/team/members/${id}`, ok),
  invite: (input: { emails: string[]; role: Role }) => api.post('/saas/team/invites', input, ok),
  revokeInvite: (id: string) => api.delete(`/saas/team/invites/${id}`, ok),
  settings: () => api.get('/saas/settings', settingsSchema),
  saveSettings: (input: Settings) => api.put('/saas/settings', input, settingsSchema),
};

export const platformKeys = {
  all: ['saas', 'platform'] as const,
  keys: () => [...platformKeys.all, 'keys'] as const,
  usage: (range: UsageRange) => [...platformKeys.all, 'usage', range] as const,
  logs: (levels: string, q: string) => [...platformKeys.all, 'logs', levels, q] as const,
  webhooks: () => [...platformKeys.all, 'webhooks'] as const,
  deliveries: (id: string) => [...platformKeys.webhooks(), 'deliveries', id] as const,
  billing: () => [...platformKeys.all, 'billing'] as const,
  team: () => [...platformKeys.all, 'team'] as const,
  settings: () => [...platformKeys.all, 'settings'] as const,
};

export const keysQuery = () =>
  queryOptions({ queryKey: platformKeys.keys(), queryFn: platformApi.keys });
export const usageQuery = (range: UsageRange) =>
  queryOptions({
    queryKey: platformKeys.usage(range),
    queryFn: () => platformApi.usage(range),
    placeholderData: keepPreviousData,
  });
export const webhooksQuery = () =>
  queryOptions({ queryKey: platformKeys.webhooks(), queryFn: platformApi.webhooks });
export const billingQuery = () =>
  queryOptions({ queryKey: platformKeys.billing(), queryFn: platformApi.billing });
export const teamQuery = () =>
  queryOptions({ queryKey: platformKeys.team(), queryFn: platformApi.team });
export const settingsQuery = () =>
  queryOptions({ queryKey: platformKeys.settings(), queryFn: platformApi.settings });

export const useApiKeys = () => useQuery(keysQuery());
export const useUsage = (range: UsageRange) => useQuery(usageQuery(range));
export const useWebhooks = () => useQuery(webhooksQuery());
export const useDeliveries = (id: string | null) =>
  useQuery({
    queryKey: platformKeys.deliveries(id ?? ''),
    queryFn: () => platformApi.deliveries(id!),
    enabled: !!id,
  });
export const useBilling = () => useQuery(billingQuery());
export const useTeam = () => useQuery(teamQuery());
export const useSettings = () => useQuery(settingsQuery());

/** Logs paginate with a cursor ("Load older"). */
export const useLogs = (levels: LogLevel[], q: string) =>
  useInfiniteQuery({
    queryKey: platformKeys.logs(levels.join(','), q),
    queryFn: ({ pageParam }) =>
      platformApi.logs({ levels: levels.join(','), q, cursor: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    placeholderData: keepPreviousData,
  });

function useSaasT() {
  return useTranslation('saas').t;
}

export function useCreateKey() {
  return useMutation({
    mutationFn: platformApi.createKey,
    meta: { invalidates: [platformKeys.keys()] },
  });
}
export function useRevokeKey() {
  const t = useSaasT();
  return useMutation({
    mutationFn: platformApi.revokeKey,
    meta: { invalidates: [platformKeys.keys()], successMessage: t('keys.toast.revoked') },
  });
}
export function useSetWebhook() {
  return useMutation({
    mutationFn: platformApi.setWebhook,
    meta: { invalidates: [platformKeys.webhooks()] },
  });
}
export function useTestWebhook() {
  const t = useSaasT();
  return useMutation({
    mutationFn: platformApi.testWebhook,
    meta: { invalidates: [platformKeys.webhooks()], successMessage: t('webhooks.toast.sent') },
  });
}
export function useChangePlan() {
  const t = useSaasT();
  return useMutation({
    mutationFn: platformApi.changePlan,
    meta: { invalidates: [platformKeys.billing()], successMessage: t('billing.toast.changed') },
  });
}
export function useSetRole() {
  const t = useSaasT();
  return useMutation({
    mutationFn: platformApi.setRole,
    meta: { invalidates: [platformKeys.team()], successMessage: t('team.toast.role') },
  });
}
export function useRemoveMember() {
  const t = useSaasT();
  return useMutation({
    mutationFn: platformApi.removeMember,
    meta: { invalidates: [platformKeys.team()], successMessage: t('team.toast.removed') },
  });
}
export function useInvite() {
  const t = useSaasT();
  return useMutation({
    mutationFn: platformApi.invite,
    meta: { invalidates: [platformKeys.team()], successMessage: t('team.toast.invited') },
  });
}
export function useRevokeInvite() {
  const t = useSaasT();
  return useMutation({
    mutationFn: platformApi.revokeInvite,
    meta: { invalidates: [platformKeys.team()], successMessage: t('team.toast.inviteRevoked') },
  });
}
export function useSaveSettings() {
  const t = useSaasT();
  return useMutation({
    mutationFn: platformApi.saveSettings,
    meta: { invalidates: [platformKeys.settings()], successMessage: t('settings.toast.saved') },
  });
}
