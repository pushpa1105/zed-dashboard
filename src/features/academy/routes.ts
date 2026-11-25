import { defineRoute } from '@/core/config/routes';

/** Routes of the Academy workspace. Every path starts with the workspace prefix. */
export const academyRoutes = {
  home: defineRoute('/academy'),
  catalog: defineRoute('/academy/courses'),
  course: defineRoute('/academy/courses/:courseId'),
  lesson: defineRoute('/academy/courses/:courseId/lessons/:lessonId'),
  quiz: defineRoute('/academy/courses/:courseId/quiz'),
  builder: defineRoute('/academy/courses/:courseId/builder'),
  schedule: defineRoute('/academy/schedule'),
  live: defineRoute('/academy/live'),
  students: defineRoute('/academy/students'),
  student: defineRoute('/academy/students/:studentId'),
  assignments: defineRoute('/academy/assignments'),
  assignment: defineRoute('/academy/assignments/:assignmentId'),
  discussions: defineRoute('/academy/discussions'),
  thread: defineRoute('/academy/discussions/:threadId'),
  instructors: defineRoute('/academy/instructors'),
  reports: defineRoute('/academy/reports'),
  certificates: defineRoute('/academy/certificates'),
} as const;
