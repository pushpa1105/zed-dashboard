import { z } from 'zod';

/* Shared enums ------------------------------------------------------------- */

export const SHIPMENT_STATUSES = [
  'booked',
  'picked_up',
  'in_transit',
  'at_hub',
  'out_for_delivery',
  'delivered',
  'exception',
] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const TRANSPORT_MODES = ['road', 'rail', 'sea', 'air'] as const;
export type TransportMode = (typeof TRANSPORT_MODES)[number];

export const SEVERITIES = ['critical', 'high', 'medium', 'low'] as const;
export type Severity = (typeof SEVERITIES)[number];

export const VEHICLE_STATUSES = ['on_route', 'idle', 'charging', 'maintenance'] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const DRIVER_STATUSES = ['driving', 'on_break', 'available', 'off_duty'] as const;
export type DriverStatus = (typeof DRIVER_STATUSES)[number];

/* Network ------------------------------------------------------------------- */

/** A depot or cross-dock. `x`/`y` are coordinates on the 1040×600 map canvas. */
export const hubSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  x: z.number(),
  y: z.number(),
});
export type Hub = z.infer<typeof hubSchema>;

export const laneSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  shipments: z.number(),
  onTime: z.number(),
  active: z.boolean(),
});
export type Lane = z.infer<typeof laneSchema>;

/* Shipments ------------------------------------------------------------------ */

export const shipmentSchema = z.object({
  id: z.string(),
  reference: z.string(),
  customer: z.string(),
  origin: z.string(),
  destination: z.string(),
  carrier: z.string(),
  mode: z.enum(TRANSPORT_MODES),
  status: z.enum(SHIPMENT_STATUSES),
  priority: z.boolean(),
  pallets: z.number(),
  weightKg: z.number(),
  progress: z.number(),
  shippedAt: z.string(),
  eta: z.string(),
  delayMinutes: z.number(),
});
export type Shipment = z.infer<typeof shipmentSchema>;

export const checkpointSchema = z.object({
  id: z.string(),
  at: z.string(),
  location: z.string(),
  event: z.string(),
  note: z.string().nullable(),
  state: z.enum(['done', 'current', 'upcoming']),
});
export type Checkpoint = z.infer<typeof checkpointSchema>;

export const shipmentDetailSchema = shipmentSchema.extend({
  checkpoints: z.array(checkpointSchema),
  contents: z.string(),
  dimensions: z.string(),
  declaredValue: z.number(),
  temperature: z.string().nullable(),
  trailer: z.string(),
  proofOfDelivery: z
    .object({ signedBy: z.string(), at: z.string(), photos: z.number(), note: z.string() })
    .nullable(),
});
export type ShipmentDetail = z.infer<typeof shipmentDetailSchema>;

/* Exceptions ------------------------------------------------------------------ */

export const exceptionSchema = z.object({
  id: z.string(),
  shipmentId: z.string(),
  type: z.enum(['delay', 'damage', 'address', 'customs', 'temperature', 'capacity']),
  severity: z.enum(SEVERITIES),
  title: z.string(),
  description: z.string(),
  location: z.string(),
  openedAt: z.string(),
  owner: z.string().nullable(),
  escalated: z.boolean(),
  suggestions: z.array(z.string()),
});
export type ShipmentException = z.infer<typeof exceptionSchema>;

/* Overview ------------------------------------------------------------------- */

export const overviewSchema = z.object({
  kpis: z.object({
    inTransit: z.number(),
    inTransitDelta: z.number(),
    onTimeRate: z.number(),
    onTimeDelta: z.number(),
    avgDelayMinutes: z.number(),
    avgDelayDelta: z.number(),
    openExceptions: z.number(),
    criticalExceptions: z.number(),
  }),
  hubs: z.array(hubSchema),
  lanes: z.array(laneSchema),
  volume: z.array(z.object({ day: z.string(), delivered: z.number(), returned: z.number() })),
  carriers: z.array(z.object({ name: z.string(), onTime: z.number(), shipments: z.number() })),
  exceptions: z.array(exceptionSchema),
});
export type LogisticsOverview = z.infer<typeof overviewSchema>;

/* Fleet & drivers ---------------------------------------------------------------- */

export const vehicleSchema = z.object({
  id: z.string(),
  plate: z.string(),
  model: z.string(),
  kind: z.enum(['electric_van', 'rigid_truck', 'tractor_unit', 'reefer']),
  status: z.enum(VEHICLE_STATUSES),
  energy: z.number(),
  electric: z.boolean(),
  odometerKm: z.number(),
  nextServiceKm: z.number(),
  location: z.string(),
  driver: z.string().nullable(),
  loadPct: z.number(),
});
export type Vehicle = z.infer<typeof vehicleSchema>;

