import { queryOptions, useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/core/api/client';
import { useTranslation } from '@/core/i18n/use-translation';
import { erpKeys } from '@/features/erp/api/erp-api';

import { customerBalanceSchema, salesOrderSchema, type SoAction } from '../model/sales';

export const salesApi = {
  receivables: () => api.get('/erp/receivables', z.array(customerBalanceSchema)),
  remind: (id: string) =>
    api.post(`/erp/receivables/${id}/reminders`, undefined, customerBalanceSchema),
  salesOrders: () => api.get('/erp/sales-orders', z.array(salesOrderSchema)),
  salesOrderAction: ({ id, action }: { id: string; action: SoAction }) =>
    api.patch(`/erp/sales-orders/${id}`, { action }, salesOrderSchema),
};

export const salesKeys = {
  receivables: ['erp', 'receivables'] as const,
  salesOrders: ['erp', 'sales-orders'] as const,
};

export const receivablesQuery = () =>
  queryOptions({ queryKey: salesKeys.receivables, queryFn: salesApi.receivables });
export const salesOrdersQuery = () =>
  queryOptions({ queryKey: salesKeys.salesOrders, queryFn: salesApi.salesOrders });

export const useReceivables = () => useQuery(receivablesQuery());
export const useSalesOrders = () => useQuery(salesOrdersQuery());

export function useSendReminder() {
  const { t } = useTranslation('erp', { keyPrefix: 'receivables' });
  return useMutation({
    mutationFn: salesApi.remind,
    meta: {
      invalidates: [salesKeys.receivables, erpKeys.invoices()],
      successMessage: t('reminder.sent'),
      errorMessage: t('reminder.failed'),
    },
  });
}

/** Invoicing also changes receivables and the cash forecast, so those refresh too. */
export function useSalesOrderAction() {
  const { t } = useTranslation('erp', { keyPrefix: 'salesOrders' });
  return useMutation({
    mutationFn: salesApi.salesOrderAction,
    meta: {
      invalidates: [
        salesKeys.salesOrders,
        salesKeys.receivables,
        erpKeys.invoices(),
        ['erp', 'cash-forecast'],
      ],
      errorMessage: t('actionFailed'),
    },
  });
}
