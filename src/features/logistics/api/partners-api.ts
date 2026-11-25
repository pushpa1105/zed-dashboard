import { keepPreviousData, queryOptions, useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/core/api/client';
import { useTranslation } from '@/core/i18n/use-translation';

import { carrierDetailSchema, carrierSchema, type CarrierStatus } from '../model/carriers';
import { performanceSchema, type Period } from '../model/performance';
import { breachSchema, slasSchema } from '../model/slas';

import { logisticsKeys } from './logistics-api';

/** Carriers, customer SLAs and performance reports. */
export const partnersApi = {
  carriers: () => api.get('/logistics/carriers', z.array(carrierSchema)),
  carrier: (id: string) => api.get(`/logistics/carriers/${id}`, carrierDetailSchema),
  setCarrierStatus: ({ id, status }: { id: string; status: CarrierStatus }) =>
    api.patch(`/logistics/carriers/${id}`, { status }, carrierSchema),
  slas: () => api.get('/logistics/slas', slasSchema),
  issueCredit: ({ id, amount }: { id: string; amount: number }) =>
    api.post(`/logistics/slas/breaches/${id}/credit`, { amount }, breachSchema),
  performance: (period: Period) =>
    api.get('/logistics/performance', performanceSchema, { params: { period } }),
};

export const partnerKeys = {
  carriers: () => [...logisticsKeys.all, 'carriers'] as const,
  carrier: (id: string) => [...partnerKeys.carriers(), id] as const,
  slas: () => [...logisticsKeys.all, 'slas'] as const,
  performance: (period: Period) => [...logisticsKeys.all, 'performance', period] as const,
};

export const carriersQuery = () =>
  queryOptions({ queryKey: partnerKeys.carriers(), queryFn: partnersApi.carriers });
export const slasQuery = () =>
  queryOptions({ queryKey: partnerKeys.slas(), queryFn: partnersApi.slas });
export const performanceQuery = (period: Period) =>
  queryOptions({
    queryKey: partnerKeys.performance(period),
    queryFn: () => partnersApi.performance(period),
    placeholderData: keepPreviousData,
  });

export const useCarriers = () => useQuery(carriersQuery());
export const useCarrier = (id: string | null) =>
  useQuery({
    queryKey: partnerKeys.carrier(id ?? ''),
    queryFn: () => partnersApi.carrier(id!),
    enabled: id !== null,
  });
export const useSlas = () => useQuery(slasQuery());
export const usePerformance = (period: Period) => useQuery(performanceQuery(period));

/** Activates or suspends a carrier; `next` is the status it moves to. */
export function useSetCarrierStatus(next: CarrierStatus) {
  const { t } = useTranslation('logistics');
  return useMutation({
    mutationFn: (id: string) => partnersApi.setCarrierStatus({ id, status: next }),
    meta: {
      invalidates: [partnerKeys.carriers()],
      successMessage: t(`carriers.toast.${next}`),
    },
  });
}

export function useIssueCredit() {
  const { t } = useTranslation('logistics');
  return useMutation({
    mutationFn: partnersApi.issueCredit,
    meta: { invalidates: [partnerKeys.slas()], successMessage: t('slas.credit.issued') },
  });
}
