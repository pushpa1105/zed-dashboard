import { defineRoute } from '@/core/config/routes';

/** Routes of the SaaS workspace. Every path starts with the workspace prefix. */
export const saasRoutes = {
  overview: defineRoute('/saas'),
  keys: defineRoute('/saas/keys'),
  usage: defineRoute('/saas/usage'),
  logs: defineRoute('/saas/logs'),
  webhooks: defineRoute('/saas/webhooks'),
  billing: defineRoute('/saas/billing'),
  team: defineRoute('/saas/team'),
  settings: defineRoute('/saas/settings'),
  customers: defineRoute('/saas/customers'),
  customer: defineRoute('/saas/customers/:customerId'),
  flags: defineRoute('/saas/flags'),
  audit: defineRoute('/saas/audit'),
  status: defineRoute('/saas/status'),
  integrations: defineRoute('/saas/integrations'),
  roles: defineRoute('/saas/roles'),
  support: defineRoute('/saas/support'),
} as const;
