import { z } from 'zod';

/* ---------------------------------- Customers --------------------------------- */

export const CUSTOMER_PLANS = ['hobby', 'teams', 'scale', 'enterprise'] as const;
export type CustomerPlan = (typeof CUSTOMER_PLANS)[number];
export const CHURN_RISKS = ['low', 'medium', 'high'] as const;
export type ChurnRisk = (typeof CHURN_RISKS)[number];

export const customerSchema = z.object({
  id: z.string(),
  name: z.string(),
  domain: z.string(),
  contact: z.string(),
  email: z.string(),
  plan: z.enum(CUSTOMER_PLANS),
  status: z.enum(['active', 'trialing', 'past_due']),
  mrr: z.number(),
  seats: z.number(),
  seatsUsed: z.number(),
  health: z.number(),
  churnRisk: z.enum(CHURN_RISKS),
  region: z.string(),
  createdAt: z.number(),
  trialEndsAt: z.number().nullable(),
});
export type Customer = z.infer<typeof customerSchema>;

export const customerDetailSchema = customerSchema.extend({
  usage: z.array(z.object({ day: z.number(), requests: z.number() })),
  invoices: z.array(
    z.object({
      id: z.string(),
      number: z.string(),
      date: z.number(),
      amount: z.number(),
      status: z.enum(['paid', 'open']),
    }),
  ),
});
export type CustomerDetail = z.infer<typeof customerDetailSchema>;

/* -------------------------------- Feature flags -------------------------------- */

export const FLAG_ENVS = ['development', 'staging', 'production'] as const;
export type FlagEnv = (typeof FLAG_ENVS)[number];

export const flagSchema = z.object({
  id: z.string(),
  key: z.string(),
  description: z.string(),
  owner: z.string(),
  updatedAt: z.number(),
  environments: z.record(z.enum(FLAG_ENVS), z.boolean()),
  rollout: z.number().min(0).max(100),
  rules: z.array(
    z.object({
      attribute: z.string(),
      operator: z.enum(['in', 'endsWith', 'gte']),
      value: z.string(),
    }),
  ),
});
export type Flag = z.infer<typeof flagSchema>;
export type FlagPatch = {
  id: string;
  environments?: Partial<Flag['environments']>;
  rollout?: number;
};

/* ---------------------------------- Audit log ---------------------------------- */

export const AUDIT_CATEGORIES = [
  'auth',
  'api_keys',
  'team',
  'billing',
  'settings',
  'flags',
] as const;
export type AuditCategory = (typeof AUDIT_CATEGORIES)[number];
export const AUDIT_SEVERITIES = ['info', 'warning', 'critical'] as const;

export const auditEventSchema = z.object({
  id: z.string(),
  at: z.number(),
  actor: z.object({ name: z.string(), email: z.string() }),
  action: z.string(),
  category: z.enum(AUDIT_CATEGORIES),
  severity: z.enum(AUDIT_SEVERITIES),
  target: z.string(),
  ip: z.string(),
  location: z.string(),
  payload: z.string(),
});
export type AuditEvent = z.infer<typeof auditEventSchema>;

/* ------------------------------- Status & incidents ------------------------------ */

export const COMPONENT_STATUSES = [
  'operational',
  'degraded',
  'partial_outage',
  'major_outage',
] as const;
export type ComponentStatus = (typeof COMPONENT_STATUSES)[number];
export const INCIDENT_IMPACTS = ['minor', 'major', 'critical'] as const;
export const INCIDENT_STATUSES = ['investigating', 'identified', 'monitoring', 'resolved'] as const;

export const statusComponentSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(COMPONENT_STATUSES),
  days: z.array(z.object({ day: z.number(), downtime: z.number() })),
});
export type StatusComponent = z.infer<typeof statusComponentSchema>;

export const incidentSchema = z.object({
  id: z.string(),
  title: z.string(),
  impact: z.enum(INCIDENT_IMPACTS),
  status: z.enum(INCIDENT_STATUSES),
  componentIds: z.array(z.string()),
  startedAt: z.number(),
  resolvedAt: z.number().nullable(),
  updates: z.array(
    z.object({
      id: z.string(),
      status: z.enum(INCIDENT_STATUSES),
      message: z.string(),
      at: z.number(),
    }),
  ),
});
export type Incident = z.infer<typeof incidentSchema>;

export const statusSchema = z.object({
  components: z.array(statusComponentSchema),
  incidents: z.array(incidentSchema),
});

export const incidentFormSchema = z.object({
  title: z.string().trim().min(5).max(120),
  impact: z.enum(INCIDENT_IMPACTS),
  componentIds: z.array(z.string()).min(1),
  message: z.string().trim().min(10).max(1000),
});
export type IncidentForm = z.infer<typeof incidentFormSchema>;
