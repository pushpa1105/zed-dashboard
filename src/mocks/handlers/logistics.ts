import { http, HttpResponse, type HttpHandler } from 'msw';

import { errorResponse } from '../utils';

import { logisticsCarrierHandlers } from './logistics-carriers';
import { logisticsReportHandlers } from './logistics-reports';
import {
  API,
  CUSTOMERS,
  DAY,
  guarded,
  HOUR,
  iso,
  now,
  pick,
  rng,
  round1,
} from './logistics-shared';

/**
 * Mock API for the "logistics" workspace: a European road/rail/sea network.
 * Data is deterministic (seeded) and mutations live in memory until reload.
 * Types are declared here on purpose: the mock layer must not import features.
 */

const CARRIERS = [
  'Northline Freight',
  'Rhenus Road',
  'Alpine Express',
  'BaltRail',
  'Iberia Cargo',
  'Own fleet',
];

/* Network --------------------------------------------------------------------- */

// Canvas projection: x = (lon + 10) * 24, y = (61 - lat) * 24 (see the map component).
const proj = (lon: number, lat: number) => ({
  x: Math.round((lon + 10) * 24),
  y: Math.round((61 - lat) * 24),
});

const HUBS = [
  { id: 'rtm', name: 'Rotterdam', country: 'NL', ...proj(4.5, 51.9) },
  { id: 'ham', name: 'Hamburg', country: 'DE', ...proj(10, 53.5) },
  { id: 'ant', name: 'Antwerp', country: 'BE', ...proj(4.4, 51.2) },
  { id: 'par', name: 'Paris Nord', country: 'FR', ...proj(2.35, 48.85) },
  { id: 'lyo', name: 'Lyon', country: 'FR', ...proj(4.8, 45.8) },
  { id: 'mad', name: 'Madrid', country: 'ES', ...proj(-3.7, 40.4) },
  { id: 'bcn', name: 'Barcelona', country: 'ES', ...proj(2.2, 41.4) },
  { id: 'mil', name: 'Milan', country: 'IT', ...proj(9.2, 45.5) },
  { id: 'muc', name: 'Munich', country: 'DE', ...proj(11.6, 48.1) },
  { id: 'prg', name: 'Prague', country: 'CZ', ...proj(14.4, 50.1) },
  { id: 'vie', name: 'Vienna', country: 'AT', ...proj(16.4, 48.2) },
  { id: 'waw', name: 'Warsaw', country: 'PL', ...proj(21, 52.2) },
  { id: 'cph', name: 'Copenhagen', country: 'DK', ...proj(12.6, 55.7) },
  { id: 'lis', name: 'Lisbon', country: 'PT', ...proj(-9.1, 38.7) },
] as const;
type HubId = (typeof HUBS)[number]['id'];
const hubName = (id: string) => HUBS.find((h) => h.id === id)?.name ?? id;

const LANE_PAIRS: Array<[HubId, HubId]> = [
  ['rtm', 'ham'],
  ['rtm', 'par'],
  ['ant', 'lyo'],
  ['par', 'mad'],
  ['lyo', 'mil'],
  ['ham', 'cph'],
  ['ham', 'waw'],
  ['muc', 'vie'],
  ['prg', 'waw'],
  ['mil', 'muc'],
  ['bcn', 'lyo'],
  ['mad', 'lis'],
  ['rtm', 'muc'],
  ['ant', 'prg'],
];

const CONTENTS = [
  'Chilled dairy, 18 pallets',
  'Flat-pack furniture',
  'Medical consumables',
  'Consumer electronics',
  'Outdoor apparel, seasonal',
  'Automotive parts',
  'Packaged coffee',
  'Pharmaceuticals (2–8 °C)',
];

/* Shipments ------------------------------------------------------------------- */

type Status =
  'booked' | 'picked_up' | 'in_transit' | 'at_hub' | 'out_for_delivery' | 'delivered' | 'exception';

type DbShipment = {
  id: string;
  reference: string;
  customer: string;
  origin: string;
  destination: string;
  carrier: string;
  mode: 'road' | 'rail' | 'sea' | 'air';
  status: Status;
  priority: boolean;
  pallets: number;
  weightKg: number;
  progress: number;
  shippedAt: string;
  eta: string;
  delayMinutes: number;
  contents: string;
  trailer: string;
  declaredValue: number;
};

const STATUS_WEIGHTS: Array<[Status, number]> = [
  ['booked', 0.08],
  ['picked_up', 0.08],
  ['in_transit', 0.34],
  ['at_hub', 0.12],
  ['out_for_delivery', 0.1],
  ['delivered', 0.22],
  ['exception', 0.06],
];
const PROGRESS: Record<Status, [number, number]> = {
  booked: [0, 0],
  picked_up: [0.05, 0.15],
  in_transit: [0.2, 0.75],
  at_hub: [0.45, 0.7],
  out_for_delivery: [0.85, 0.95],
  delivered: [1, 1],
  exception: [0.3, 0.8],
};

