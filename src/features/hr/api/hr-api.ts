import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/core/api/client';
import { useTranslation } from '@/core/i18n/use-translation';

import {
  candidateProfileSchema,
  candidateSchema,
  employeeSchema,
  jobBoardSchema,
  jobSchema,
  payRunDetailSchema,
  payRunSchema,
  performanceSchema,
  profileSchema,
  timeOffSchema,
  type Candidate,
  type CandidateStage,
  type TimeOffRequest,
} from '../model/hr';

export const hrPagesApi = {
  people: () => api.get('/hr/people', z.array(employeeSchema)),
  person: (id: string) => api.get(`/hr/people/${id}`, profileSchema),
  jobs: () => api.get('/hr/jobs', z.array(jobSchema)),
  jobBoard: (id: string) => api.get(`/hr/jobs/${id}/candidates`, jobBoardSchema),
  candidate: (id: string) => api.get(`/hr/candidates/${id}`, candidateProfileSchema),
  moveCandidate: ({ id, stage }: { id: string; stage: CandidateStage }) =>
    api.patch(`/hr/candidates/${id}`, { stage }, candidateSchema),
  timeOff: () => api.get('/hr/time-off', z.array(timeOffSchema)),
  decideTimeOff: ({ id, status }: { id: string; status: 'approved' | 'declined' }) =>
    api.patch(`/hr/time-off/${id}`, { status }, timeOffSchema),
  payroll: () => api.get('/hr/payroll', z.array(payRunSchema)),
  payRun: (id: string) => api.get(`/hr/payroll/${id}`, payRunDetailSchema),
  approvePayRun: (id: string) => api.post(`/hr/payroll/${id}/approve`, {}, payRunSchema),
  performance: () => api.get('/hr/performance', performanceSchema),
};

export const hrPageKeys = {
  all: ['hr-pages'] as const,
  people: () => [...hrPageKeys.all, 'people'] as const,
  person: (id: string) => [...hrPageKeys.all, 'person', id] as const,
  jobs: () => [...hrPageKeys.all, 'jobs'] as const,
  jobBoard: (id: string) => [...hrPageKeys.all, 'job', id] as const,
  candidates: () => [...hrPageKeys.all, 'candidate'] as const,
  candidate: (id: string) => [...hrPageKeys.candidates(), id] as const,
  timeOff: () => [...hrPageKeys.all, 'time-off'] as const,
  payroll: () => [...hrPageKeys.all, 'payroll'] as const,
  payRun: (id: string) => [...hrPageKeys.all, 'payroll', id] as const,
  performance: () => [...hrPageKeys.all, 'performance'] as const,
};

export const peopleQuery = () =>
  queryOptions({ queryKey: hrPageKeys.people(), queryFn: hrPagesApi.people, staleTime: 60_000 });
export const personQuery = (id: string) =>
  queryOptions({ queryKey: hrPageKeys.person(id), queryFn: () => hrPagesApi.person(id) });
export const jobsQuery = () =>
  queryOptions({ queryKey: hrPageKeys.jobs(), queryFn: hrPagesApi.jobs });
export const jobBoardQuery = (id: string) =>
  queryOptions({ queryKey: hrPageKeys.jobBoard(id), queryFn: () => hrPagesApi.jobBoard(id) });
export const candidateQuery = (id: string) =>
  queryOptions({ queryKey: hrPageKeys.candidate(id), queryFn: () => hrPagesApi.candidate(id) });
export const timeOffQuery = () =>
  queryOptions({ queryKey: hrPageKeys.timeOff(), queryFn: hrPagesApi.timeOff });
export const payrollQuery = () =>
  queryOptions({ queryKey: hrPageKeys.payroll(), queryFn: hrPagesApi.payroll });
export const payRunQuery = (id: string) =>
  queryOptions({ queryKey: hrPageKeys.payRun(id), queryFn: () => hrPagesApi.payRun(id) });
export const performanceQuery = () =>
  queryOptions({ queryKey: hrPageKeys.performance(), queryFn: hrPagesApi.performance });

export const useEmployees = () => useQuery(peopleQuery());
export const useEmployee = (id: string) => useQuery(personQuery(id));
export const useJobs = () => useQuery(jobsQuery());
export const useJobBoard = (id: string) => useQuery(jobBoardQuery(id));
export const useCandidate = (id: string) => useQuery(candidateQuery(id));
export const useTimeOff = () => useQuery(timeOffQuery());
export const usePayroll = () => useQuery(payrollQuery());
export const usePayRun = (id: string) => useQuery(payRunQuery(id));
export const usePerformance = () => useQuery(performanceQuery());

/** Moves a candidate between stages, optimistically. */
export function useMoveCandidate(jobId: string) {
  const { t } = useTranslation('hr');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: hrPagesApi.moveCandidate,
    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries({ queryKey: hrPageKeys.jobBoard(jobId) });
      queryClient.setQueryData<{ candidates: Candidate[] }>(hrPageKeys.jobBoard(jobId), (data) =>
        data
          ? { ...data, candidates: data.candidates.map((c) => (c.id === id ? { ...c, stage } : c)) }
          : data,
      );
    },
    meta: {
      invalidates: [hrPageKeys.jobBoard(jobId), hrPageKeys.jobs(), hrPageKeys.candidates()],
      successMessage: t('recruitment.moved'),
    },
  });
}

export function useDecideTimeOff() {
  const { t } = useTranslation('hr');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: hrPagesApi.decideTimeOff,
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: hrPageKeys.timeOff() });
      queryClient.setQueryData<TimeOffRequest[]>(hrPageKeys.timeOff(), (list) =>
        list?.map((r) => (r.id === id ? { ...r, status } : r)),
      );
    },
    onSuccess: (request) =>
      queryClient.invalidateQueries({ queryKey: hrPageKeys.person(request.personId) }),
    meta: { invalidates: [hrPageKeys.timeOff()], successMessage: t('timeOff.decided') },
  });
}

export function useApprovePayRun() {
  const { t } = useTranslation('hr');
  return useMutation({
    mutationFn: hrPagesApi.approvePayRun,
    meta: { invalidates: [hrPageKeys.all], successMessage: t('payroll.approved') },
  });
}
