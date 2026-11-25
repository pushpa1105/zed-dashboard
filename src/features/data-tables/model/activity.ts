import { z } from 'zod';

export const ACTIVITY_SEVERITIES = ['info', 'warning', 'critical'] as const;

export const activityEventSchema = z.object({
  id: z.string(),
  at: z.string(),
  actor: z.string(),
  action: z.enum(['created', 'updated', 'deleted', 'exported', 'signed_in', 'invited']),
  resource: z.string(),
  ip: z.string(),
  severity: z.enum(ACTIVITY_SEVERITIES),
});

export const activityPageSchema = z.object({
  items: z.array(activityEventSchema),
  nextCursor: z.number().nullable(),
  total: z.number(),
});

export type ActivityEvent = z.infer<typeof activityEventSchema>;
export type ActivityFilters = { q: string; severity: (typeof ACTIVITY_SEVERITIES)[number] | null };
