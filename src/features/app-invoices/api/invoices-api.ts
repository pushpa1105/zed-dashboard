import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/core/api/client';

import { customerSchema, invoiceListSchema, invoiceSchema, type Line } from '../model/invoice';

export type ListFilters = { status: string; q: string };

export type InvoicePayload = {
  customerId: string;
  issueDate: number;
  dueDate: number;
  items: Line[];
  taxRate: number;
  discount: number;
  notes: string;
  send?: boolean;
};

export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (f: ListFilters) => [...invoiceKeys.lists(), f] as const,
  detail: (id: string) => [...invoiceKeys.all, 'detail', id] as const,
  customers: () => [...invoiceKeys.all, 'customers'] as const,
  nextNumber: () => [...invoiceKeys.all, 'next-number'] as const,
};

export const invoicesApi = {
  list: (f: ListFilters) => api.get('/invoices', invoiceListSchema, { params: f }),
  get: (id: string) => api.get(`/invoices/${id}`, invoiceSchema),
  customers: () => api.get('/invoices/customers', z.array(customerSchema)),
  nextNumber: () => api.get('/invoices/next-number', z.object({ number: z.string() })),
  create: (input: InvoicePayload) => api.post('/invoices', input, invoiceSchema),
  setStatus: ({ id, status }: { id: string; status: 'sent' | 'paid' }) =>
    api.patch(`/invoices/${id}`, { status }, invoiceSchema),
};

export const listQuery = (f: ListFilters) =>
  queryOptions({
    queryKey: invoiceKeys.list(f),
    queryFn: () => invoicesApi.list(f),
    placeholderData: keepPreviousData,
  });
export const invoiceQuery = (id: string) =>
  queryOptions({ queryKey: invoiceKeys.detail(id), queryFn: () => invoicesApi.get(id) });
export const customersQuery = () =>
  queryOptions({
    queryKey: invoiceKeys.customers(),
    queryFn: invoicesApi.customers,
    staleTime: Infinity,
  });

export const useInvoices = (f: ListFilters) => useQuery(listQuery(f));
export const useInvoice = (id: string) => useQuery(invoiceQuery(id));
export const useCustomers = () => useQuery(customersQuery());
export const useNextNumber = () =>
  useQuery({ queryKey: invoiceKeys.nextNumber(), queryFn: invoicesApi.nextNumber });

/** Creates (and optionally sends) an invoice. The caller shows the toast, which depends on `send`. */
export function useCreateInvoice() {
  return useMutation({
    mutationFn: invoicesApi.create,
    meta: { invalidates: [invoiceKeys.all] },
  });
}

export function useSetInvoiceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: invoicesApi.setStatus,
    meta: { invalidates: [invoiceKeys.lists()] },
    onSuccess: (invoice) => queryClient.setQueryData(invoiceKeys.detail(invoice.id), invoice),
  });
}