function seedShipments(): DbShipment[] {
  const rand = rng(4242);
  const start = now();
  return Array.from({ length: 186 }, (_, i) => {
    const [o, d] = pick(rand, LANE_PAIRS);
    const reverse = rand() > 0.5;
    let r = rand();
    let status: Status = 'in_transit';
    for (const [s, w] of STATUS_WEIGHTS) {
      if (r < w) {
        status = s;
        break;
      }
      r -= w;
    }
    const [lo, hi] = PROGRESS[status];
    const shipped = start - Math.round((6 + rand() * 90) * HOUR);
    const eta =
      start + Math.round((status === 'delivered' ? -rand() * 48 : 2 + rand() * 60) * HOUR);
    const pallets = 2 + Math.floor(rand() * 32);
    return {
      id: `SHP-${(24_810 + i * 7).toString()}`,
      reference: `PO-${(88_000 + Math.floor(rand() * 9_000)).toString()}`,
      customer: pick(rand, CUSTOMERS),
      origin: hubName(reverse ? d : o),
      destination: hubName(reverse ? o : d),
      carrier: pick(rand, CARRIERS),
      mode: rand() > 0.82 ? 'rail' : rand() > 0.95 ? 'sea' : rand() > 0.97 ? 'air' : 'road',
      status,
      priority: rand() > 0.84,
      pallets,
      weightKg: Math.round(pallets * (320 + rand() * 380)),
      progress: Math.round((lo + rand() * (hi - lo)) * 100) / 100,
      shippedAt: new Date(shipped).toISOString(),
      eta: new Date(eta).toISOString(),
      delayMinutes:
        status === 'exception'
          ? 60 + Math.floor(rand() * 400)
          : rand() > 0.8
            ? Math.floor(rand() * 90)
            : 0,
      contents: pick(rand, CONTENTS),
      trailer: `TR-${(400 + Math.floor(rand() * 500)).toString()}`,
      declaredValue: Math.round(pallets * (900 + rand() * 4_000)),
    };
  });
}

const shipments = seedShipments();
const summary = ({ contents: _c, trailer: _t, declaredValue: _v, ...s }: DbShipment) => s;

function checkpointsFor(s: DbShipment) {
  const shipped = Date.parse(s.shippedAt);
  const eta = Date.parse(s.eta);
  const span = Math.max(eta - shipped, 6 * HOUR);
  // A cross-dock that is neither end of the trip.
  const candidates = HUBS.filter((h) => h.name !== s.origin && h.name !== s.destination);
  const midHub = candidates[(s.id.charCodeAt(6) + s.id.charCodeAt(7)) % candidates.length]!.name;
  const steps = [
    {
      at: 0,
      location: s.origin,
      event: 'Picked up from shipper dock',
      note: `Trailer ${s.trailer} sealed`,
    },
    { at: 0.08, location: s.origin, event: 'Departed origin hub', note: null },
    {
      at: 0.4,
      location: midHub,
      event: 'Arrived at cross-dock',
      note: 'Scanned, 0 pieces missing',
    },
    { at: 0.5, location: midHub, event: 'Departed cross-dock', note: null },
    { at: 0.88, location: s.destination, event: 'Out for delivery', note: 'Driver assigned' },
    { at: 1, location: s.destination, event: 'Delivered', note: null },
  ];
  // Steps completed for each status; the next one is 'current'.
  const DONE: Record<Status, number> = {
    booked: 0,
    picked_up: 1,
    in_transit: 2,
    at_hub: 3,
    out_for_delivery: 5,
    delivered: 6,
    exception: s.progress > 0.5 ? 3 : 2,
  };
  const doneCount = DONE[s.status];
  let currentSet = false;
  return steps.map((step, i) => {
    const done = i < doneCount;
    let state: 'done' | 'current' | 'upcoming' = done ? 'done' : 'upcoming';
    if (!done && !currentSet) {
      state = 'current';
      currentSet = true;
    }
    if (s.status === 'exception' && state === 'current') {
      return {
        id: `${s.id}-c${i}`,
        at: new Date(shipped + span * step.at).toISOString(),
        location: step.location,
        event: 'Held: exception raised',
        note: `Delayed ${s.delayMinutes} min. Operations notified.`,
        state,
      };
    }
    return {
      id: `${s.id}-c${i}`,
      at: new Date(
        shipped + span * step.at + (state === 'upcoming' ? s.delayMinutes * 60_000 : 0),
      ).toISOString(),
      location: step.location,
      event: step.event,
      note: step.note,
      state,
    };
  });
}

/* Exceptions ------------------------------------------------------------------- */

type DbException = {
  id: string;
  shipmentId: string;
  type: 'delay' | 'damage' | 'address' | 'customs' | 'temperature' | 'capacity';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  location: string;
  openedAt: string;
  owner: string | null;
  escalated: boolean;
  suggestions: string[];
};

const EXCEPTION_TEMPLATES: Array<
  Omit<DbException, 'id' | 'shipmentId' | 'location' | 'openedAt' | 'owner' | 'escalated'>
