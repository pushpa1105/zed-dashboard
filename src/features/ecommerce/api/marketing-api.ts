import { keepPreviousData, queryOptions, useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/core/api/client';
import { useTranslation } from '@/core/i18n/use-translation';

import {
  cartsPageSchema,
  giftCardDetailSchema,
  giftCardSchema,
  giftCardsResponseSchema,
  type CartsSearch,
  type GiftCardForm,
  type GiftCardTab,
} from '../model/marketing';

import { storeKeys } from './store-api';

export const marketingApi = {
  giftCards: (params: { status: GiftCardTab; q: string }) =>
    api.get('/ecommerce/gift-cards', giftCardsResponseSchema, { params }),
  giftCard: (id: string) => api.get(`/ecommerce/gift-cards/${id}`, giftCardDetailSchema),
  issueGiftCard: (input: GiftCardForm) => api.post('/ecommerce/gift-cards', input, giftCardSchema),
  setGiftCardStatus: ({ id, status }: { id: string; status: 'active' | 'disabled' }) =>
    api.patch(`/ecommerce/gift-cards/${id}`, { status }, giftCardSchema),
  carts: (search: CartsSearch) =>
    api.get('/ecommerce/abandoned-carts', cartsPageSchema, { params: search }),
  /** Emails the given carts, or every cart not contacted yet when `ids` is omitted. */
  sendRecoveryEmails: (ids?: string[]) =>
    api.post('/ecommerce/abandoned-carts/recovery-emails', { ids }, z.object({ sent: z.number() })),
};

export const marketingKeys = {
  giftCards: () => [...storeKeys.all, 'gift-cards'] as const,
  giftCardsList: (status: GiftCardTab, q: string) =>
    [...marketingKeys.giftCards(), 'list', status, q] as const,
  giftCard: (id: string) => [...marketingKeys.giftCards(), 'detail', id] as const,
  carts: () => [...storeKeys.all, 'abandoned-carts'] as const,
  cartsList: (search: CartsSearch) => [...marketingKeys.carts(), search] as const,
};

export const giftCardsQuery = (status: GiftCardTab, q: string) =>
  queryOptions({
    queryKey: marketingKeys.giftCardsList(status, q),
    queryFn: () => marketingApi.giftCards({ status, q }),
    placeholderData: keepPreviousData,
  });
const giftCardQuery = (id: string) =>
  queryOptions({ queryKey: marketingKeys.giftCard(id), queryFn: () => marketingApi.giftCard(id) });
export const cartsQuery = (search: CartsSearch) =>
  queryOptions({
    queryKey: marketingKeys.cartsList(search),
    queryFn: () => marketingApi.carts(search),
    placeholderData: keepPreviousData,
  });

export const useGiftCards = (status: GiftCardTab, q: string) => useQuery(giftCardsQuery(status, q));
export const useGiftCard = (id: string | null) =>
  useQuery({ ...giftCardQuery(id ?? ''), enabled: !!id });
export const useCarts = (search: CartsSearch) => useQuery(cartsQuery(search));

export function useIssueGiftCard() {
  const { t } = useTranslation('ecommerce');
  return useMutation({
    mutationFn: marketingApi.issueGiftCard,
    meta: { invalidates: [marketingKeys.giftCards()], successMessage: t('giftCards.toast.issued') },
  });
}

export function useSetGiftCardStatus() {
  const { t } = useTranslation('ecommerce');
  return useMutation({
    mutationFn: marketingApi.setGiftCardStatus,
    meta: {
      invalidates: [marketingKeys.giftCards()],
      successMessage: t('giftCards.toast.updated'),
    },
  });
}

export function useSendRecoveryEmails() {
  const { t } = useTranslation('ecommerce');
  return useMutation({
    mutationFn: marketingApi.sendRecoveryEmails,
    meta: { invalidates: [marketingKeys.carts()], successMessage: t('carts.toast.sent') },
  });
}
