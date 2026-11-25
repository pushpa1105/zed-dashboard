import { defineRoute } from '@/core/config/routes';

/** Routes of the CRM workspace. Every path starts with the workspace prefix. */
export const crmRoutes = {
  overview: defineRoute('/crm'),
  pipeline: defineRoute('/crm/pipeline'),
  deals: defineRoute('/crm/deals'),
  deal: defineRoute('/crm/deals/:dealId'),
  quotes: defineRoute('/crm/quotes'),
  quote: defineRoute('/crm/quotes/:quoteId'),
  products: defineRoute('/crm/products'),
  people: defineRoute('/crm/people'),
  companies: defineRoute('/crm/companies'),
  company: defineRoute('/crm/companies/:companyId'),
  leads: defineRoute('/crm/leads'),
  contact: defineRoute('/crm/contacts/:contactId'),
  activity: defineRoute('/crm/activity'),
  tasks: defineRoute('/crm/tasks'),
  meetings: defineRoute('/crm/meetings'),
  sequences: defineRoute('/crm/sequences'),
  reports: defineRoute('/crm/reports'),
  forecast: defineRoute('/crm/forecast'),
  settings: defineRoute('/crm/settings'),
} as const;