> = [
  {
    type: 'temperature',
    severity: 'critical',
    title: 'Reefer above 8 °C for 22 minutes',
    description:
      'Trailer telemetry reported 9.4 °C after a compressor restart. Load is temperature-controlled pharma.',
    suggestions: [
      'Call the driver to confirm reefer status',
      'Quarantine the load on arrival',
      'Notify the shipper QA contact',
    ],
  },
  {
    type: 'delay',
    severity: 'high',
    title: 'Missed linehaul cut-off',
    description:
      'Arrived at the cross-dock 48 minutes after the departure cut-off. Next linehaul leaves in 6 hours.',
    suggestions: [
      'Rebook on the next linehaul',
      'Offer the customer an expedited upgrade',
      'Update the ETA',
    ],
  },
  {
    type: 'damage',
    severity: 'high',
    title: 'Two pallets damaged at unloading',
    description: 'Forklift contact on pallets 7 and 8. Photos attached by the dock team.',
    suggestions: [
      'Open a carrier claim',
      'Ask the consignee to accept partial delivery',
      'Reship replacement goods',
    ],
  },
  {
    type: 'address',
    severity: 'medium',
    title: 'Consignee address incomplete',
    description:
      'Dock number missing and the site has four gates. Driver cannot confirm the drop location.',
    suggestions: ['Contact the consignee for the dock number', 'Hold at depot until confirmed'],
  },
  {
    type: 'customs',
    severity: 'medium',
    title: 'Commercial invoice missing HS codes',
    description: 'Customs broker cannot file the declaration without HS codes on lines 3–6.',
    suggestions: [
      'Request corrected invoice from shipper',
      'Share broker contact with the shipper',
    ],
  },
  {
    type: 'capacity',
    severity: 'low',
    title: 'Load exceeds booked pallets',
    description: 'Shipper presented 26 pallets against a booking of 22. Trailer has room for 33.',
    suggestions: ['Re-rate the booking', 'Confirm the extra pallets with the shipper'],
  },
  {
    type: 'delay',
    severity: 'low',
    title: 'Driver rest stop extended',
    description: 'Mandatory 45-minute break extended due to parking availability near Lyon.',
    suggestions: ['Update the ETA', 'No customer action needed'],
  },
];

function seedExceptions(): DbException[] {
  const rand = rng(77);
  const flagged = shipments.filter((s) => s.status === 'exception' || s.delayMinutes > 60);
  return flagged.slice(0, 14).map((s, i) => {
    const template = EXCEPTION_TEMPLATES[i % EXCEPTION_TEMPLATES.length]!;
    return {
      ...template,
      id: `EXC-${(3_100 + i).toString()}`,
      shipmentId: s.id,
      location: rand() > 0.5 ? s.origin : s.destination,
      openedAt: new Date(now() - Math.round((0.3 + rand() * 30) * HOUR)).toISOString(),
      owner: rand() > 0.55 ? pick(rand, ['Ines Duarte', 'Tomas Reyes', 'Aiko Tanaka']) : null,
      escalated: template.severity === 'critical' && rand() > 0.5,
    };
  });
}
let exceptions = seedExceptions();

/* Fleet & drivers ---------------------------------------------------------------- */

const DRIVER_NAMES = [
  'Jonas Weber',
  'Marta Kowalska',
  'Luca Bianchi',
  'Sofia Alvarez',
  'Pieter de Vries',
  'Karin Holm',
  'Mehmet Yilmaz',
  'Chloé Martin',
  'Pavel Novak',
  'Aisha Rahman',
  'Diego Ortega',
  'Freya Larsen',
  'Tomasz Zielinski',
  'Nina Hofmann',
];

function seedFleet() {
  const rand = rng(9001);
  const kinds = [
    { kind: 'electric_van', model: 'Mercedes eSprinter', electric: true },
    { kind: 'electric_van', model: 'Renault Master E-Tech', electric: true },
    { kind: 'rigid_truck', model: 'Volvo FL 18t', electric: false },
    { kind: 'tractor_unit', model: 'Scania R 450', electric: false },
    { kind: 'tractor_unit', model: 'DAF XF 480', electric: false },
    { kind: 'reefer', model: 'MAN TGX + Schmitz reefer', electric: false },
  ] as const;
  const statuses = ['on_route', 'on_route', 'on_route', 'idle', 'charging', 'maintenance'] as const;
  return Array.from({ length: 16 }, (_, i) => {
    const k = kinds[i % kinds.length]!;
    let status: (typeof statuses)[number] = pick(rand, statuses);
    if (status === 'charging' && !k.electric) status = 'idle';
    const odo = 40_000 + Math.floor(rand() * 380_000);
    return {
      id: `veh-${i + 1}`,
      plate: `${pick(rand, ['NL', 'DE', 'BE', 'FR'])}-${(100 + Math.floor(rand() * 899)).toString()}-${String.fromCharCode(65 + Math.floor(rand() * 26))}${String.fromCharCode(65 + Math.floor(rand() * 26))}`,
      model: k.model,
      kind: k.kind,
      status,
      energy: Math.round(status === 'charging' ? 20 + rand() * 50 : 15 + rand() * 85),
      electric: k.electric,
      odometerKm: odo,
      nextServiceKm: status === 'maintenance' ? 0 : Math.floor(rand() * 18_000),
      location: pick(rand, HUBS).name,
      driver: status === 'on_route' ? DRIVER_NAMES[i % DRIVER_NAMES.length]! : null,
      loadPct: status === 'on_route' ? Math.round(40 + rand() * 60) : 0,
    };
  });
}
const fleet = seedFleet();

