import { keepPreviousData, queryOptions, useMutation, useQuery } from '@tanstack/react-query';

import { api } from '@/core/api/client';
import { useTranslation } from '@/core/i18n/use-translation';

import {
  payoutsSchema,
  returnRequestSchema,
  returnsResponseSchema,
  transactionsPageSchema,
  type ReturnStatus,
  type ReturnTab,
  type TransactionsSearch,
} from '../model/finance';

import { storeKeys } from './store-api';

export const financeApi = {
  transactions: (search: TransactionsSearch) =>
    api.get('/ecommerce/transactions', transactionsPageSchema, { params: search }),
  payouts: () => api.get('/ecommerce/payouts', payoutsSchema),
  returns: (status: ReturnTab) =>
    api.get('/ecommerce/returns', returnsResponseSchema, { params: { status } }),
  setReturnStatus: ({ id, status }: { id: string; status: ReturnStatus }) =>
    api.patch(`/ecommerce/returns/${id}`, { status }, returnRequestSchema),
};

export const financeKeys = {
  transactions: (search: TransactionsSearch) => [...storeKeys.all, 'transactions', search] as const,
  payouts: () => [...storeKeys.all, 'payouts'] as const,
  returns: () => [...storeKeys.all, 'returns'] as const,
  returnsList: (status: ReturnTab) => [...financeKeys.returns(), status] as const,
};

export const transactionsQuery = (search: TransactionsSearch) =>
  queryOptions({
    queryKey: financeKeys.transactions(search),
    queryFn: () => financeApi.transactions(search),
    placeholderData: keepPreviousData,
  });
export const payoutsQuery = () =>
  queryOptions({ queryKey: financeKeys.payouts(), queryFn: financeApi.payouts });
export const returnsQuery = (status: ReturnTab) =>
  queryOptions({
    queryKey: financeKeys.returnsList(status),
    queryFn: () => financeApi.returns(status),
    placeholderData: keepPreviousData,
  });

export const useTransactions = (search: TransactionsSearch) => useQuery(transactionsQuery(search));
export const usePayouts = () => useQuery(payoutsQuery());
export const useReturns = (status: ReturnTab) => useQuery(returnsQuery(status));

/** Approving, rejecting or refunding a return. Refunds also change orders and the ledger. */
export function useSetReturnStatus() {
  const { t } = useTranslation('ecommerce');
  return useMutation({
    mutationFn: financeApi.setReturnStatus,
    meta: {
      invalidates: [storeKeys.all],
      successMessage: t('returns.toast.updated'),
    },
  });
}
