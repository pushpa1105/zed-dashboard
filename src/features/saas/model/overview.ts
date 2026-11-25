import { z } from 'zod';

export const SAAS_RANGES = ['6h', '24h', '7d'] as const;
export type SaasRange = (typeof SAAS_RANGES)[number];

export const integrationSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  enabled: z.boolean(),
});
export type Integration = z.infer<typeof integrationSchema>;

export const saasOverviewSchema = z.object({
  stats: z.object({
    projects: z.number(),
    projectsMax: z.number(),
    requests: z.number(),
    requestsDelta: z.number(),
    users: z.number(),
    usersMax: z.number(),
    storageUsedGb: z.number(),
    storageMaxGb: z.number(),
  }),
  apiCalls: z.array(z.object({ at: z.number(), calls: z.number(), errors: z.number() })),
  latencyP95: z.number(),
  errorRate: z.number(),
  pnl: z.array(z.object({ key: z.string(), label: z.string(), value: z.number() })),
  profitGrowth: z.number(),
  plan: z.object({
    name: z.string(),
    price: z.number(),
    renewsAt: z.number(),
    limits: z.array(
      z.object({ key: z.string(), label: z.string(), value: z.number(), max: z.number() }),
    ),
  }),
  activity: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      action: z.string(),
      target: z.string(),
      comment: z.string(),
      at: z.number(),
    }),
  ),
  integrations: z.array(integrationSchema),
});

export type SaasOverview = z.infer<typeof saasOverviewSchema>;
