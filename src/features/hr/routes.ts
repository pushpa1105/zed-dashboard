import { defineRoute } from '@/core/config/routes';

/** Routes of the HR workspace. Every path starts with the workspace prefix. */
export const hrRoutes = {
  overview: defineRoute('/hr'),
  directory: defineRoute('/hr/people'),
  person: defineRoute('/hr/people/:personId'),
  org: defineRoute('/hr/org'),
  recruitment: defineRoute('/hr/recruitment'),
  job: defineRoute('/hr/recruitment/:jobId'),
  candidate: defineRoute('/hr/candidates/:candidateId'),
  onboarding: defineRoute('/hr/onboarding'),
  attendance: defineRoute('/hr/attendance'),
  timeOff: defineRoute('/hr/time-off'),
  payroll: defineRoute('/hr/payroll'),
  payRun: defineRoute('/hr/payroll/:runId'),
  benefits: defineRoute('/hr/benefits'),
  performance: defineRoute('/hr/performance'),
  training: defineRoute('/hr/training'),
  engagement: defineRoute('/hr/engagement'),
  documents: defineRoute('/hr/documents'),
  settings: defineRoute('/hr/settings'),
} as const;
