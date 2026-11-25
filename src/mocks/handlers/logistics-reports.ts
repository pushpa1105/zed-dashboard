import { http, HttpResponse, type HttpHandler } from 'msw';

import { errorResponse } from '../utils';

import {
  API,
  CUSTOMERS,
  DAY,
  guarded,
  iso,
  LANES,
  now,
  pick,
  rng,
  round1,
} from './logistics-shared';

/* Customer SLAs ------------------------------------------------------------------- */

type Tier = 'platinum' | 'gold' | 'standard';
const TARGETS: Record<Tier, { onTime: number; transit: number }> = {
  platinum: { onTime: 98, transit: 36 },
  gold: { onTime: 96, transit: 48 },
  standard: { onTime: 93, transit: 72 },
};
const ROOT_CAUSES = ['carrier_delay', 'weather', 'customs', 'capacity', 'handling', 'address'];

const slaCustomers = CUSTOMERS.map((name, i) => {
  const rand = rng(5_300 + i * 17);
  const tier: Tier = i < 2 ? 'platinum' : i < 5 ? 'gold' : 'standard';
  const { onTime, transit } = TARGETS[tier];
  const onTimePct = round1(Math.min(99.8, onTime - 3 + rand() * 5.5));
  return {
    id: `cus-${i + 1}`,
    name,
    tier,
    shipments: 40 + Math.floor(rand() * 260),
    targetOnTimePct: onTime,
    onTimePct,
    targetTransitHours: transit,
    transitHours: round1(transit * (0.72 + rand() * 0.38)),
    trend: Array.from({ length: 12 }, (_, w) => ({
      week: iso(now() - (11 - w) * 7 * DAY),
      onTimePct: w === 11 ? onTimePct : round1(Math.min(100, onTimePct - 2.5 + rand() * 5)),
    })),
  };
});

const breachRand = rng(9_090);
const breaches = Array.from({ length: 32 }, (_, i) => {
  const customer = pick(breachRand, slaCustomers);
  const freightCharge = Math.round(320 + breachRand() * 2_400);
  return {
    id: `brc-${i + 1}`,
    customerId: customer.id,
    customer: customer.name,
    // Same id scheme as the 186 seeded shipments, so the link opens a real shipment.
    shipmentId: `SHP-${(24_810 + Math.floor(breachRand() * 186) * 7).toString()}`,
    metric: breachRand() > 0.35 ? 'on_time' : 'transit',
    occurredAt: iso(now() - breachRand() * 30 * DAY),
    delayHours: round1(1 + breachRand() * 30),
    rootCause: pick(breachRand, ROOT_CAUSES),
    freightCharge,
    credit: i % 4 === 3 ? Math.round(freightCharge * 0.15) : null,
  };
}).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

const slas = () => ({
  customers: slaCustomers.map((c) => ({
    ...c,
    breaches: breaches.filter((b) => b.customerId === c.id).length,
  })),
  breaches,
});

/* Performance reports ------------------------------------------------------------- */

type Period = '30d' | '90d' | '12m';
// Points per period, spacing between them and the shipments one point represents.
const PERIODS: Record<Period, { points: number; step: number; volume: number }> = {
  '30d': { points: 30, step: DAY, volume: 55 },
  '90d': { points: 13, step: 7 * DAY, volume: 380 },
  '12m': { points: 12, step: 30 * DAY, volume: 1_650 },
};

type Kpis = {
  shipments: number;
  onTimePct: number;
  costPerShipment: number;
  utilisationPct: number;
};

function totals(points: Kpis[]): Kpis {
  const shipments = points.reduce((n, p) => n + p.shipments, 0);
  const weighted = (key: keyof Kpis) =>
    round1(points.reduce((n, p) => n + p[key] * p.shipments, 0) / shipments);
  return {
    shipments,
    onTimePct: weighted('onTimePct'),
    costPerShipment: weighted('costPerShipment'),
    utilisationPct: weighted('utilisationPct'),
  };
}

function series(period: Period, seed: number) {
  const { points, step, volume } = PERIODS[period];
  const rand = rng(seed);
  return Array.from({ length: points }, (_, i) => ({
    date: iso(now() - (points - 1 - i) * step),
    shipments: Math.round(volume * (0.85 + rand() * 0.3)),
    // Slow improvement over the period, with noise.
    onTimePct: round1(Math.min(99.5, 90.5 + (i / points) * 3 + rand() * 3)),
    costPerShipment: round1(395 - (i / points) * 12 + rand() * 30),
    utilisationPct: round1(71 + (i / points) * 6 + rand() * 9),
  }));
}

function performance(period: Period) {
  const seed = Object.keys(PERIODS).indexOf(period) * 1_000 + 4_000;
  const points = series(period, seed);
  const rand = rng(seed + 1);
  const scale = PERIODS[period].points * PERIODS[period].volume;
  return {
    current: totals(points),
    previous: totals(series(period, seed + 2)),
    series: points,
    lanes: LANES.map(([origin, destination, distanceKm], i) => ({
      id: `lane-${i + 1}`,
      origin,
      destination,
      mode: rand() > 0.75 ? 'rail' : 'road',
      distanceKm,
      shipments: Math.round((scale / LANES.length) * (0.4 + rand() * 1.2)),
      onTimePct: round1(Math.min(99.5, 86 + rand() * 13)),
      transitHours: round1(distanceKm / 62 + 4 + rand() * 10),
      costPerShipment: Math.round(distanceKm * (0.55 + rand() * 0.2) + 80),
      utilisationPct: round1(62 + rand() * 33),
    })),
  };
}

export const logisticsReportHandlers: HttpHandler[] = [
  http.get(
    `${API}/slas`,
    guarded(() => HttpResponse.json(slas())),
  ),

  http.post<{ id: string }, { amount: number }>(
    `${API}/slas/breaches/:id/credit`,
    guarded(async ({ params, request }) => {
      const breach = breaches.find((b) => b.id === params.id);
      if (!breach) return errorResponse('Breach not found', 404);
      if (breach.credit !== null) return errorResponse('A credit note was already issued', 409);
      const { amount } = await request.json();
      if (!(amount > 0 && amount <= breach.freightCharge)) {
        return errorResponse('The credit must be between 0 and the freight charge', 422);
      }
      breach.credit = amount;
      return HttpResponse.json(breach);
    }),
  ),

  http.get<never>(
    `${API}/performance`,
    guarded(({ request }) => {
      const period = new URL(request.url).searchParams.get('period') ?? '30d';
      return period in PERIODS
        ? HttpResponse.json(performance(period as Period))
        : errorResponse('Unknown period', 400);
    }),
  ),
];
