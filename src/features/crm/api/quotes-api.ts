import { queryOptions, useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/core/api/client';
import { useTranslation } from '@/core/i18n/use-translation';

import {
  productSchema,
  quoteSchema,
  type NewQuoteInput,
  type ProductInput,
  type QuoteDraft,
  type QuoteStatus,
} from '../model/quotes';

import { crmKeys } from './crm-api';

export const quotesApi = {
  products: () => api.get('/crm/products', z.array(productSchema)),
  saveProduct: ({ id, ...input }: Partial<ProductInput> & { id?: string }) =>
    id
      ? api.patch(`/crm/products/${id}`, input, productSchema)
      : api.post('/crm/products', input, productSchema),
  quotes: () => api.get('/crm/quotes', z.array(quoteSchema)),
  quote: (id: string) => api.get(`/crm/quotes/${id}`, quoteSchema),
  createQuote: (input: NewQuoteInput) => api.post('/crm/quotes', input, quoteSchema),
  saveQuote: ({ id, ...draft }: QuoteDraft & { id: string }) =>
    api.put(`/crm/quotes/${id}`, draft, quoteSchema),
  setQuoteStatus: ({ id, status }: { id: string; status: QuoteStatus }) =>
    api.patch(`/crm/quotes/${id}`, { status }, quoteSchema),
};

export const quoteKeys = {
  products: () => [...crmKeys.all, 'products'] as const,
  quotes: () => [...crmKeys.all, 'quotes'] as const,
  quote: (id: string) => [...quoteKeys.quotes(), id] as const,
};

export const productsQuery = () =>
  queryOptions({ queryKey: quoteKeys.products(), queryFn: quotesApi.products });
export const quotesQuery = () =>
  queryOptions({ queryKey: quoteKeys.quotes(), queryFn: quotesApi.quotes });
export const quoteQuery = (id: string) =>
  queryOptions({ queryKey: quoteKeys.quote(id), queryFn: () => quotesApi.quote(id) });

export const useProducts = () => useQuery(productsQuery());
export const useQuotes = () => useQuery(quotesQuery());
export const useQuote = (id: string) => useQuery(quoteQuery(id));

export function useSaveProduct() {
  const { t } = useTranslation('crm');
  return useMutation({
    mutationFn: quotesApi.saveProduct,
    meta: { invalidates: [quoteKeys.products()], successMessage: t('products.saved') },
  });
}

export function useCreateQuote() {
  const { t } = useTranslation('crm');
  return useMutation({
    mutationFn: quotesApi.createQuote,
    meta: { invalidates: [quoteKeys.quotes()], successMessage: t('quotes.created') },
  });
}

export function useSaveQuote() {
  const { t } = useTranslation('crm');
  return useMutation({
    mutationFn: quotesApi.saveQuote,
    meta: { invalidates: [quoteKeys.quotes()], successMessage: t('quote.saved') },
  });
}

/** Accepting a quote closes its deal as won, so deal views refresh too. */
export function useSetQuoteStatus() {
  const { t } = useTranslation('crm');
  return useMutation({
    mutationFn: quotesApi.setQuoteStatus,
    meta: {
      invalidates: [quoteKeys.quotes(), crmKeys.deals(), crmKeys.overview(), crmKeys.forecast()],
      successMessage: t('quote.statusChanged'),
    },
  });
}
