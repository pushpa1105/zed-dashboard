import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/core/api/client';
import { useTranslation } from '@/core/i18n/use-translation';

import {
  builderSchema,
  liveSessionSchema,
  reportsSchema,
  type BuilderSection,
  type CourseBuilder,
  type LessonInput,
  type LiveInput,
  type ReportRange,
} from '../model/teaching';

import { academyKeys } from './academy-api';

const builderUrl = (courseId: string) => `/academy/courses/${courseId}/builder`;

export const teachingApi = {
  builder: (courseId: string) => api.get(builderUrl(courseId), builderSchema),
  saveSections: ({ courseId, sections }: { courseId: string; sections: BuilderSection[] }) =>
    api.put(`${builderUrl(courseId)}/sections`, { sections }, builderSchema),
  saveLesson: ({ courseId, id, ...lesson }: LessonInput & { courseId: string; id: string }) =>
    api.put(`${builderUrl(courseId)}/lessons/${id}`, lesson, builderSchema),
  publish: ({ courseId, published }: { courseId: string; published: boolean }) =>
    api.patch(builderUrl(courseId), { published }, builderSchema),
  live: () => api.get('/academy/live', z.array(liveSessionSchema)),
  scheduleLive: (input: LiveInput) =>
    api.post('/academy/live', { ...input, startsAt: input.startsAt.toISOString() }),
  register: ({ id, going }: { id: string; going: boolean }) =>
    api.put(`/academy/live/${id}/registration`, { going }, liveSessionSchema),
  reports: (range: ReportRange) =>
    api.get('/academy/reports', reportsSchema, { params: { range } }),
};

export const teachingKeys = {
  builder: (courseId: string) => [...academyKeys.all, 'builder', courseId] as const,
  live: () => [...academyKeys.all, 'live'] as const,
  reports: (range: ReportRange) => [...academyKeys.all, 'reports', range] as const,
};

export const builderQuery = (courseId: string) =>
  queryOptions({
    queryKey: teachingKeys.builder(courseId),
    queryFn: () => teachingApi.builder(courseId),
  });
export const liveQuery = () =>
  queryOptions({ queryKey: teachingKeys.live(), queryFn: teachingApi.live });
export const reportsQuery = (range: ReportRange) =>
  queryOptions({
    queryKey: teachingKeys.reports(range),
    queryFn: () => teachingApi.reports(range),
    placeholderData: keepPreviousData,
  });

export const useBuilder = (courseId: string) => useQuery(builderQuery(courseId));
export const useLiveSessions = () => useQuery(liveQuery());
export const useReports = (range: ReportRange) => useQuery(reportsQuery(range));

/** Reorders, renames, adds or removes sections and lessons optimistically, without a toast. */
export function useSaveSections(courseId: string) {
  const queryClient = useQueryClient();
  const key = teachingKeys.builder(courseId);
  return useMutation({
    mutationFn: (sections: BuilderSection[]) => teachingApi.saveSections({ courseId, sections }),
    onMutate: async (sections) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<CourseBuilder>(key);
      queryClient.setQueryData<CourseBuilder>(key, (b) => b && { ...b, sections });
      return { previous };
    },
    onError: (_error, _sections, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    meta: { invalidates: [key] },
  });
}

export function useSaveLesson(courseId: string) {
  const { t } = useTranslation('academy');
  return useMutation({
    mutationFn: (lesson: LessonInput & { id: string }) =>
      teachingApi.saveLesson({ courseId, ...lesson }),
    meta: { invalidates: [teachingKeys.builder(courseId)], successMessage: t('builder.saved') },
  });
}

export function usePublishCourse(courseId: string) {
  const { t } = useTranslation('academy');
  return useMutation({
    mutationFn: (published: boolean) => teachingApi.publish({ courseId, published }),
    meta: {
      invalidates: [teachingKeys.builder(courseId)],
      successMessage: t('builder.publishChanged'),
    },
  });
}

export function useScheduleLive() {
  const { t } = useTranslation('academy');
  return useMutation({
    mutationFn: teachingApi.scheduleLive,
    meta: { invalidates: [teachingKeys.live()], successMessage: t('live.scheduled') },
  });
}

export function useRegisterLive() {
  const { t } = useTranslation('academy');
  return useMutation({
    mutationFn: teachingApi.register,
    meta: { invalidates: [teachingKeys.live()], successMessage: t('live.registrationChanged') },
  });
}
