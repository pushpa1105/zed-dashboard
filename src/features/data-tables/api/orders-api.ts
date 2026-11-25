import { z } from 'zod';

import { api } from '@/core/api/client';

import { ordersPageSchema, type OrderStatus, type OrdersSearch } from '../model/order';

const updatedSchema = z.object({ updated: z.number() });
const deletedSchema = z.object({ deleted: z.number() });

/** Drops empty params so URLs and cache keys stay short. */
const compact = (search: OrdersSearch) =>
  Object.fromEntries(Object.entries(search).filter(([, v]) => v !== '' && v !== undefined));

/** Plain request functions: no React. */
export const ordersApi = {
  list: (search: OrdersSearch) =>
    api.get('/tables/orders', ordersPageSchema, { params: compact(search) }),

  setStatus: ({ ids, status }: { ids: string[]; status: OrderStatus }) =>
    api.patch('/tables/orders', { ids, status }, updatedSchema),

  remove: (ids: string[]) => api.post('/tables/orders/delete', { ids }, deletedSchema),
};