function seedDrivers() {
  const rand = rng(31337);
  return DRIVER_NAMES.map((name, i) => {
    // Drivers with a vehicle on the road are driving or on a break; the rest
    // are waiting for a load or off duty, so status and assignment agree.
    const vehicle = fleet.find((v) => v.driver === name);
    const status = vehicle
      ? rand() > 0.2
        ? 'driving'
        : 'on_break'
      : rand() > 0.4
        ? 'available'
        : 'off_duty';
    const driving = status === 'off_duty' ? 0 : Math.round((1 + rand() * 8) * 10) / 10;
    return {
      id: `drv-${i + 1}`,
      name,
      status,
      vehicle: vehicle?.plate ?? null,
      base: pick(rand, HUBS).name,
      drivingToday: driving,
      dutyToday:
        status === 'off_duty'
          ? 0
          : Math.min(13, Math.round((driving + 0.5 + rand() * 2.5) * 10) / 10),
      weekHours: Math.round((18 + rand() * 38) * 10) / 10,
      rating: Math.round((4.1 + rand() * 0.9) * 10) / 10,
      deliveriesToday: status === 'off_duty' ? 0 : Math.floor(rand() * 26),
      phone: `+31 6 ${(10_000_000 + Math.floor(rand() * 89_999_999)).toString().replace(/(\d{4})(\d{4})/, '$1 $2')}`,
    };
  });
}
const drivers = seedDrivers();

/* Route planning ------------------------------------------------------------------ */

type DbStop = {
  id: string;
  name: string;
  address: string;
  x: number;
  y: number;
  windowStart: string;
  windowEnd: string;
  serviceMinutes: number;
  parcels: number;
};

// Route canvases are local city maps (0..1000 × 0..560), not the network map.
const ROTTERDAM_STOPS: Array<[string, string, number, number, string, string]> = [
  ['Albert Heijn XL Kralingen', 'Oudedijk 230, Rotterdam', 640, 210, '08:00', '10:00'],
  ['Erasmus MC (Gate C)', 'Doctor Molewaterplein 40', 420, 260, '08:30', '11:00'],
  ['Markthal Retail Units', 'Dominee Jan Scharpstraat 298', 520, 300, '09:00', '12:00'],
  ['Kop van Zuid Offices', 'Wilhelminakade 900', 560, 380, '10:00', '12:00'],
  ['Feyenoord Stadium Store', 'Van Zandvlietplein 3', 700, 470, '11:00', '14:00'],
  ['Hillegersberg Pharmacy', 'Straatweg 98', 470, 110, '12:00', '15:00'],
  ['Schiebroek Garden Centre', 'Wilgenplaslaan 5', 360, 80, '13:00', '16:00'],
  ['Delfshaven Brewery', 'Voorhaven 12', 260, 330, '14:00', '17:00'],
  ['Hoogvliet Distribution', 'Aveling 12, Hoogvliet', 140, 470, '15:00', '18:00'],
];
const HAMBURG_STOPS: Array<[string, string, number, number, string, string]> = [
  ['HafenCity Bookstore', 'Überseeboulevard 5', 560, 360, '07:30', '09:30'],
  ['Altona Fish Market Stalls', 'Große Elbstraße 9', 300, 380, '08:00', '10:00'],
  ['Eppendorf Clinic', 'Martinistraße 52', 420, 140, '09:00', '11:30'],
  ['Winterhude Café Row', 'Mühlenkamp 31', 560, 170, '10:00', '12:00'],
  ['Wandsbek Hardware', 'Wandsbeker Marktstraße 73', 780, 210, '11:00', '14:00'],
  ['Harburg Logistics Park', 'Seehafenstraße 20', 520, 500, '13:00', '16:00'],
];

function toStops(prefix: string, rows: typeof ROTTERDAM_STOPS, seed: number): DbStop[] {
  const rand = rng(seed);
  return rows.map(([name, address, x, y, windowStart, windowEnd], i) => ({
    id: `${prefix}-s${i + 1}`,
    name,
    address,
    x,
    y,
    windowStart,
    windowEnd,
    serviceMinutes: 6 + Math.floor(rand() * 14),
    parcels: 2 + Math.floor(rand() * 30),
  }));
}

const plannedRoutes = [
  {
    id: 'route-rtm-am',
    name: 'Rotterdam city · morning loop',
    depot: 'Rotterdam Waalhaven depot',
    depotX: 330,
    depotY: 430,
    vehicle: fleet[0]!.plate,
    driver: 'Pieter de Vries',
    departure: '07:15',
    capacity: 160,
    stops: toStops('rtm', ROTTERDAM_STOPS, 5),
  },
  {
    id: 'route-ham-am',
    name: 'Hamburg inner city',
    depot: 'Hamburg Billbrook depot',
    depotX: 700,
    depotY: 330,
    vehicle: fleet[1]!.plate,
    driver: 'Nina Hofmann',
    departure: '07:00',
    capacity: 120,
    stops: toStops('ham', HAMBURG_STOPS, 8),
  },
];

/* Docks ------------------------------------------------------------------------- */

