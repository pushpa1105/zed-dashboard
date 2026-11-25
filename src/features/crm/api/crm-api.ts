import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/core/api/client';
import { useTranslation } from '@/core/i18n/use-translation';
import { notify } from '@/core/notify/notify';

import {
  companyDetailSchema,
  companyRowSchema,
  contactDetailSchema,
  dealDetailSchema,
  dealSchema,
  forecastSchema,
  leadSchema,
  meetingSchema,
  noteSchema,
  overviewSchema,
  personSchema,
  reportsSchema,
  sequenceSchema,
  taskSchema,
  type Deal,
  type DealStage,
  type LeadAction,
  type LogCallInput,
  type NewDealInput,
  type SequenceInput,
} from '../model/crm';

export const crmApi = {
  overview: () => api.get('/crm/overview', overviewSchema),
  deals: () => api.get('/crm/deals', z.array(dealSchema)),
  deal: (id: string) => api.get(`/crm/deals/${id}`, dealDetailSchema),
  createDeal: (input: NewDealInput) => api.post('/crm/deals', input, dealSchema),
  moveDeal: ({ id, stage }: { id: string; stage: DealStage }) =>
    api.patch(`/crm/deals/${id}`, { stage }, dealSchema),
  addNote: ({ dealId, body }: { dealId: string; body: string }) =>
    api.post(`/crm/deals/${dealId}/notes`, { body }, noteSchema),
  people: () => api.get('/crm/people', z.array(personSchema)),
  companies: () => api.get('/crm/companies', z.array(companyRowSchema)),
  contact: (id: string) => api.get(`/crm/contacts/${id}`, contactDetailSchema),
  tasks: () => api.get('/crm/tasks', z.array(taskSchema)),
  toggleTask: ({ id, done }: { id: string; done: boolean }) =>
    api.patch(`/crm/tasks/${id}`, { done }, taskSchema),
  meetings: () => api.get('/crm/meetings', z.array(meetingSchema)),
  logCall: (input: LogCallInput) => api.post('/crm/calls', input, meetingSchema),
  reports: () => api.get('/crm/reports', reportsSchema),
  company: (id: string) => api.get(`/crm/companies/${id}`, companyDetailSchema),
  leads: () => api.get('/crm/leads', z.array(leadSchema)),
  leadAction: (input: { ids: string[]; action: LeadAction }) =>
    api.post('/crm/leads/actions', input, z.array(leadSchema)),
  sequences: () => api.get('/crm/sequences', z.array(sequenceSchema)),
  saveSequence: ({ id, ...input }: SequenceInput & { id?: string }) =>
    id
      ? api.put(`/crm/sequences/${id}`, input, sequenceSchema)
      : api.post('/crm/sequences', input, sequenceSchema),
  forecast: () => api.get('/crm/forecast', forecastSchema),
};

export const crmKeys = {
  all: ['crm'] as const,
  overview: () => [...crmKeys.all, 'overview'] as const,
  deals: () => [...crmKeys.all, 'deals'] as const,
  deal: (id: string) => [...crmKeys.all, 'deal', id] as const,
  people: () => [...crmKeys.all, 'people'] as const,
  companies: () => [...crmKeys.all, 'companies'] as const,
  contact: (id: string) => [...crmKeys.all, 'contact', id] as const,
  tasks: () => [...crmKeys.all, 'tasks'] as const,
  meetings: () => [...crmKeys.all, 'meetings'] as const,
  reports: () => [...crmKeys.all, 'reports'] as const,
  company: (id: string) => [...crmKeys.all, 'company', id] as const,
  leads: () => [...crmKeys.all, 'leads'] as const,
  sequences: () => [...crmKeys.all, 'sequences'] as const,
  forecast: () => [...crmKeys.all, 'forecast'] as const,
};

export const overviewQuery = () =>
  queryOptions({ queryKey: crmKeys.overview(), queryFn: crmApi.overview });
export const dealsQuery = () => queryOptions({ queryKey: crmKeys.deals(), queryFn: crmApi.deals });
export const dealQuery = (id: string) =>
  queryOptions({ queryKey: crmKeys.deal(id), queryFn: () => crmApi.deal(id) });
export const peopleQuery = () =>
  queryOptions({ queryKey: crmKeys.people(), queryFn: crmApi.people });
export const companiesQuery = () =>
  queryOptions({ queryKey: crmKeys.companies(), queryFn: crmApi.companies });
