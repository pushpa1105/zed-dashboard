import { queryOptions, useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/core/api/client';
import { useTranslation } from '@/core/i18n/use-translation';

import {
  auditEventSchema,
  customerDetailSchema,
  customerSchema,
  flagSchema,
  incidentSchema,
  statusSchema,
  type CustomerPlan,
  type FlagPatch,
  type IncidentForm,
} from '../model/admin';

export const adminApi = {
  customers: () => api.get('/saas/customers', z.array(customerSchema)),
  customer: (id: string) => api.get(`/saas/customers/${id}`, customerDetailSchema),
  changeCustomerPlan: ({ id, plan }: { id: string; plan: CustomerPlan }) =>
    api.post(`/saas/customers/${id}/plan`, { plan }, customerDetailSchema),
  extendTrial: ({ id, days }: { id: string; days: number }) =>
    api.post(`/saas/customers/${id}/trial`, { days }, customerDetailSchema),
  flags: () => api.get('/saas/flags', z.array(flagSchema)),
  updateFlag: ({ id, ...patch }: FlagPatch) => api.patch(`/saas/flags/${id}`, patch, flagSchema),
  audit: () => api.get('/saas/audit', z.array(auditEventSchema)),
  status: () => api.get('/saas/status', statusSchema),
  declareIncident: (input: IncidentForm) =>
    api.post('/saas/status/incidents', input, incidentSchema),
  resolveIncident: (id: string) =>
    api.post(`/saas/status/incidents/${id}/resolve`, {}, incidentSchema),
};

export const adminKeys = {
  all: ['saas', 'admin'] as const,
  customers: () => [...adminKeys.all, 'customers'] as const,
  customer: (id: string) => [...adminKeys.customers(), id] as const,
  flags: () => [...adminKeys.all, 'flags'] as const,
  audit: () => [...adminKeys.all, 'audit'] as const,
  status: () => [...adminKeys.all, 'status'] as const,
};

export const customersQuery = () =>
  queryOptions({ queryKey: adminKeys.customers(), queryFn: adminApi.customers });
export const customerQuery = (id: string) =>
  queryOptions({ queryKey: adminKeys.customer(id), queryFn: () => adminApi.customer(id) });
export const flagsQuery = () =>
  queryOptions({ queryKey: adminKeys.flags(), queryFn: adminApi.flags });
export const auditQuery = () =>
  queryOptions({ queryKey: adminKeys.audit(), queryFn: adminApi.audit });
export const statusQuery = () =>
  queryOptions({ queryKey: adminKeys.status(), queryFn: adminApi.status });

export const useCustomers = () => useQuery(customersQuery());
export const useCustomer = (id: string) => useQuery(customerQuery(id));
export const useFlags = () => useQuery(flagsQuery());
export const useAudit = () => useQuery(auditQuery());
export const useStatus = () => useQuery(statusQuery());

export function useChangeCustomerPlan() {
  const { t } = useTranslation('saas');
  return useMutation({
    mutationFn: adminApi.changeCustomerPlan,
    meta: { invalidates: [adminKeys.customers()], successMessage: t('customer.toast.plan') },
  });
}
export function useExtendTrial() {
  const { t } = useTranslation('saas');
  return useMutation({
    mutationFn: adminApi.extendTrial,
    meta: { invalidates: [adminKeys.customers()], successMessage: t('customer.toast.trial') },
  });
}
export function useUpdateFlag() {
  const { t } = useTranslation('saas');
  return useMutation({
    mutationFn: adminApi.updateFlag,
    meta: { invalidates: [adminKeys.flags()], successMessage: t('flags.toast.saved') },
  });
}
export function useDeclareIncident() {
  const { t } = useTranslation('saas');
  return useMutation({
    mutationFn: adminApi.declareIncident,
    meta: { invalidates: [adminKeys.status()], successMessage: t('status.toast.declared') },
  });
}
export function useResolveIncident() {
  const { t } = useTranslation('saas');
  return useMutation({
    mutationFn: adminApi.resolveIncident,
    meta: { invalidates: [adminKeys.status()], successMessage: t('status.toast.resolved') },
  });
}