type DbDockSlot = {
  id: string;
  dock: string;
  start: number;
  end: number;
  direction: 'inbound' | 'outbound';
  carrier: string;
  trailer: string;
  pallets: number;
  status: 'scheduled' | 'arrived' | 'loading' | 'done';
};

const DOCKS = ['Dock 1', 'Dock 2', 'Dock 3', 'Dock 4', 'Dock 5', 'Dock 6', 'Dock 7', 'Dock 8'];
const OPEN = 6;
const CLOSE = 22;

function seedDockSlots(): DbDockSlot[] {
  const rand = rng(1212);
  const slots: DbDockSlot[] = [];
  const hourNow = new Date().getHours() + new Date().getMinutes() / 60;
  DOCKS.forEach((dock, d) => {
    let t = OPEN + rand() * 1.5;
    let n = 0;
    while (t < CLOSE - 1) {
      const duration = [0.75, 1, 1.25, 1.5, 2][Math.floor(rand() * 5)]!;
      const start = Math.round(t * 4) / 4;
      const end = Math.min(CLOSE, start + duration);
      const status =
        end <= hourNow
          ? 'done'
          : start <= hourNow
            ? rand() > 0.5
              ? 'loading'
              : 'arrived'
            : 'scheduled';
      slots.push({
        id: `slot-${d}-${n++}`,
        dock,
        start,
        end,
        direction: d < 4 ? 'inbound' : 'outbound',
        carrier: pick(rand, CARRIERS),
        trailer: `TR-${(400 + Math.floor(rand() * 500)).toString()}`,
        pallets: 6 + Math.floor(rand() * 27),
        status,
      });
      t = end + 0.25 + rand() * 1.6;
    }
  });
  return slots;
}
let dockSlots = seedDockSlots();

/* Overview ----------------------------------------------------------------------- */

function overview() {
  const rand = rng(555);
  const inTransit = shipments.filter((s) =>
    ['picked_up', 'in_transit', 'at_hub', 'out_for_delivery'].includes(s.status),
  ).length;
  const delivered = shipments.filter((s) => s.status === 'delivered');
  const onTime = delivered.length
    ? delivered.filter((s) => s.delayMinutes < 15).length / delivered.length
    : 0;
  const delayed = shipments.filter((s) => s.delayMinutes > 0);
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now() - (13 - i) * 24 * HOUR);
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    return {
      day: d.toISOString().slice(0, 10),
      delivered: Math.round((weekend ? 120 : 380) + rand() * (weekend ? 60 : 140)),
      returned: Math.round((weekend ? 4 : 14) + rand() * 12),
    };
  });
  return {
    kpis: {
      inTransit,
      inTransitDelta: 6.2,
      onTimeRate: Math.round(onTime * 1000) / 10,
      onTimeDelta: 1.4,
      avgDelayMinutes: delayed.length
        ? Math.round(delayed.reduce((sum, s) => sum + s.delayMinutes, 0) / delayed.length)
        : 0,
      avgDelayDelta: -8.5,
      openExceptions: exceptions.length,
      criticalExceptions: exceptions.filter((e) => e.severity === 'critical').length,
    },
    hubs: HUBS,
    lanes: LANE_PAIRS.map(([from, to], i) => ({
      id: `lane-${i}`,
      from,
      to,
      shipments: shipments.filter(
        (s) =>
          (s.origin === hubName(from) && s.destination === hubName(to)) ||
          (s.origin === hubName(to) && s.destination === hubName(from)),
      ).length,
      onTime: Math.round((86 + rand() * 13) * 10) / 10,
      active: i % 5 !== 4,
    })),
    volume: days,
    carriers: CARRIERS.map((name) => ({
      name,
      shipments: shipments.filter((s) => s.carrier === name).length,
      onTime: Math.round((84 + rand() * 15) * 10) / 10,
    })).sort((a, b) => b.onTime - a.onTime),
    exceptions: [...exceptions]
      .sort((a, b) => sevRank(a.severity) - sevRank(b.severity))
      .slice(0, 5),
  };
}
const sevRank = (s: DbException['severity']) => ['critical', 'high', 'medium', 'low'].indexOf(s);

/* Vehicle & driver detail ---------------------------------------------------------- */

const seedOf = (id: string) => Number(id.replace(/\D/g, '')) || 1;

type DbVehicle = (typeof fleet)[number];
type DbDriver = (typeof drivers)[number];

// L/100 km for diesel, kWh/100 km for electric.
const EFFICIENCY: Record<DbVehicle['kind'], number> = {
  electric_van: 24,
  rigid_truck: 22,
  tractor_unit: 31,
  reefer: 34,
};
const PAYLOAD_KG: Record<DbVehicle['kind'], number> = {
  electric_van: 1_200,
  rigid_truck: 8_000,
  tractor_unit: 24_000,
  reefer: 22_000,
};
const SERVICE_TYPES = ['oil_service', 'brakes', 'tyres', 'inspection', 'electrical'] as const;
const WORKSHOPS = ['Waalhaven Truck Centre', 'MAN Service Hamburg', 'Scania Antwerp', 'Volvo Lyon'];

