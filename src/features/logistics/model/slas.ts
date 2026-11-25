import { z } from 'zod';

export const SLA_TIERS = ['platinum', 'gold', 'standard'] as const;
export const ROOT_CAUSES = [
  'carrier_delay',
  'weather',
  'customs',
  'capacity',
  'handling',
  'address',
] as const;
export type RootCause = (typeof ROOT_CAUSES)[number];

export const slaCustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  tier: z.enum(SLA_TIERS),
  /** Shipments in the last 30 days. */
  shipments: z.number(),
  targetOnTimePct: z.number(),
  onTimePct: z.number(),
  targetTransitHours: z.number(),
  transitHours: z.number(),
  breaches: z.number(),
  /** Weekly on-time %, oldest first. */
  trend: z.array(z.object({ week: z.string(), onTimePct: z.number() })),
});
export type SlaCustomer = z.infer<typeof slaCustomerSchema>;

export const breachSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  customer: z.string(),
  shipmentId: z.string(),
  metric: z.enum(['on_time', 'transit']),
  occurredAt: z.string(),
  delayHours: z.number(),
  rootCause: z.enum(ROOT_CAUSES),
  /** Freight charged for the shipment, the ceiling for a credit note. */
  freightCharge: z.number(),
  credit: z.number().nullable(),
});
export type Breach = z.infer<typeof breachSchema>;

export const slasSchema = z.object({
  customers: z.array(slaCustomerSchema),
  breaches: z.array(breachSchema),
});
export type Slas = z.infer<typeof slasSchema>;

export const SLA_HEALTH = ['met', 'at_risk', 'breached'] as const;
export type SlaHealth = (typeof SLA_HEALTH)[number];

/** Breached when a target is missed; at risk within 1 pt (on-time) or 10% (transit) of it. */
export function slaHealth(c: SlaCustomer): SlaHealth {
  if (c.onTimePct < c.targetOnTimePct || c.transitHours > c.targetTransitHours) return 'breached';
  if (c.onTimePct < c.targetOnTimePct + 1 || c.transitHours > c.targetTransitHours * 0.9) {
    return 'at_risk';
  }
  return 'met';
}

/** Default credit offered: 15% of the freight charge. */
export const suggestedCredit = (breach: Breach) => Math.round(breach.freightCharge * 0.15);
