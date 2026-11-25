import { z } from 'zod';

import { TRANSPORT_MODES } from './logistics';

export const PERIODS = ['30d', '90d', '12m'] as const;
export type Period = (typeof PERIODS)[number];

/** Network on-time target used across reports. */
export const ON_TIME_TARGET = 95;

const kpisSchema = z.object({
  shipments: z.number(),
  onTimePct: z.number(),
  costPerShipment: z.number(),
  utilisationPct: z.number(),
});
export type PerformanceKpis = z.infer<typeof kpisSchema>;

export const lanePerformanceSchema = z.object({
  id: z.string(),
  origin: z.string(),
  destination: z.string(),
  mode: z.enum(TRANSPORT_MODES),
  distanceKm: z.number(),
  shipments: z.number(),
  onTimePct: z.number(),
  transitHours: z.number(),
  costPerShipment: z.number(),
  utilisationPct: z.number(),
});
export type LanePerformance = z.infer<typeof lanePerformanceSchema>;

export const performanceSchema = z.object({
  current: kpisSchema,
  previous: kpisSchema,
  /** Daily points for 30d, weekly for 90d, monthly for 12m. */
  series: z.array(kpisSchema.extend({ date: z.string() })),
  lanes: z.array(lanePerformanceSchema),
});
export type Performance = z.infer<typeof performanceSchema>;
