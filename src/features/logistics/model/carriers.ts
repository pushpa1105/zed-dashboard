import { z } from 'zod';

import { mean } from '../lib/math';

import { TRANSPORT_MODES } from './logistics';

export const CARRIER_STATUSES = ['active', 'suspended'] as const;
export type CarrierStatus = (typeof CARRIER_STATUSES)[number];

const scorecardSchema = z.object({
  onTime: z.number(),
  damage: z.number(),
  cost: z.number(),
  compliance: z.number(),
  service: z.number(),
});
export type Scorecard = z.infer<typeof scorecardSchema>;

export const carrierSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  mode: z.enum(TRANSPORT_MODES),
  status: z.enum(CARRIER_STATUSES),
  /** Shipments handled in the last 90 days. */
  shipments: z.number(),
  onTimePct: z.number(),
  damageRatePct: z.number(),
  /** Price level against the market average of 100. */
  costIndex: z.number(),
  scorecard: scorecardSchema,
  /** Monthly on-time %, oldest first. */
  onTimeTrend: z.array(z.number()),
});
export type Carrier = z.infer<typeof carrierSchema>;

export const carrierLaneSchema = z.object({
  id: z.string(),
  origin: z.string(),
  destination: z.string(),
  distanceKm: z.number(),
  ratePerKm: z.number(),
  onTimePct: z.number(),
  shipments: z.number(),
});

export const carrierDetailSchema = carrierSchema.extend({
  contact: z.string(),
  email: z.string(),
  contractStart: z.string(),
  contractEnd: z.string(),
  paymentTermsDays: z.number(),
  lanes: z.array(carrierLaneSchema),
});
export type CarrierDetail = z.infer<typeof carrierDetailSchema>;

export type Grade = 'A' | 'B' | 'C' | 'D';

/** Scorecard average (0–100) and the letter grade procurement uses in reviews. */
export function carrierScore(scorecard: Scorecard) {
  const score = Math.round(mean(Object.values(scorecard)));
  const grade: Grade = score >= 85 ? 'A' : score >= 75 ? 'B' : score >= 65 ? 'C' : 'D';
  return { score, grade };
}