function vehicleDetail(v: DbVehicle) {
  const rand = rng(seedOf(v.id) * 97);
  const weeklyKm = v.electric ? 700 : 2_400;
  const documents = ['registration', 'insurance', 'inspection', 'tachograph'] as const;
  return {
    ...v,
    vin: `WDB${Math.floor(rand() * 1e14)
      .toString()
      .padStart(14, '0')}`,
    year: 2018 + Math.floor(rand() * 8),
    payloadKg: PAYLOAD_KG[v.kind],
    tankCapacity: v.electric ? 113 : v.kind === 'rigid_truck' ? 200 : 600,
    efficiency: Array.from({ length: 12 }, (_, i) => ({
      week: iso(now() - (11 - i) * 7 * DAY).slice(0, 10),
      distanceKm: Math.round(weeklyKm * (0.6 + rand() * 0.8)),
      consumption: round1(EFFICIENCY[v.kind] * (0.9 + rand() * 0.2)),
    })),
    maintenance: Array.from({ length: 5 }, (_, i) => ({
      id: `${v.id}-m${i}`,
      date: iso(now() - (12 + i * 60 + rand() * 30) * DAY),
      type: pick(rand, SERVICE_TYPES),
      workshop: pick(rand, WORKSHOPS),
      odometerKm: v.odometerKm - (i + 1) * (8_000 + Math.floor(rand() * 9_000)),
      cost: Math.round(180 + rand() * 2_200),
    })),
    upcoming: [
      {
        id: `${v.id}-u0`,
        type: v.electric ? 'electrical' : 'oil_service',
        dueAt: iso(now() + (v.nextServiceKm / weeklyKm) * 7 * DAY),
        dueKm: v.odometerKm + v.nextServiceKm,
      },
      {
        id: `${v.id}-u1`,
        type: 'inspection',
        dueAt: iso(now() + (20 + rand() * 150) * DAY),
        dueKm: null,
      },
    ],
    documents: documents.map((type, i) => ({
      id: `${v.id}-d${i}`,
      type,
      reference: `${type.slice(0, 3).toUpperCase()}-${(10_000 + Math.floor(rand() * 89_999)).toString()}`,
      expiresAt: iso(now() + (-20 + rand() * 300) * DAY),
    })),
  };
}

const SAFETY_TYPES = [
  'harsh_braking',
  'speeding',
  'harsh_cornering',
  'phone_use',
  'idling',
] as const;

function driverDetail(d: DbDriver) {
  const rand = rng(seedOf(d.id) * 131);
  // Spread the rest of the week's driving over the six previous days so the
  // chart adds up to the roster's weekly total.
  const weights = Array.from({ length: 6 }, () => 0.85 + rand() * 0.3);
  const sum = weights.reduce((a, b) => a + b, 0);
  const rest = Math.max(0, d.weekHours - d.drivingToday);
  const hours = [...weights.map((w) => round1((rest * w) / sum)), d.drivingToday].map(
    (driving, i) => ({
      day: iso(now() - (6 - i) * DAY).slice(0, 10),
      driving,
      duty: i === 6 ? d.dutyToday : driving ? round1(driving + 1 + rand() * 1.5) : 0,
    }),
  );
  const vehicle = fleet.find((v) => v.plate === d.vehicle);
  return {
    ...d,
    licenseClass: vehicle?.kind === 'electric_van' ? 'C1' : 'C+E',
    licenseExpiresAt: iso(now() + (60 + rand() * 1_400) * DAY),
    hiredAt: iso(now() - (200 + rand() * 2_400) * DAY),
    onTimeRate: round1(88 + rand() * 11),
    deliveries30d: 180 + Math.floor(rand() * 260),
    distance30dKm: 3_000 + Math.floor(rand() * 7_000),
    safetyScore: Math.round(72 + rand() * 27),
    hours,
    trips: Array.from({ length: 8 }, (_, i) => {
      const [from, to] = pick(rand, LANE_PAIRS);
      const delayMinutes = rand() > 0.75 ? Math.floor(10 + rand() * 80) : 0;
      return {
        id: `${d.id}-t${i}`,
        from: hubName(from),
        to: hubName(to),
        date: iso(now() - (i + 1 + rand() * 0.5) * DAY),
        distanceKm: 120 + Math.floor(rand() * 780),
        stops: 1 + Math.floor(rand() * 18),
        delayMinutes,
      };
    }),
    safetyEvents: Array.from({ length: Math.floor(rand() * 6) }, (_, i) => ({
      id: `${d.id}-e${i}`,
      type: pick(rand, SAFETY_TYPES),
      severity: pick(rand, ['high', 'medium', 'low'] as const),
      at: iso(now() - (0.5 + i * 3 + rand() * 3) * DAY),
      location: pick(rand, HUBS).name,
    })).sort((a, b) => b.at.localeCompare(a.at)),
  };
}

/* Dispatch ---------------------------------------------------------------------------- */

type DbOrder = {
  id: string;
  customer: string;
  city: string;
  windowStart: string;
  windowEnd: string;
  parcels: number;
  weightKg: number;
  priority: boolean;
  driverId: string | null;
};

const onShift = drivers.filter((d) => d.status !== 'off_duty');
const hhmm = (h: number) => `${h.toString().padStart(2, '0')}:00`;

