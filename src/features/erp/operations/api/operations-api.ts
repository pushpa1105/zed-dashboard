import { queryOptions, useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/core/api/client';
import { useTranslation } from '@/core/i18n/use-translation';

import {
  assetSchema,
  expenseClaimSchema,
  purchaseOrderSchema,
  reconciliationSchema,
  type AssetInput,
  type PoAction,
} from '../model/operations';

export const operationsApi = {
  purchaseOrders: () => api.get('/erp/purchase-orders', z.array(purchaseOrderSchema)),
  purchaseOrder: (id: string) => api.get(`/erp/purchase-orders/${id}`, purchaseOrderSchema),
  purchaseOrderAction: ({ id, action }: { id: string; action: PoAction }) =>
    api.patch(`/erp/purchase-orders/${id}`, { action }, purchaseOrderSchema),
  reconciliation: () => api.get('/erp/reconciliation', reconciliationSchema),
  match: (input: { statementId: string; ledgerId: string }) =>
    api.post('/erp/reconciliation/matches', input, reconciliationSchema),
  unmatch: (statementId: string) =>
    api.delete(`/erp/reconciliation/matches/${statementId}`, reconciliationSchema),
  assets: () => api.get('/erp/assets', z.array(assetSchema)),
  createAsset: (input: AssetInput) => api.post('/erp/assets', input, assetSchema),
  expenseClaims: () => api.get('/erp/expense-claims', z.array(expenseClaimSchema)),
  reviewClaim: ({ id, ...body }: { id: string; action: 'approve' | 'reject'; note?: string }) =>
    api.patch(`/erp/expense-claims/${id}`, body, expenseClaimSchema),
};

export const operationsKeys = {
  purchaseOrders: ['erp', 'purchase-orders'] as const,
  purchaseOrder: (id: string) => [...operationsKeys.purchaseOrders, id] as const,
  reconciliation: ['erp', 'reconciliation'] as const,
  assets: ['erp', 'assets'] as const,
  expenseClaims: ['erp', 'expense-claims'] as const,
};

export const purchaseOrdersQuery = () =>
  queryOptions({ queryKey: operationsKeys.purchaseOrders, queryFn: operationsApi.purchaseOrders });
export const purchaseOrderQuery = (id: string) =>
  queryOptions({
    queryKey: operationsKeys.purchaseOrder(id),
    queryFn: () => operationsApi.purchaseOrder(id),
  });
export const reconciliationQuery = () =>
  queryOptions({ queryKey: operationsKeys.reconciliation, queryFn: operationsApi.reconciliation });
export const assetsQuery = () =>
  queryOptions({ queryKey: operationsKeys.assets, queryFn: operationsApi.assets });
export const expenseClaimsQuery = () =>
  queryOptions({ queryKey: operationsKeys.expenseClaims, queryFn: operationsApi.expenseClaims });

export const usePurchaseOrders = () => useQuery(purchaseOrdersQuery());
export const usePurchaseOrder = (id: string) => useQuery(purchaseOrderQuery(id));
export const useReconciliation = () => useQuery(reconciliationQuery());
export const useAssets = () => useQuery(assetsQuery());
export const useExpenseClaims = () => useQuery(expenseClaimsQuery());

export function usePurchaseOrderAction() {
  const { t } = useTranslation('erp');
  return useMutation({
    mutationFn: operationsApi.purchaseOrderAction,
    meta: {
      invalidates: [operationsKeys.purchaseOrders],
      errorMessage: t('purchaseOrders.actionFailed'),
    },
  });
}

/** Match and unmatch share error handling and refresh the same view. */
function useReconciliationMutation<T>(mutationFn: (input: T) => Promise<unknown>) {
  const { t } = useTranslation('erp');
  return useMutation({
    mutationFn,
    meta: {
      invalidates: [operationsKeys.reconciliation],
      errorMessage: t('reconciliation.actionFailed'),
    },
  });
}
export const useMatch = () => useReconciliationMutation(operationsApi.match);
export const useUnmatch = () => useReconciliationMutation(operationsApi.unmatch);

export function useCreateAsset() {
  const { t } = useTranslation('erp');
  return useMutation({
    mutationFn: operationsApi.createAsset,
    meta: {
      invalidates: [operationsKeys.assets],
      successMessage: t('assets.form.saved'),
      errorMessage: t('assets.form.saveFailed'),
    },
  });
}

export function useReviewClaim() {
  const { t } = useTranslation('erp');
  return useMutation({
    mutationFn: operationsApi.reviewClaim,
    meta: {
      invalidates: [operationsKeys.expenseClaims],
      errorMessage: t('expenses.actionFailed'),
    },
  });
}