export const driverSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(DRIVER_STATUSES),
  vehicle: z.string().nullable(),
  base: z.string(),
  drivingToday: z.number(),
  dutyToday: z.number(),
  weekHours: z.number(),
  rating: z.number(),
  deliveriesToday: z.number(),
  phone: z.string(),
});
export type Driver = z.infer<typeof driverSchema>;

const SERVICE_TYPES = ['oil_service', 'brakes', 'tyres', 'inspection', 'electrical'] as const;
const VEHICLE_DOCUMENTS = ['registration', 'insurance', 'inspection', 'tachograph'] as const;

export const vehicleDetailSchema = vehicleSchema.extend({
  vin: z.string(),
  year: z.number(),
  payloadKg: z.number(),
  /** Litres of diesel, or kWh of battery for electric vehicles. */
  tankCapacity: z.number(),
  efficiency: z.array(
    z.object({ week: z.string(), distanceKm: z.number(), consumption: z.number() }),
  ),
  maintenance: z.array(
    z.object({
      id: z.string(),
      date: z.string(),
      type: z.enum(SERVICE_TYPES),
      workshop: z.string(),
      odometerKm: z.number(),
      cost: z.number(),
    }),
  ),
  upcoming: z.array(
    z.object({
      id: z.string(),
      type: z.enum(SERVICE_TYPES),
      dueAt: z.string(),
      dueKm: z.number().nullable(),
    }),
  ),
  documents: z.array(
    z.object({
      id: z.string(),
      type: z.enum(VEHICLE_DOCUMENTS),
      reference: z.string(),
      expiresAt: z.string(),
    }),
  ),
});
export type VehicleDetail = z.infer<typeof vehicleDetailSchema>;

const SAFETY_EVENTS = [
  'harsh_braking',
  'speeding',
  'harsh_cornering',
  'phone_use',
  'idling',
] as const;

export const driverDetailSchema = driverSchema.extend({
  licenseClass: z.string(),
  licenseExpiresAt: z.string(),
  hiredAt: z.string(),
  onTimeRate: z.number(),
  deliveries30d: z.number(),
  distance30dKm: z.number(),
  safetyScore: z.number(),
  hours: z.array(z.object({ day: z.string(), driving: z.number(), duty: z.number() })),
  trips: z.array(
    z.object({
      id: z.string(),
      from: z.string(),
      to: z.string(),
      date: z.string(),
      distanceKm: z.number(),
      stops: z.number(),
      delayMinutes: z.number(),
    }),
  ),
  safetyEvents: z.array(
    z.object({
      id: z.string(),
      type: z.enum(SAFETY_EVENTS),
      severity: z.enum(['high', 'medium', 'low']),
      at: z.string(),
      location: z.string(),
    }),
  ),
});
export type DriverDetail = z.infer<typeof driverDetailSchema>;

/* Route planning ------------------------------------------------------------------ */

export const stopSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  x: z.number(),
  y: z.number(),
  windowStart: z.string(),
  windowEnd: z.string(),
  serviceMinutes: z.number(),
  parcels: z.number(),
});
export type Stop = z.infer<typeof stopSchema>;

export const plannedRouteSchema = z.object({
  id: z.string(),
  name: z.string(),
  depot: z.string(),
  depotX: z.number(),
  depotY: z.number(),
  vehicle: z.string(),
  driver: z.string(),
  departure: z.string(),
  capacity: z.number(),
  stops: z.array(stopSchema),
});
export type PlannedRoute = z.infer<typeof plannedRouteSchema>;

/* Docks --------------------------------------------------------------------------- */

export const dockSlotSchema = z.object({
  id: z.string(),
  dock: z.string(),
  start: z.number(),
  end: z.number(),
  direction: z.enum(['inbound', 'outbound']),
  carrier: z.string(),
  trailer: z.string(),
  pallets: z.number(),
  status: z.enum(['scheduled', 'arrived', 'loading', 'done']),
});
export type DockSlot = z.infer<typeof dockSlotSchema>;

export const dockDaySchema = z.object({
  docks: z.array(z.string()),
  openHour: z.number(),
  closeHour: z.number(),
  slots: z.array(dockSlotSchema),
});
export type DockDay = z.infer<typeof dockDaySchema>;

export type NewDockSlot = Pick<
  DockSlot,
  'dock' | 'start' | 'end' | 'direction' | 'carrier' | 'trailer' | 'pallets'
>;
