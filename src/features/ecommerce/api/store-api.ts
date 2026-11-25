import { keepPreviousData, queryOptions, useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/core/api/client';
import { useTranslation } from '@/core/i18n/use-translation';

import {
  categorySchema,
  customerDetailSchema,
  customersResponseSchema,
  discountSchema,
  orderDetailSchema,
  ordersPageSchema,
  productDetailSchema,
  productsResponseSchema,
  reviewSchema,
  reviewsResponseSchema,
  type Discount,
  type DiscountForm,
  type OrdersSearch,
  type OrderStatus,
  type ProductForm,
  type ReviewTab,
  type Segment,
} from '../model/store';

const ok = z.unknown();

/** Plain request functions (reused by loaders and tests). */
export const storeApi = {
  orders: (search: OrdersSearch) =>
    api.get('/ecommerce/orders', ordersPageSchema, { params: search }),
  order: (id: string) => api.get(`/ecommerce/orders/${id}`, orderDetailSchema),
  setOrderStatus: (input: { ids: string[]; status: OrderStatus }) =>
    api.patch('/ecommerce/orders', input, ok),
  refund: ({ id, ...body }: { id: string; amount: number; reason: string; restock: boolean }) =>
    api.post(`/ecommerce/orders/${id}/refund`, body, ok),
  addNote: ({ id, text }: { id: string; text: string }) =>
    api.post(`/ecommerce/orders/${id}/notes`, { text }, ok),
  products: () => api.get('/ecommerce/products', productsResponseSchema),
  product: (id: string) => api.get(`/ecommerce/products/${id}`, productDetailSchema),
  saveProduct: ({ id, values }: { id: string; values: ProductForm }) =>
    api.put(`/ecommerce/products/${id}`, values, productDetailSchema),
  categories: () => api.get('/ecommerce/categories', z.array(categorySchema)),
  updateCategory: ({ id, ...body }: { id: string; direction?: 'up' | 'down'; visible?: boolean }) =>
    api.patch(`/ecommerce/categories/${id}`, body, z.array(categorySchema)),
  customers: (params: { q: string; segment: Segment }) =>
    api.get('/ecommerce/customers', customersResponseSchema, { params }),
  customer: (id: string) => api.get(`/ecommerce/customers/${id}`, customerDetailSchema),
  addCustomerNote: ({ id, text }: { id: string; text: string }) =>
    api.post(`/ecommerce/customers/${id}/notes`, { text }, ok),
  reviews: (status: ReviewTab) =>
    api.get('/ecommerce/reviews', reviewsResponseSchema, { params: { status } }),
  moderate: ({ id, status }: { id: string; status: 'approved' | 'rejected' | 'pending' }) =>
    api.patch(`/ecommerce/reviews/${id}`, { status }, reviewSchema),
  discounts: () => api.get('/ecommerce/discounts', z.array(discountSchema)),
  createDiscount: (input: DiscountForm) => api.post('/ecommerce/discounts', input, discountSchema),
  setDiscountStatus: ({ id, status }: { id: string; status: Discount['status'] }) =>
    api.patch(`/ecommerce/discounts/${id}`, { status }, discountSchema),
};

export const storeKeys = {
  all: ['ecommerce', 'store'] as const,
  orders: () => [...storeKeys.all, 'orders'] as const,
  ordersList: (search: OrdersSearch) => [...storeKeys.orders(), 'list', search] as const,
  order: (id: string) => [...storeKeys.orders(), 'detail', id] as const,
  products: () => [...storeKeys.all, 'products'] as const,
  product: (id: string) => [...storeKeys.products(), id] as const,
  categories: () => [...storeKeys.all, 'categories'] as const,
  customers: () => [...storeKeys.all, 'customers'] as const,
  customersList: (q: string, segment: Segment) => [...storeKeys.customers(), q, segment] as const,
  customer: (id: string) => [...storeKeys.customers(), 'detail', id] as const,
  reviews: () => [...storeKeys.all, 'reviews'] as const,
  reviewsList: (status: ReviewTab) => [...storeKeys.reviews(), status] as const,
  discounts: () => [...storeKeys.all, 'discounts'] as const,
};

export const ordersQuery = (search: OrdersSearch) =>
  queryOptions({
    queryKey: storeKeys.ordersList(search),
    queryFn: () => storeApi.orders(search),
    placeholderData: keepPreviousData,
  });
export const orderQuery = (id: string) =>
  queryOptions({ queryKey: storeKeys.order(id), queryFn: () => storeApi.order(id) });
export const productsQuery = () =>
  queryOptions({ queryKey: storeKeys.products(), queryFn: storeApi.products });
export const productQuery = (id: string) =>
  queryOptions({ queryKey: storeKeys.product(id), queryFn: () => storeApi.product(id) });
export const categoriesQuery = () =>
  queryOptions({ queryKey: storeKeys.categories(), queryFn: storeApi.categories });
export const customersQuery = (q: string, segment: Segment) =>
  queryOptions({
    queryKey: storeKeys.customersList(q, segment),
    queryFn: () => storeApi.customers({ q, segment }),
    placeholderData: keepPreviousData,
  });
export const customerQuery = (id: string) =>
  queryOptions({ queryKey: storeKeys.customer(id), queryFn: () => storeApi.customer(id) });
export const reviewsQuery = (status: ReviewTab) =>
  queryOptions({
    queryKey: storeKeys.reviewsList(status),
    queryFn: () => storeApi.reviews(status),
    placeholderData: keepPreviousData,
  });
export const discountsQuery = () =>
  queryOptions({ queryKey: storeKeys.discounts(), queryFn: storeApi.discounts });

export const useOrders = (search: OrdersSearch) => useQuery(ordersQuery(search));
export const useOrder = (id: string) => useQuery(orderQuery(id));
export const useProducts = () => useQuery(productsQuery());
export const useProduct = (id: string) => useQuery(productQuery(id));
export const useCategories = () => useQuery(categoriesQuery());
export const useCustomers = (q: string, segment: Segment) => useQuery(customersQuery(q, segment));
export const useCustomer = (id: string) => useQuery(customerQuery(id));
export const useReviews = (status: ReviewTab) => useQuery(reviewsQuery(status));
export const useDiscounts = () => useQuery(discountsQuery());

export function useSetOrderStatus() {
  const { t } = useTranslation('ecommerce');
  return useMutation({
    mutationFn: storeApi.setOrderStatus,
    meta: {
      invalidates: [storeKeys.orders()],
      successMessage: t('orders.toast.updated'),
    },
  });
}

export function useRefundOrder() {
  const { t } = useTranslation('ecommerce');
  return useMutation({
    mutationFn: storeApi.refund,
    meta: { invalidates: [storeKeys.orders()], successMessage: t('order.toast.refunded') },
  });
}

export function useAddOrderNote() {
  const { t } = useTranslation('ecommerce');
  return useMutation({
    mutationFn: storeApi.addNote,
    meta: { invalidates: [storeKeys.orders()], successMessage: t('order.toast.noted') },
  });
}

export function useSaveProduct() {
  const { t } = useTranslation('ecommerce');
  return useMutation({
    mutationFn: storeApi.saveProduct,
    meta: { invalidates: [storeKeys.products()], successMessage: t('editor.toast.saved') },
  });
}

export function useUpdateCategory() {
  return useMutation({
    mutationFn: storeApi.updateCategory,
    meta: { invalidates: [storeKeys.categories(), storeKeys.products()] },
  });
}

export function useModerateReview() {
  return useMutation({
    mutationFn: storeApi.moderate,
    meta: { invalidates: [storeKeys.reviews()] },
  });
}

export function useCreateDiscount() {
  const { t } = useTranslation('ecommerce');
  return useMutation({
    mutationFn: storeApi.createDiscount,
    meta: { invalidates: [storeKeys.discounts()], successMessage: t('discounts.toast.created') },
  });
}

export function useSetDiscountStatus() {
  const { t } = useTranslation('ecommerce');
  return useMutation({
    mutationFn: storeApi.setDiscountStatus,
    meta: { invalidates: [storeKeys.discounts()], successMessage: t('discounts.toast.updated') },
  });
}

export function useAddCustomerNote() {
  const { t } = useTranslation('ecommerce');
  return useMutation({
    mutationFn: storeApi.addCustomerNote,
    meta: { invalidates: [storeKeys.customers()], successMessage: t('order.toast.noted') },
  });
}
