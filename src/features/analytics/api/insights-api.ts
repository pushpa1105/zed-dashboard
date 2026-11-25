import { keepPreviousData, queryOptions, useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/core/api/client';
import { useTranslation } from '@/core/i18n/use-translation';

import type { Range } from '../model/analytics';
import {
  alertRuleSchema,
  alertSchema,
  countryDetailSchema,
  countryRowSchema,
  technologySchema,
  type AlertRuleInput,
  type AlertStatus,
} from '../model/insights';

import { analyticsPageKeys } from './analytics-api';

/** Request functions for the geography, technology and alerts pages. */
const insightsApi = {
  geography: (range: Range) =>
    api.get('/analytics/geography', z.array(countryRowSchema), { params: { range } }),
  country: (code: string, range: Range) =>
    api.get(`/analytics/geography/${code}`, countryDetailSchema, { params: { range } }),
  technology: (range: Range) =>
    api.get('/analytics/technology', technologySchema, { params: { range } }),
  alerts: () => api.get('/analytics/alerts', z.array(alertSchema)),
  setAlertStatus: ({ id, status }: { id: string; status: AlertStatus }) =>
    api.patch(`/analytics/alerts/${id}`, { status }, alertSchema),
  rules: () => api.get('/analytics/alert-rules', z.array(alertRuleSchema)),
  createRule: (input: AlertRuleInput) => api.post('/analytics/alert-rules', input, alertRuleSchema),
  toggleRule: ({ id, enabled }: { id: string; enabled: boolean }) =>
    api.patch(`/analytics/alert-rules/${id}`, { enabled }, alertRuleSchema),
  removeRule: (id: string) => api.delete(`/analytics/alert-rules/${id}`),
};

const insightsKeys = {
  geography: (range: Range) => [...analyticsPageKeys.all, 'geography', range] as const,
  country: (code: string, range: Range) =>
    [...analyticsPageKeys.all, 'country', code, range] as const,
  technology: (range: Range) => [...analyticsPageKeys.all, 'technology', range] as const,
  alerts: () => [...analyticsPageKeys.all, 'alerts'] as const,
  rules: () => [...analyticsPageKeys.all, 'alert-rules'] as const,
};

export const geographyQuery = (range: Range) =>
  queryOptions({
    queryKey: insightsKeys.geography(range),
    queryFn: () => insightsApi.geography(range),
    placeholderData: keepPreviousData,
  });

export const technologyQuery = (range: Range) =>
  queryOptions({
    queryKey: insightsKeys.technology(range),
    queryFn: () => insightsApi.technology(range),
    placeholderData: keepPreviousData,
  });

export const alertsQuery = () =>
  queryOptions({ queryKey: insightsKeys.alerts(), queryFn: insightsApi.alerts });

export const rulesQuery = () =>
  queryOptions({ queryKey: insightsKeys.rules(), queryFn: insightsApi.rules });

export const useGeography = (range: Range) => useQuery(geographyQuery(range));
export const useCountry = (code: string | null, range: Range) =>
  useQuery({
    queryKey: insightsKeys.country(code ?? '', range),
    queryFn: () => insightsApi.country(code!, range),
    enabled: !!code,
  });
export const useTechnology = (range: Range) => useQuery(technologyQuery(range));
export const useAlerts = () => useQuery(alertsQuery());
export const useAlertRules = () => useQuery(rulesQuery());

export function useSetAlertStatus() {
  const { t } = useTranslation('analytics');
  return useMutation({
    mutationFn: insightsApi.setAlertStatus,
    meta: {
      invalidates: [insightsKeys.alerts()],
      successMessage: t('alerts.updated'),
    },
  });
}

export function useCreateRule() {
  const { t } = useTranslation('analytics');
  return useMutation({
    mutationFn: insightsApi.createRule,
    meta: { invalidates: [insightsKeys.rules()], successMessage: t('alerts.rules.created') },
  });
}

export function useToggleRule() {
  const { t } = useTranslation('analytics');
  return useMutation({
    mutationFn: insightsApi.toggleRule,
    meta: { invalidates: [insightsKeys.rules()], successMessage: t('alerts.rules.updated') },
  });
}

export function useRemoveRule() {
  const { t } = useTranslation('analytics');
  return useMutation({
    mutationFn: insightsApi.removeRule,
    meta: { invalidates: [insightsKeys.rules()], successMessage: t('alerts.rules.deleted') },
  });
}