export const contactQuery = (id: string) =>
  queryOptions({ queryKey: crmKeys.contact(id), queryFn: () => crmApi.contact(id) });
export const tasksQuery = () => queryOptions({ queryKey: crmKeys.tasks(), queryFn: crmApi.tasks });
export const meetingsQuery = () =>
  queryOptions({ queryKey: crmKeys.meetings(), queryFn: crmApi.meetings });
export const reportsQuery = () =>
  queryOptions({ queryKey: crmKeys.reports(), queryFn: crmApi.reports });

export const useCrmOverview = () => useQuery(overviewQuery());
export const useDeals = () => useQuery(dealsQuery());
export const useDeal = (id: string) => useQuery(dealQuery(id));
export const usePeople = () => useQuery(peopleQuery());
export const useCompanies = () => useQuery(companiesQuery());
export const useContact = (id: string) => useQuery(contactQuery(id));
export const useCrmTasks = () => useQuery(tasksQuery());
export const useMeetings = () => useQuery(meetingsQuery());
export const useCrmReports = () => useQuery(reportsQuery());

export function useCreateDeal() {
  const { t } = useTranslation('crm');
  return useMutation({
    mutationFn: crmApi.createDeal,
    meta: {
      invalidates: [crmKeys.deals(), crmKeys.overview()],
      successMessage: t('pipeline.created'),
    },
  });
}

/** Moves a deal between stages optimistically (the board updates before the server answers). */
export function useMoveDeal() {
  const { t } = useTranslation('crm');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crmApi.moveDeal,
    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries({ queryKey: crmKeys.deals() });
      const previous = queryClient.getQueryData<Deal[]>(crmKeys.deals());
      queryClient.setQueryData<Deal[]>(crmKeys.deals(), (deals) =>
        deals?.map((d) => (d.id === id ? { ...d, stage } : d)),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(crmKeys.deals(), context.previous);
    },
    meta: {
      invalidates: [crmKeys.deals(), crmKeys.overview()],
      successMessage: t('pipeline.moved'),
    },
  });
}

export function useAddNote(dealId: string) {
  const { t } = useTranslation('crm');
  return useMutation({
    mutationFn: (body: string) => crmApi.addNote({ dealId, body }),
    meta: { invalidates: [crmKeys.deal(dealId)], successMessage: t('deal.noteAdded') },
  });
}

export function useToggleTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crmApi.toggleTask,
    onMutate: async ({ id, done }) => {
      await queryClient.cancelQueries({ queryKey: crmKeys.tasks() });
      queryClient.setQueryData<z.infer<typeof taskSchema>[]>(crmKeys.tasks(), (tasks) =>
        tasks?.map((task) => (task.id === id ? { ...task, done } : task)),
      );
    },
    meta: { invalidates: [crmKeys.tasks()] },
  });
}

export function useLogCall() {
  const { t } = useTranslation('crm');
  return useMutation({
    mutationFn: crmApi.logCall,
    meta: { invalidates: [crmKeys.meetings()], successMessage: t('meetings.logged') },
  });
}

export const companyQuery = (id: string) =>
  queryOptions({ queryKey: crmKeys.company(id), queryFn: () => crmApi.company(id) });
export const leadsQuery = () => queryOptions({ queryKey: crmKeys.leads(), queryFn: crmApi.leads });
export const sequencesQuery = () =>
  queryOptions({ queryKey: crmKeys.sequences(), queryFn: crmApi.sequences });
export const forecastQuery = () =>
  queryOptions({ queryKey: crmKeys.forecast(), queryFn: crmApi.forecast });

export const useCompany = (id: string) => useQuery(companyQuery(id));
export const useLeads = () => useQuery(leadsQuery());
export const useSequences = () => useQuery(sequencesQuery());
export const useForecast = () => useQuery(forecastQuery());

/** Qualifies, disqualifies or converts leads; converting creates deals, so those lists refresh too. */
export function useLeadAction() {
  const { t } = useTranslation('crm');
  return useMutation({
    mutationFn: crmApi.leadAction,
    onSuccess: (changed, { action }) =>
      notify.success(t(`leads.done.${action}`, { count: changed.length })),
    meta: {
      invalidates: [crmKeys.leads(), crmKeys.deals(), crmKeys.companies(), crmKeys.forecast()],
    },
  });
}

export function useSaveSequence() {
  const { t } = useTranslation('crm');
  return useMutation({
    mutationFn: crmApi.saveSequence,
    meta: { invalidates: [crmKeys.sequences()], successMessage: t('sequences.saved') },
  });
}
