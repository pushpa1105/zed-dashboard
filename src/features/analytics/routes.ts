import { defineRoute } from '@/core/config/routes';

/** Routes of the Analytics workspace. Every path starts with the workspace prefix. */
export const analyticsRoutes = {
  overview: defineRoute('/analytics'),
  realtime: defineRoute('/analytics/realtime'),
  audience: defineRoute('/analytics/audience'),
  geography: defineRoute('/analytics/geography'),
  technology: defineRoute('/analytics/technology'),
  acquisition: defineRoute('/analytics/acquisition'),
  campaigns: defineRoute('/analytics/campaigns'),
  pages: defineRoute('/analytics/pages'),
  funnels: defineRoute('/analytics/funnels'),
  retention: defineRoute('/analytics/retention'),
  events: defineRoute('/analytics/events'),
  goals: defineRoute('/analytics/goals'),
  experiments: defineRoute('/analytics/experiments'),
  experiment: defineRoute('/analytics/experiments/:experimentId'),
  reports: defineRoute('/analytics/reports'),
  alerts: defineRoute('/analytics/alerts'),
} as const;