function seedOrders(): DbOrder[] {
  const rand = rng(2024);
  return Array.from({ length: 24 }, (_, i) => {
    const start = 7 + Math.floor(rand() * 9);
    return {
      id: `ORD-${(51_200 + i * 3).toString()}`,
      customer: pick(rand, CUSTOMERS),
      city: pick(rand, HUBS).name,
      windowStart: hhmm(start),
      windowEnd: hhmm(start + 2 + Math.floor(rand() * 3)),
      parcels: 1 + Math.floor(rand() * 24),
      weightKg: Math.round(60 + rand() * 900),
      priority: rand() > 0.8,
      driverId: i % 2 ? pick(rand, onShift).id : null,
    };
  });
}
const orders = seedOrders();

function dispatchBoard() {
  return {
    drivers: onShift.map((d) => {
      const vehicle = fleet.find((v) => v.plate === d.vehicle);
      return {
        id: d.id,
        name: d.name,
        base: d.base,
        vehicle: d.vehicle,
        capacityKg: vehicle ? PAYLOAD_KG[vehicle.kind] : PAYLOAD_KG.electric_van,
        hoursLeft: round1(Math.max(0, 9 - d.drivingToday)),
      };
    }),
    orders,
  };
}

/* Freight billing ------------------------------------------------------------------------ */

type InvoiceStatus = 'pending' | 'approved' | 'disputed';
type DbInvoice = {
  id: string;
  number: string;
  carrier: string;
  shipmentId: string;
  origin: string;
  destination: string;
  issuedAt: string;
  distanceKm: number;
  quoted: number;
  invoiced: number;
  status: InvoiceStatus;
  disputeReason: string | null;
};

function seedInvoices(): DbInvoice[] {
  const rand = rng(8080);
  return shipments
    .filter((s) => s.carrier !== 'Own fleet')
    .slice(0, 30)
    .map((s, i) => {
      const distanceKm = 250 + Math.floor(rand() * 1_400);
      const quoted = Math.round(distanceKm * (1.35 + rand() * 0.5));
      // Most invoices land within ±1.5% of the quote; some carry surcharges.
      const drift = rand() > 0.7 ? 0.03 + rand() * 0.17 : rand() * 0.03 - 0.015;
      const status: InvoiceStatus = i < 20 ? 'pending' : i === 20 ? 'disputed' : 'approved';
      return {
        id: `inv-${(i + 1).toString()}`,
        number: `INV-26-${(4_410 + i * 7).toString()}`,
        carrier: s.carrier,
        shipmentId: s.id,
        origin: s.origin,
        destination: s.destination,
        issuedAt: iso(now() - (1 + rand() * 25) * DAY),
        distanceKm,
        quoted,
        invoiced: Math.round(quoted * (1 + drift)),
        status,
        disputeReason: status === 'disputed' ? 'Detention charge was not agreed' : null,
      };
    });
}
const invoices = seedInvoices();

function costPerKm() {
  const rand = rng(6060);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now());
    d.setMonth(d.getMonth() - (5 - i), 1);
    return {
      month: d.toISOString().slice(0, 7),
      road: Math.round((1.58 + i * 0.02 + rand() * 0.08) * 100) / 100,
      rail: Math.round((1.12 + rand() * 0.08) * 100) / 100,
    };
  });
}

/* Handlers ------------------------------------------------------------------------ */

