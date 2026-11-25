import { keepPreviousData, queryOptions, useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/core/api/client';
import { useTranslation } from '@/core/i18n/use-translation';

import {
  countSheetSchema,
  itemDetailSchema,
  itemRowSchema,
  movementRowSchema,
  overviewSchema,
  purchaseOrderSchema,
  receiptSchema,
  reorderLineSchema,
  supplierDetailSchema,
  supplierSchema,
  transferSchema,
  warehouseSchema,
  type MovementFilters,
  type PurchaseOrderInput,
  type ReorderSettings,
  type TransferInput,
  type TransferStatus,
} from '../model/inventory';

export const inventoryApi = {
  overview: () => api.get('/inventory/overview', overviewSchema),
  items: (warehouse?: string) =>
    api.get('/inventory/items', z.array(itemRowSchema), { params: { warehouse } }),
  item: (sku: string) => api.get(`/inventory/items/${sku}`, itemDetailSchema),
  updateItem: ({ sku, ...settings }: ReorderSettings & { sku: string }) =>
    api.patch(`/inventory/items/${sku}`, settings),
  adjust: (input: { skus: string[]; warehouse: string; delta: number; reason: string }) =>
    api.post('/inventory/adjustments', input),
  warehouses: () => api.get('/inventory/warehouses', z.array(warehouseSchema)),
  transfers: () => api.get('/inventory/transfers', z.array(transferSchema)),
  createTransfer: (input: TransferInput) => api.post('/inventory/transfers', input, transferSchema),
  moveTransfer: ({ id, status }: { id: string; status: TransferStatus }) =>
    api.patch(`/inventory/transfers/${id}`, { status }, transferSchema),
  receipts: () => api.get('/inventory/receipts', z.array(receiptSchema)),
  receive: ({ id, lines }: { id: string; lines: Array<{ sku: string; received: number }> }) =>
    api.post(`/inventory/receipts/${id}/receive`, { lines }, receiptSchema),
  countSheet: (warehouse: string, zone: string) =>
    api.get('/inventory/counts', countSheetSchema, { params: { warehouse, zone } }),
  submitCount: (input: {
    warehouse: string;
    lines: Array<{ sku: string; bin: string; counted: number }>;
  }) => api.post('/inventory/counts', input, z.object({ adjusted: z.number() })),
  suppliers: () => api.get('/inventory/suppliers', z.array(supplierSchema)),
  supplier: (id: string) => api.get(`/inventory/suppliers/${id}`, supplierDetailSchema),
  purchaseOrders: () => api.get('/inventory/purchase-orders', z.array(purchaseOrderSchema)),
  createPurchaseOrder: (input: PurchaseOrderInput) =>
    api.post('/inventory/purchase-orders', input, purchaseOrderSchema),
  sendPurchaseOrder: (id: string) =>
    api.post(`/inventory/purchase-orders/${id}/send`, {}, purchaseOrderSchema),
  movements: (filters: MovementFilters) =>
    api.get('/inventory/movements', z.array(movementRowSchema), { params: filters }),
  reorderPlan: () => api.get('/inventory/reorder-plan', z.array(reorderLineSchema)),
};

export const inventoryKeys = {
  all: ['inventory'] as const,
  overview: () => [...inventoryKeys.all, 'overview'] as const,
  items: (warehouse?: string) => [...inventoryKeys.all, 'items', warehouse ?? 'all'] as const,
  item: (sku: string) => [...inventoryKeys.all, 'item', sku] as const,
  warehouses: () => [...inventoryKeys.all, 'warehouses'] as const,
  transfers: () => [...inventoryKeys.all, 'transfers'] as const,
  receipts: () => [...inventoryKeys.all, 'receipts'] as const,
  counts: (warehouse: string, zone: string) =>
    [...inventoryKeys.all, 'counts', warehouse, zone] as const,
  suppliers: () => [...inventoryKeys.all, 'suppliers'] as const,
  supplier: (id: string) => [...inventoryKeys.all, 'supplier', id] as const,
  purchaseOrders: () => [...inventoryKeys.all, 'purchase-orders'] as const,
  movements: (filters: MovementFilters) => [...inventoryKeys.all, 'movements', filters] as const,
  reorderPlan: () => [...inventoryKeys.all, 'reorder-plan'] as const,
};

export const overviewQuery = () =>
  queryOptions({ queryKey: inventoryKeys.overview(), queryFn: inventoryApi.overview });
export const itemsQuery = (warehouse?: string) =>
  queryOptions({
    queryKey: inventoryKeys.items(warehouse),
    queryFn: () => inventoryApi.items(warehouse),
    placeholderData: keepPreviousData,
  });
export const itemQuery = (sku: string) =>
  queryOptions({ queryKey: inventoryKeys.item(sku), queryFn: () => inventoryApi.item(sku) });
export const warehousesQuery = () =>
  queryOptions({ queryKey: inventoryKeys.warehouses(), queryFn: inventoryApi.warehouses });
export const transfersQuery = () =>
  queryOptions({ queryKey: inventoryKeys.transfers(), queryFn: inventoryApi.transfers });
export const receiptsQuery = () =>
  queryOptions({ queryKey: inventoryKeys.receipts(), queryFn: inventoryApi.receipts });
export const countSheetQuery = (warehouse: string, zone: string) =>
  queryOptions({
    queryKey: inventoryKeys.counts(warehouse, zone),
    queryFn: () => inventoryApi.countSheet(warehouse, zone),
  });
export const suppliersQuery = () =>
  queryOptions({ queryKey: inventoryKeys.suppliers(), queryFn: inventoryApi.suppliers });

export const useOverview = () => useQuery(overviewQuery());
export const useItems = (warehouse?: string) => useQuery(itemsQuery(warehouse));
export const useItem = (sku: string) => useQuery(itemQuery(sku));
export const useWarehouses = () => useQuery(warehousesQuery());
export const useTransfers = () => useQuery(transfersQuery());
export const useReceipts = () => useQuery(receiptsQuery());
export const useCountSheet = (warehouse: string, zone: string) =>
  useQuery(countSheetQuery(warehouse, zone));
export const supplierQuery = (id: string) =>
  queryOptions({ queryKey: inventoryKeys.supplier(id), queryFn: () => inventoryApi.supplier(id) });
export const purchaseOrdersQuery = () =>
  queryOptions({ queryKey: inventoryKeys.purchaseOrders(), queryFn: inventoryApi.purchaseOrders });
export const movementsQuery = (filters: MovementFilters) =>
  queryOptions({
    queryKey: inventoryKeys.movements(filters),
    queryFn: () => inventoryApi.movements(filters),
    placeholderData: keepPreviousData,
  });
export const reorderPlanQuery = () =>
  queryOptions({ queryKey: inventoryKeys.reorderPlan(), queryFn: inventoryApi.reorderPlan });

export const useSuppliers = () => useQuery(suppliersQuery());
export const useSupplier = (id: string) => useQuery(supplierQuery(id));
export const usePurchaseOrders = () => useQuery(purchaseOrdersQuery());
export const useMovements = (filters: MovementFilters) => useQuery(movementsQuery(filters));
export const useReorderPlan = () => useQuery(reorderPlanQuery());

/** Every stock-changing mutation refreshes all inventory queries. */
const stockChanged = [inventoryKeys.all];

export function useUpdateItem() {
  const { t } = useTranslation('inventory');
  return useMutation({
    mutationFn: inventoryApi.updateItem,
    meta: { invalidates: stockChanged, successMessage: t('item.reorder.saved') },
  });
}

export function useAdjustStock() {
  const { t } = useTranslation('inventory');
  return useMutation({
    mutationFn: inventoryApi.adjust,
    meta: { invalidates: stockChanged, errorMessage: t('items.adjust.failed') },
  });
}

export function useCreateTransfer() {
  const { t } = useTranslation('inventory');
  return useMutation({
    mutationFn: inventoryApi.createTransfer,
    meta: { invalidates: stockChanged, errorMessage: t('transfers.create.failed') },
  });
}

export function useMoveTransfer() {
  return useMutation({
    mutationFn: inventoryApi.moveTransfer,
    meta: { invalidates: stockChanged },
  });
}

export function useReceive() {
  return useMutation({ mutationFn: inventoryApi.receive, meta: { invalidates: stockChanged } });
}

export function useSubmitCount() {
  return useMutation({ mutationFn: inventoryApi.submitCount, meta: { invalidates: stockChanged } });
}

/** Creates one or more POs in one go (the reorder planner makes one per supplier). */
export function useCreatePurchaseOrders() {
  const { t } = useTranslation('inventory');
  return useMutation({
    mutationFn: (inputs: PurchaseOrderInput[]) =>
      Promise.all(inputs.map(inventoryApi.createPurchaseOrder)),
    meta: { invalidates: stockChanged, errorMessage: t('purchaseOrders.create.failed') },
  });
}

export function useSendPurchaseOrder() {
  const { t } = useTranslation('inventory');
  return useMutation({
    mutationFn: inventoryApi.sendPurchaseOrder,
    meta: { invalidates: stockChanged, successMessage: t('purchaseOrders.sent') },
  });
}
