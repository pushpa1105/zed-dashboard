import { keepPreviousData, queryOptions, useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/core/api/client';
import { useTranslation } from '@/core/i18n/use-translation';

import {
  acquisitionSchema,
  eventDetailSchema,
  eventRowSchema,
  experimentDetailSchema,
  experimentSchema,
  audienceSchema,
  funnelSchema,
  goalSchema,
  pageRowSchema,
  realtimeSchema,
  reportSchema,
  retentionSchema,
  utmLinkSchema,
  type CohortCount,
  type GoalInput,
  type Range,
  type RetentionSegment,
  type Schedule,
  type UtmInput,
} from '../model/analytics';

/** Plain request functions for the workspace pages (home and campaigns have their own). */
export const analyticsPagesApi = {
  realtime: () => api.get('/analytics/realtime', realtimeSchema),
  audience: (range: Range) => api.get('/analytics/audience', audienceSchema, { params: { range } }),
  acquisition: (range: Range) =>
    api.get('/analytics/acquisition', acquisitionSchema, { params: { range } }),
  createUtmLink: (input: UtmInput) => api.post('/analytics/utm-links', input, utmLinkSchema),
  pages: (range: Range) =>
    api.get('/analytics/pages', z.array(pageRowSchema), { params: { range } }),
  funnel: (range: Range, steps: string[]) =>
    api.get('/analytics/funnel', funnelSchema, { params: { range, steps: steps.join(',') } }),
  reports: () => api.get('/analytics/reports', z.array(reportSchema)),
  schedule: ({ id, schedule }: { id: string; schedule: Schedule | null }) =>
    api.patch(`/analytics/reports/${id}/schedule`, schedule, reportSchema),
  removeReport: (id: string) => api.delete(`/analytics/reports/${id}`),
  retention: (segment: RetentionSegment, cohorts: CohortCount) =>
    api.get('/analytics/retention', retentionSchema, { params: { segment, cohorts } }),
  events: (range: Range) =>
    api.get('/analytics/events', z.array(eventRowSchema), { params: { range } }),
  event: (key: string, range: Range) =>
    api.get(`/analytics/events/${key}`, eventDetailSchema, { params: { range } }),
  goals: (range: Range) => api.get('/analytics/goals', z.array(goalSchema), { params: { range } }),
  saveGoal: ({ id, input }: { id?: string; input: GoalInput }) =>
    id
      ? api.patch(`/analytics/goals/${id}`, input, goalSchema)
      : api.post('/analytics/goals', input, goalSchema),
  removeGoal: (id: string) => api.delete(`/analytics/goals/${id}`),
  experiments: () => api.get('/analytics/experiments', z.array(experimentSchema)),
  experiment: (id: string) => api.get(`/analytics/experiments/${id}`, experimentDetailSchema),
};

export const analyticsPageKeys = {
  all: ['analytics', 'pages'] as const,
  realtime: () => [...analyticsPageKeys.all, 'realtime'] as const,
  audience: (range: Range) => [...analyticsPageKeys.all, 'audience', range] as const,
  acquisition: (range: Range) => [...analyticsPageKeys.all, 'acquisition', range] as const,
  pages: (range: Range) => [...analyticsPageKeys.all, 'top-pages', range] as const,
  funnel: (range: Range, steps: string[]) =>
    [...analyticsPageKeys.all, 'funnel', range, steps] as const,
  reports: () => [...analyticsPageKeys.all, 'reports'] as const,
  retention: (segment: RetentionSegment, cohorts: CohortCount) =>
    [...analyticsPageKeys.all, 'retention', segment, cohorts] as const,
  events: (range: Range) => [...analyticsPageKeys.all, 'events', range] as const,
  event: (key: string, range: Range) => [...analyticsPageKeys.all, 'event', key, range] as const,
  goals: (range: Range) => [...analyticsPageKeys.all, 'goals', range] as const,
  experiments: () => [...analyticsPageKeys.all, 'experiments'] as const,
  experiment: (id: string) => [...analyticsPageKeys.experiments(), id] as const,
};

/** Live view: refetched every 5 seconds while the tab is visible (pausable). */
export const realtimeQuery = (live = true) =>
  queryOptions({
    queryKey: analyticsPageKeys.realtime(),
    queryFn: analyticsPagesApi.realtime,
    refetchInterval: live ? 5000 : false,
    placeholderData: keepPreviousData,
  });

export const audienceQuery = (range: Range) =>
  queryOptions({
    queryKey: analyticsPageKeys.audience(range),
    queryFn: () => analyticsPagesApi.audience(range),
    placeholderData: keepPreviousData,
  });

export const acquisitionQuery = (range: Range) =>
  queryOptions({
    queryKey: analyticsPageKeys.acquisition(range),
    queryFn: () => analyticsPagesApi.acquisition(range),
    placeholderData: keepPreviousData,
  });

export const topPagesQuery = (range: Range) =>
  queryOptions({
    queryKey: analyticsPageKeys.pages(range),
    queryFn: () => analyticsPagesApi.pages(range),
    placeholderData: keepPreviousData,
  });

export const funnelQuery = (range: Range, steps: string[]) =>
  queryOptions({
    queryKey: analyticsPageKeys.funnel(range, steps),
    queryFn: () => analyticsPagesApi.funnel(range, steps),
    placeholderData: keepPreviousData,
  });

export const reportsQuery = () =>
  queryOptions({ queryKey: analyticsPageKeys.reports(), queryFn: analyticsPagesApi.reports });

export const retentionQuery = (segment: RetentionSegment, cohorts: CohortCount) =>
  queryOptions({
    queryKey: analyticsPageKeys.retention(segment, cohorts),
    queryFn: () => analyticsPagesApi.retention(segment, cohorts),
    placeholderData: keepPreviousData,
  });

export const eventsQuery = (range: Range) =>
  queryOptions({
    queryKey: analyticsPageKeys.events(range),
    queryFn: () => analyticsPagesApi.events(range),
    placeholderData: keepPreviousData,
  });

export const eventQuery = (key: string, range: Range) =>
  queryOptions({
    queryKey: analyticsPageKeys.event(key, range),
    queryFn: () => analyticsPagesApi.event(key, range),
  });

export const goalsQuery = (range: Range) =>
  queryOptions({
    queryKey: analyticsPageKeys.goals(range),
    queryFn: () => analyticsPagesApi.goals(range),
    placeholderData: keepPreviousData,
  });

export const experimentsQuery = () =>
  queryOptions({
    queryKey: analyticsPageKeys.experiments(),
    queryFn: analyticsPagesApi.experiments,
  });

export const experimentQuery = (id: string) =>
  queryOptions({
    queryKey: analyticsPageKeys.experiment(id),
    queryFn: () => analyticsPagesApi.experiment(id),
  });

export const useRealtime = (live: boolean) => useQuery(realtimeQuery(live));
export const useAudience = (range: Range) => useQuery(audienceQuery(range));
export const useAcquisition = (range: Range) => useQuery(acquisitionQuery(range));
export const useTopPages = (range: Range) => useQuery(topPagesQuery(range));
export const useFunnel = (range: Range, steps: string[]) => useQuery(funnelQuery(range, steps));
export const useReports = () => useQuery(reportsQuery());
export const useRetention = (segment: RetentionSegment, cohorts: CohortCount) =>
  useQuery(retentionQuery(segment, cohorts));
export const useEvents = (range: Range) => useQuery(eventsQuery(range));
export const useEvent = (key: string | null, range: Range) =>
  useQuery({ ...eventQuery(key ?? '', range), enabled: !!key });
export const useGoals = (range: Range) => useQuery(goalsQuery(range));
export const useExperiments = () => useQuery(experimentsQuery());
export const useExperiment = (id: string) => useQuery(experimentQuery(id));

export function useCreateUtmLink() {
  const { t } = useTranslation('analytics');
  return useMutation({
    mutationFn: analyticsPagesApi.createUtmLink,
    meta: {
      invalidates: [[...analyticsPageKeys.all, 'acquisition']],
      successMessage: t('acquisition.utm.created'),
    },
  });
}

export function useScheduleReport() {
  const { t } = useTranslation('analytics');
  return useMutation({
    mutationFn: analyticsPagesApi.schedule,
    meta: { invalidates: [analyticsPageKeys.reports()], successMessage: t('reports.saved') },
  });
}

export function useRemoveReport() {
  const { t } = useTranslation('analytics');
  return useMutation({
    mutationFn: analyticsPagesApi.removeReport,
    meta: { invalidates: [analyticsPageKeys.reports()], successMessage: t('reports.deleted') },
  });
}

export function useSaveGoal() {
  const { t } = useTranslation('analytics');
  return useMutation({
    mutationFn: analyticsPagesApi.saveGoal,
    meta: { invalidates: [[...analyticsPageKeys.all, 'goals']], successMessage: t('goals.saved') },
  });
}

export function useRemoveGoal() {
  const { t } = useTranslation('analytics');
  return useMutation({
    mutationFn: analyticsPagesApi.removeGoal,
    meta: {
      invalidates: [[...analyticsPageKeys.all, 'goals']],
      successMessage: t('goals.deleted'),
    },
  });
}
