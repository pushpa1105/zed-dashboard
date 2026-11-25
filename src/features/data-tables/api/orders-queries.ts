import { keepPreviousData, queryOptions, useMutation, useQuery } from '@tanstack/react-query';

import { useTranslation } from '@/core/i18n/use-translation';

import type { OrdersSearch } from '../model/order';

import { ordersApi } from './orders-api';

export const ordersKeys = {
  all: ['tables', 'orders'] as const,
  list: (search: OrdersSearch) => [...ordersKeys.all, search] as const,
};

/** Keeps the previous page on screen while the next one loads. */
export const ordersQuery = (search: OrdersSearch) =>
  queryOptions({
    queryKey: ordersKeys.list(search),
    queryFn: () => ordersApi.list(search),
    placeholderData: keepPreviousData,
  });

export const useOrders = (search: OrdersSearch) => useQuery(ordersQuery(search));

export function useSetOrdersStatus() {
  const { t } = useTranslation('data-tables');
  return useMutation({
    mutationFn: ordersApi.setStatus,
    meta: { invalidates: [ordersKeys.all], successMessage: t('toast.updated') },
  });
}

export function useDeleteOrders() {
  const { t } = useTranslation('data-tables');
  return useMutation({
    mutationFn: ordersApi.remove,
    meta: { invalidates: [ordersKeys.all], successMessage: t('toast.deleted') },
  });
}
