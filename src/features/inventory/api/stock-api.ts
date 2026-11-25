import { keepPreviousData, queryOptions, useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/core/api/client';
import { useTranslation } from '@/core/i18n/use-translation';

import {
  batchSchema,
  binDetailSchema,
  binLayoutSchema,
  valuationSchema,
  type MoveStockInput,
  type ValuationMethod,
} from '../model/stock';

import { inventoryKeys } from './inventory-api';

const stockApi = {
  batches: () => api.get('/inventory/batches', z.array(batchSchema)),
  quarantine: (id: string) => api.post(`/inventory/batches/${id}/quarantine`, {}, batchSchema),
  bins: (warehouse: string) =>
    api.get('/inventory/bins', binLayoutSchema, { params: { warehouse } }),
  bin: (warehouse: string, code: string) =>
    api.get(`/inventory/bins/${warehouse}/${code}`, binDetailSchema),
  moveStock: (input: MoveStockInput) => api.post('/inventory/bins/move', input),
  valuation: (method: ValuationMethod) =>
    api.get('/inventory/valuation', valuationSchema, { params: { method } }),
};

const stockKeys = {
  batches: () => [...inventoryKeys.all, 'batches'] as const,
  bins: (warehouse: string) => [...inventoryKeys.all, 'bins', warehouse] as const,
  bin: (warehouse: string, code: string) => [...inventoryKeys.all, 'bin', warehouse, code] as const,
  valuation: (method: ValuationMethod) => [...inventoryKeys.all, 'valuation', method] as const,
};

export const batchesQuery = () =>
  queryOptions({ queryKey: stockKeys.batches(), queryFn: stockApi.batches });
export const binsQuery = (warehouse: string) =>
  queryOptions({
    queryKey: stockKeys.bins(warehouse),
    queryFn: () => stockApi.bins(warehouse),
    placeholderData: keepPreviousData,
  });
export const valuationQuery = (method: ValuationMethod) =>
  queryOptions({
    queryKey: stockKeys.valuation(method),
    queryFn: () => stockApi.valuation(method),
    placeholderData: keepPreviousData,
  });

export const useBatches = () => useQuery(batchesQuery());
export const useBins = (warehouse: string) => useQuery(binsQuery(warehouse));
export const useValuation = (method: ValuationMethod) => useQuery(valuationQuery(method));
export const useBin = (warehouse: string, code: string | null) =>
  useQuery({
    queryKey: stockKeys.bin(warehouse, code ?? ''),
    queryFn: () => stockApi.bin(warehouse, code!),
    enabled: !!code,
  });

export function useQuarantineBatch() {
  const { t } = useTranslation('inventory', { keyPrefix: 'batches.quarantine' });
  return useMutation({
    mutationFn: stockApi.quarantine,
    meta: { invalidates: [inventoryKeys.all], successMessage: t('done') },
  });
}

export function useMoveStock() {
  const { t } = useTranslation('inventory', { keyPrefix: 'bins.move' });
  return useMutation({
    mutationFn: stockApi.moveStock,
    meta: { invalidates: [inventoryKeys.all], successMessage: t('done') },
  });
}
