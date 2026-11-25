import { keepPreviousData, queryOptions, useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/core/api/client';
import { useTranslation } from '@/core/i18n/use-translation';

import {
  assignmentDetailSchema,
  assignmentSchema,
  catalogSchema,
  certificateSchema,
  courseDetailSchema,
  courseSummarySchema,
  homeSchema,
  instructorWithCoursesSchema,
  lessonPageSchema,
  noteSchema,
  questionSchema,
  quizResultSchema,
  quizSchema,
  replySchema,
  scheduleSchema,
  studentProfileSchema,
  studentSchema,
  submissionSchema,
  threadDetailSchema,
  threadListSchema,
  type CatalogFilters,
  type ThreadFilter,
} from '../model/academy';

export const academyApi = {
  home: () => api.get('/academy/home', homeSchema),
  catalog: (f: CatalogFilters) =>
    api.get('/academy/courses', catalogSchema, {
      params: {
        q: f.q || undefined,
        levels: f.levels.join(',') || undefined,
        categories: f.categories.join(',') || undefined,
        price: f.price,
        sort: f.sort,
      },
    }),
  course: (courseId: string) => api.get(`/academy/courses/${courseId}`, courseDetailSchema),
  enroll: (courseId: string) =>
    api.post(`/academy/courses/${courseId}/enroll`, {}, courseSummarySchema),
  lesson: (courseId: string, lessonId: string) =>
    api.get(`/academy/courses/${courseId}/lessons/${lessonId}`, lessonPageSchema),
  complete: (lessonId: string) => api.post(`/academy/lessons/${lessonId}/complete`, {}),
  addNote: ({ lessonId, atSec, body }: { lessonId: string; atSec: number; body: string }) =>
    api.post(`/academy/lessons/${lessonId}/notes`, { atSec, body }, noteSchema),
  ask: ({ lessonId, body }: { lessonId: string; body: string }) =>
    api.post(`/academy/lessons/${lessonId}/questions`, { body }, questionSchema),
  schedule: (week: number) => api.get('/academy/schedule', scheduleSchema, { params: { week } }),
  students: () => api.get('/academy/students', z.array(studentSchema)),
  certificates: () => api.get('/academy/certificates', z.array(certificateSchema)),
  instructors: () => api.get('/academy/instructors', z.array(instructorWithCoursesSchema)),
  student: (studentId: string) => api.get(`/academy/students/${studentId}`, studentProfileSchema),
  assignments: () => api.get('/academy/assignments', z.array(assignmentSchema)),
  assignment: (assignmentId: string) =>
    api.get(`/academy/assignments/${assignmentId}`, assignmentDetailSchema),
  grade: ({ submissionId, ...grade }: { submissionId: string; score: number; feedback: string }) =>
    api.patch(`/academy/submissions/${submissionId}`, grade, submissionSchema),
  quiz: (courseId: string) => api.get(`/academy/courses/${courseId}/quiz`, quizSchema),
  submitQuiz: ({ courseId, answers }: { courseId: string; answers: Record<string, string> }) =>
    api.post(`/academy/courses/${courseId}/quiz/attempts`, { answers }, quizResultSchema),
  threads: (f: ThreadFilters) =>
    api.get('/academy/threads', threadListSchema, {
      params: { filter: f.filter, courseId: f.courseId || undefined, q: f.q || undefined },
    }),
  thread: (threadId: string) => api.get(`/academy/threads/${threadId}`, threadDetailSchema),
  reply: ({ threadId, body }: { threadId: string; body: string }) =>
    api.post(`/academy/threads/${threadId}/replies`, { body }, replySchema),
};

export type ThreadFilters = { filter: ThreadFilter; courseId: string; q: string };

export const academyKeys = {
  all: ['academy'] as const,
  home: () => [...academyKeys.all, 'home'] as const,
  catalog: (f: CatalogFilters) => [...academyKeys.all, 'catalog', f] as const,
  course: (courseId: string) => [...academyKeys.all, 'course', courseId] as const,
  lesson: (courseId: string, lessonId: string) =>
    [...academyKeys.all, 'lesson', courseId, lessonId] as const,
  schedule: (week: number) => [...academyKeys.all, 'schedule', week] as const,
  students: () => [...academyKeys.all, 'students'] as const,
  certificates: () => [...academyKeys.all, 'certificates'] as const,
  instructors: () => [...academyKeys.all, 'instructors'] as const,
  student: (studentId: string) => [...academyKeys.all, 'student', studentId] as const,
  assignments: () => [...academyKeys.all, 'assignments'] as const,
  assignment: (assignmentId: string) => [...academyKeys.assignments(), assignmentId] as const,
  quiz: (courseId: string) => [...academyKeys.all, 'quiz', courseId] as const,
  threads: () => [...academyKeys.all, 'threads'] as const,
  threadList: (f: ThreadFilters) => [...academyKeys.threads(), 'list', f] as const,
  thread: (threadId: string) => [...academyKeys.threads(), threadId] as const,
};

export const homeQuery = () =>
  queryOptions({ queryKey: academyKeys.home(), queryFn: academyApi.home });
export const catalogQuery = (f: CatalogFilters) =>
  queryOptions({
    queryKey: academyKeys.catalog(f),
    queryFn: () => academyApi.catalog(f),
    placeholderData: keepPreviousData,
  });
export const courseQuery = (courseId: string) =>
  queryOptions({
    queryKey: academyKeys.course(courseId),
    queryFn: () => academyApi.course(courseId),
  });
export const lessonQuery = (courseId: string, lessonId: string) =>
  queryOptions({
    queryKey: academyKeys.lesson(courseId, lessonId),
    queryFn: () => academyApi.lesson(courseId, lessonId),
    placeholderData: keepPreviousData,
  });
export const scheduleQuery = (week: number) =>
  queryOptions({
    queryKey: academyKeys.schedule(week),
    queryFn: () => academyApi.schedule(week),
    placeholderData: keepPreviousData,
  });
export const studentsQuery = () =>
  queryOptions({ queryKey: academyKeys.students(), queryFn: academyApi.students });
export const certificatesQuery = () =>
  queryOptions({ queryKey: academyKeys.certificates(), queryFn: academyApi.certificates });
export const instructorsQuery = () =>
  queryOptions({ queryKey: academyKeys.instructors(), queryFn: academyApi.instructors });

export const studentQuery = (studentId: string) =>
  queryOptions({
    queryKey: academyKeys.student(studentId),
    queryFn: () => academyApi.student(studentId),
  });
export const assignmentsQuery = () =>
  queryOptions({ queryKey: academyKeys.assignments(), queryFn: academyApi.assignments });
export const assignmentQuery = (assignmentId: string) =>
  queryOptions({
    queryKey: academyKeys.assignment(assignmentId),
    queryFn: () => academyApi.assignment(assignmentId),
  });
export const quizQuery = (courseId: string) =>
  queryOptions({ queryKey: academyKeys.quiz(courseId), queryFn: () => academyApi.quiz(courseId) });
export const threadsQuery = (f: ThreadFilters) =>
  queryOptions({
    queryKey: academyKeys.threadList(f),
    queryFn: () => academyApi.threads(f),
    placeholderData: keepPreviousData,
  });
export const threadQuery = (threadId: string) =>
  queryOptions({
    queryKey: academyKeys.thread(threadId),
    queryFn: () => academyApi.thread(threadId),
  });

export const useAcademyHome = () => useQuery(homeQuery());
export const useCatalog = (f: CatalogFilters) => useQuery(catalogQuery(f));
export const useCourse = (courseId: string) => useQuery(courseQuery(courseId));
export const useLesson = (courseId: string, lessonId: string) =>
  useQuery(lessonQuery(courseId, lessonId));
export const useSchedule = (week: number) => useQuery(scheduleQuery(week));
export const useStudents = () => useQuery(studentsQuery());
export const useCertificates = () => useQuery(certificatesQuery());
export const useInstructors = () => useQuery(instructorsQuery());
export const useStudentProfile = (studentId: string) => useQuery(studentQuery(studentId));
export const useAssignments = () => useQuery(assignmentsQuery());
export const useAssignment = (assignmentId: string) => useQuery(assignmentQuery(assignmentId));
export const useQuiz = (courseId: string) => useQuery(quizQuery(courseId));
export const useThreads = (f: ThreadFilters) => useQuery(threadsQuery(f));
export const useThread = (threadId: string) => useQuery(threadQuery(threadId));

export function useEnroll() {
  const { t } = useTranslation('academy');
  return useMutation({
    mutationFn: academyApi.enroll,
    meta: { invalidates: [academyKeys.all], successMessage: t('course.enrolled') },
  });
}

export function useCompleteLesson() {
  const { t } = useTranslation('academy');
  return useMutation({
    mutationFn: academyApi.complete,
    meta: { invalidates: [academyKeys.all], successMessage: t('lesson.completedToast') },
  });
}

export function useAddNote(courseId: string, lessonId: string) {
  const { t } = useTranslation('academy');
  return useMutation({
    mutationFn: academyApi.addNote,
    meta: {
      invalidates: [academyKeys.lesson(courseId, lessonId)],
      successMessage: t('lesson.notes.saved'),
    },
  });
}

export function useAsk(courseId: string, lessonId: string) {
  const { t } = useTranslation('academy');
  return useMutation({
    mutationFn: academyApi.ask,
    meta: {
      invalidates: [academyKeys.lesson(courseId, lessonId)],
      successMessage: t('lesson.qa.posted'),
    },
  });
}

export function useGradeSubmission() {
  const { t } = useTranslation('academy');
  return useMutation({
    mutationFn: academyApi.grade,
    meta: {
      invalidates: [academyKeys.all],
      successMessage: t('grading.saved'),
    },
  });
}

export function useSubmitQuiz(courseId: string) {
  return useMutation({
    mutationFn: (answers: Record<string, string>) => academyApi.submitQuiz({ courseId, answers }),
    meta: { invalidates: [academyKeys.quiz(courseId)] },
  });
}

export function useReply() {
  const { t } = useTranslation('academy');
  return useMutation({
    mutationFn: academyApi.reply,
    meta: {
      invalidates: [academyKeys.threads()],
      successMessage: t('discussions.thread.posted'),
    },
  });
}
