import { z } from 'zod';

export const KEY_SCOPES = ['read', 'write', 'payments', 'admin'] as const;

export const apiKeySchema = z.object({
  id: z.string(),
  name: z.string(),
  prefix: z.string(),
  env: z.enum(['live', 'test']),
  scopes: z.array(z.string()),
  createdAt: z.number(),
  lastUsedAt: z.number().nullable(),
  createdBy: z.string(),
  status: z.enum(['active', 'revoked']),
});
export type ApiKey = z.infer<typeof apiKeySchema>;
export const createdKeySchema = apiKeySchema.extend({ secret: z.string() });

export const keyFormSchema = z.object({
  name: z.string().trim().min(3).max(60),
  env: z.enum(['live', 'test']),
  scopes: z.array(z.enum(KEY_SCOPES)).min(1),
});
export type KeyForm = z.infer<typeof keyFormSchema>;

export const USAGE_RANGES = ['14d', '30d'] as const;
export type UsageRange = (typeof USAGE_RANGES)[number];

export const usageSchema = z.object({
  byDay: z.array(
    z.object({ day: z.number(), read: z.number(), write: z.number(), admin: z.number() }),
  ),
  endpoints: z.array(
    z.object({
      method: z.string(),
      path: z.string(),
      calls: z.number(),
      p50: z.number(),
      p95: z.number(),
      errorRate: z.number(),
      trend: z.array(z.number()),
    }),
  ),
  totals: z.object({ calls: z.number(), quota: z.number(), errors: z.number(), p95: z.number() }),
});
export type Usage = z.infer<typeof usageSchema>;

export const LOG_LEVELS = ['error', 'warn', 'info', 'debug'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

export const logEntrySchema = z.object({
  id: z.string(),
  at: z.number(),
  level: z.enum(LOG_LEVELS),
  method: z.string(),
  path: z.string(),
  status: z.number(),
  duration: z.number(),
  region: z.string(),
  requestId: z.string(),
  message: z.string(),
  payload: z.string(),
});
export type LogEntry = z.infer<typeof logEntrySchema>;

export const logsPageSchema = z.object({
  data: z.array(logEntrySchema),
  nextCursor: z.number().nullable(),
  total: z.number(),
  counts: z.record(z.string(), z.number()),
});

export const webhookSchema = z.object({
  id: z.string(),
  url: z.string(),
  description: z.string(),
  events: z.array(z.string()),
  status: z.enum(['enabled', 'disabled']),
  successRate: z.number(),
  lastDeliveryAt: z.number(),
  secretPrefix: z.string(),
});
export type Webhook = z.infer<typeof webhookSchema>;

export const deliverySchema = z.object({
  id: z.string(),
  webhookId: z.string(),
  event: z.string(),
  status: z.enum(['succeeded', 'failed', 'retrying']),
  httpStatus: z.number().nullable(),
  duration: z.number(),
  at: z.number(),
  attempt: z.number(),
  payload: z.string(),
});
export type Delivery = z.infer<typeof deliverySchema>;

const meterSchema = z.object({ used: z.number(), limit: z.number() });
export const planSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  requests: z.number(),
  seats: z.number(),
  storage: z.number(),
  features: z.array(z.string()),
});
export type Plan = z.infer<typeof planSchema>;

export const billingSchema = z.object({
  planId: z.string(),
  renewsAt: z.number(),
  paymentMethod: z.object({
    brand: z.string(),
    last4: z.string(),
    exp: z.string(),
    name: z.string(),
  }),
  invoices: z.array(
    z.object({
      id: z.string(),
      number: z.string(),
      date: z.number(),
      amount: z.number(),
      status: z.enum(['paid', 'open', 'void']),
    }),
  ),
  plans: z.array(planSchema),
  usage: z.object({ requests: meterSchema, seats: meterSchema, storage: meterSchema }),
});
export type Billing = z.infer<typeof billingSchema>;

export const ROLES = ['owner', 'admin', 'developer', 'billing', 'viewer'] as const;
export type Role = (typeof ROLES)[number];

export const memberSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(ROLES),
  lastActiveAt: z.number(),
  mfa: z.boolean(),
});
export type Member = z.infer<typeof memberSchema>;
export const inviteSchema = z.object({
  id: z.string(),
  email: z.string(),
  role: z.enum(ROLES),
  sentAt: z.number(),
  invitedBy: z.string(),
});
export const teamSchema = z.object({
  members: z.array(memberSchema),
  invites: z.array(inviteSchema),
});

export const REGIONS = ['iad1', 'sfo1', 'fra1', 'sin1'] as const;

export const settingsSchema = z.object({
  workspaceName: z.string().trim().min(2).max(48),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .regex(/^[a-z0-9-]+$/),
  region: z.enum(REGIONS),
  timezone: z.string(),
  ipAllowlist: z.array(z.string()),
  requireMfa: z.boolean(),
  sessionTimeout: z.number().int().min(15).max(1440),
  notifications: z.object({
    usageAlerts: z.boolean(),
    weeklyDigest: z.boolean(),
    incidents: z.boolean(),
    productNews: z.boolean(),
  }),
});
export type Settings = z.infer<typeof settingsSchema>;
