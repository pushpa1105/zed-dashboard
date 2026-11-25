import { queryOptions, useMutation, useQuery } from '@tanstack/react-query';

import { api } from '@/core/api/client';
import { useTranslation } from '@/core/i18n/use-translation';

import { supportSchema, ticketSchema, type TicketPatch } from '../model/support';

const supportApi = {
  inbox: () => api.get('/saas/support', supportSchema),
  reply: ({ id, body }: { id: string; body: string }) =>
    api.post(`/saas/support/tickets/${id}/replies`, { body }, ticketSchema),
  update: ({ id, ...patch }: TicketPatch) =>
    api.patch(`/saas/support/tickets/${id}`, patch, ticketSchema),
};

const supportKeys = { all: ['saas', 'support'] as const };

export const supportQuery = () =>
  queryOptions({ queryKey: supportKeys.all, queryFn: supportApi.inbox });
export const useSupport = () => useQuery(supportQuery());

export function useReplyTicket() {
  const { t } = useTranslation('saas');
  return useMutation({
    mutationFn: supportApi.reply,
    meta: { invalidates: [supportKeys.all], successMessage: t('support.toast.replied') },
  });
}
export function useUpdateTicket() {
  const { t } = useTranslation('saas');
  return useMutation({
    mutationFn: supportApi.update,
    meta: { invalidates: [supportKeys.all], successMessage: t('support.toast.updated') },
  });
}