export const logisticsHandlers: HttpHandler[] = [
  ...logisticsCarrierHandlers,
  ...logisticsReportHandlers,
  http.get(
    `${API}/overview`,
    guarded(() => HttpResponse.json(overview())),
  ),

  http.get(
    `${API}/shipments`,
    guarded(() => HttpResponse.json(shipments.map(summary))),
  ),

  http.get<{ id: string }>(
    `${API}/shipments/:id`,
    guarded(({ params }) => {
      const s = shipments.find((x) => x.id === params.id);
      if (!s) return errorResponse('Shipment not found', 404);
      const delivered = s.status === 'delivered';
      return HttpResponse.json({
        ...summary(s),
        checkpoints: checkpointsFor(s),
        contents: s.contents,
        dimensions: `${s.pallets} × 120 × 80 × 160 cm`,
        declaredValue: s.declaredValue,
        temperature: s.contents.includes('°C') || s.contents.includes('Chilled') ? '2–8 °C' : null,
        trailer: s.trailer,
        proofOfDelivery: delivered
          ? {
              signedBy: 'R. Jansen (goods-in)',
              at: s.eta,
              photos: 3,
              note: 'Received in good condition. Seal intact.',
            }
          : null,
      });
    }),
  ),

  http.post<{ id: string }, { note: string }>(
    `${API}/shipments/:id/exception`,
    guarded(async ({ params, request }) => {
      const s = shipments.find((x) => x.id === params.id);
      if (!s) return errorResponse('Shipment not found', 404);
      const { note } = await request.json();
      s.status = 'exception';
      s.delayMinutes = Math.max(s.delayMinutes, 60);
      exceptions = [
        {
          id: `EXC-${(3_200 + exceptions.length).toString()}`,
          shipmentId: s.id,
          type: 'delay',
          severity: 'medium',
          title: 'Reported from shipment page',
          description: note || 'No details provided.',
          location: s.destination,
          openedAt: new Date().toISOString(),
          owner: null,
          escalated: false,
          suggestions: ['Contact the carrier for an update', 'Update the customer ETA'],
        },
        ...exceptions,
      ];
      return HttpResponse.json({ ok: true });
    }),
  ),

  http.get(
    `${API}/exceptions`,
    guarded(() => HttpResponse.json(exceptions)),
  ),

  http.patch<{ id: string }, { action: 'resolve' | 'assign' | 'escalate'; owner?: string }>(
    `${API}/exceptions/:id`,
    guarded(async ({ params, request }) => {
      const item = exceptions.find((e) => e.id === params.id);
      if (!item) return errorResponse('Exception not found', 404);
      const body = await request.json();
      if (body.action === 'resolve') {
        exceptions = exceptions.filter((e) => e.id !== item.id);
        const s = shipments.find((x) => x.id === item.shipmentId);
        if (s && s.status === 'exception') s.status = 'in_transit';
      } else if (body.action === 'assign') {
        item.owner = body.owner ?? 'Demo User';
      } else {
        item.escalated = true;
        item.severity =
          item.severity === 'low' ? 'medium' : item.severity === 'medium' ? 'high' : 'critical';
      }
      return HttpResponse.json({ ok: true });
    }),
  ),

  http.get(
    `${API}/fleet`,
    guarded(() => HttpResponse.json(fleet)),
  ),
  http.get(
    `${API}/drivers`,
    guarded(() => HttpResponse.json(drivers)),
  ),

  http.get<{ id: string }>(
    `${API}/fleet/:id`,
    guarded(({ params }) => {
      const v = fleet.find((x) => x.id === params.id);
      return v ? HttpResponse.json(vehicleDetail(v)) : errorResponse('Vehicle not found', 404);
    }),
  ),

  http.get<{ id: string }>(
    `${API}/drivers/:id`,
    guarded(({ params }) => {
      const d = drivers.find((x) => x.id === params.id);
      return d ? HttpResponse.json(driverDetail(d)) : errorResponse('Driver not found', 404);
    }),
  ),

  http.get(
    `${API}/dispatch`,
    guarded(() => HttpResponse.json(dispatchBoard())),
  ),

  http.patch<{ id: string }, { driverId: string | null }>(
    `${API}/dispatch/orders/:id`,
    guarded(async ({ params, request }) => {
      const order = orders.find((o) => o.id === params.id);
      if (!order) return errorResponse('Order not found', 404);
      const { driverId } = await request.json();
      if (driverId && !onShift.some((d) => d.id === driverId)) {
        return errorResponse('Driver is not on shift today', 422);
      }
      order.driverId = driverId;
      return HttpResponse.json(order);
    }),
  ),

  http.get(
    `${API}/billing`,
    guarded(() => HttpResponse.json({ invoices, costPerKm: costPerKm(), contractRate: 1.6 })),
  ),

  http.patch<{ id: string }, { action: 'approve' | 'dispute'; reason?: string }>(
    `${API}/billing/invoices/:id`,
    guarded(async ({ params, request }) => {
      const invoice = invoices.find((i) => i.id === params.id);
      if (!invoice) return errorResponse('Invoice not found', 404);
      const { action, reason } = await request.json();
      invoice.status = action === 'approve' ? 'approved' : 'disputed';
      invoice.disputeReason = action === 'dispute' ? reason || null : null;
      return HttpResponse.json(invoice);
    }),
  ),

  http.get(
    `${API}/routes`,
    guarded(() => HttpResponse.json(plannedRoutes)),
  ),

  http.put<{ id: string }, { stopIds: string[] }>(
    `${API}/routes/:id/stops`,
    guarded(async ({ params, request }) => {
      const route = plannedRoutes.find((r) => r.id === params.id);
      if (!route) return errorResponse('Route not found', 404);
      const { stopIds } = await request.json();
      const byId = new Map(route.stops.map((s) => [s.id, s]));
      if (stopIds.length !== route.stops.length || stopIds.some((id) => !byId.has(id))) {
        return errorResponse('Stop list does not match the route', 422);
      }
      route.stops = stopIds.map((id) => byId.get(id)!);
      return HttpResponse.json(route);
    }),
  ),

  http.get(
    `${API}/docks`,
    guarded(() =>
      HttpResponse.json({ docks: DOCKS, openHour: OPEN, closeHour: CLOSE, slots: dockSlots }),
    ),
  ),

  http.post<never, Omit<DbDockSlot, 'id' | 'status'>>(
    `${API}/docks/slots`,
    guarded(async ({ request }) => {
      const body = await request.json();
      if (body.end <= body.start) return errorResponse('The slot must end after it starts', 422);
      const clash = dockSlots.some(
        (s) => s.dock === body.dock && s.start < body.end && body.start < s.end,
      );
      if (clash) return errorResponse(`${body.dock} is already booked in that window`, 409);
      const slot: DbDockSlot = { ...body, id: `slot-new-${dockSlots.length}`, status: 'scheduled' };
      dockSlots = [...dockSlots, slot];
      return HttpResponse.json(slot);
    }),
  ),
];
