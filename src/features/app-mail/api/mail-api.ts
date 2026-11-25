import { keepPreviousData, queryOptions, useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/core/api/client';
import { useTranslation } from '@/core/i18n/use-translation';

import { mailPreviewSchema, mailSchema, summarySchema, type MailView } from '../model/mail';

export const mailKeys = {
  all: ['mail'] as const,
  summary: () => [...mailKeys.all, 'summary'] as const,
  lists: () => [...mailKeys.all, 'list'] as const,
  list: (view: MailView, q: string) => [...mailKeys.lists(), view, q] as const,
  message: (id: string) => [...mailKeys.all, 'message', id] as const,
};

export type MailPatch = {
  ids: string[];
  read?: boolean;
  starred?: boolean;
  folder?: string;
};

export type OutgoingMail = {
  to: string[];
  cc: string[];
  subject: string;
  body: string;
  attachments: Array<{ name: string; size: number }>;
  draft?: boolean;
};

export const mailApi = {
  summary: () => api.get('/mail/summary', summarySchema),
  list: (view: MailView, q: string) =>
    api.get('/mail/messages', z.array(mailPreviewSchema), {
      params: view.kind === 'label' ? { label: view.id, q } : { folder: view.id, q },
    }),
  get: (id: string) => api.get(`/mail/messages/${id}`, mailSchema),
  patch: (input: MailPatch) => api.patch('/mail/messages', input),
  send: (input: OutgoingMail) => api.post('/mail/messages', input, mailPreviewSchema),
};

export const summaryQuery = () =>
  queryOptions({ queryKey: mailKeys.summary(), queryFn: mailApi.summary });

export const listQuery = (view: MailView, q: string) =>
  queryOptions({
    queryKey: mailKeys.list(view, q),
    queryFn: () => mailApi.list(view, q),
    placeholderData: keepPreviousData,
  });

export const useMailSummary = () => useQuery(summaryQuery());
export const useMailList = (view: MailView, q: string) => useQuery(listQuery(view, q));
export const useMail = (id: string | null) =>
  useQuery({
    queryKey: mailKeys.message(id ?? ''),
    queryFn: () => mailApi.get(id!),
    enabled: !!id,
  });

export function useMailPatch() {
  return useMutation({
    mutationFn: mailApi.patch,
    meta: { invalidates: [mailKeys.all] },
  });
}

export function useSendMail() {
  const { t } = useTranslation('app-mail');
  return useMutation({
    mutationFn: mailApi.send,
    meta: { invalidates: [mailKeys.all], successMessage: t('toast.sent') },
  });
}
