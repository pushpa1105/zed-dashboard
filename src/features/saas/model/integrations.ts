import { z } from 'zod';

export const INTEGRATION_CATEGORIES = [
  'communication',
  'developer',
  'payments',
  'analytics',
  'crm',
  'storage',
] as const;
export type IntegrationCategory = (typeof INTEGRATION_CATEGORIES)[number];
export const SYNC_MODES = ['realtime', 'hourly', 'daily'] as const;

export const integrationConfigSchema = z.object({
  account: z.string().trim().min(2).max(80),
  events: z.array(z.string()).min(1),
  sync: z.enum(SYNC_MODES),
});
export type IntegrationConfig = z.infer<typeof integrationConfigSchema>;

export const integrationSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(INTEGRATION_CATEGORIES),
  description: z.string(),
  installs: z.number(),
  events: z.array(z.string()),
  config: integrationConfigSchema.nullable(),
  connectedAt: z.number().nullable(),
  synced: z.number(),
});
export type Integration = z.infer<typeof integrationSchema>;
