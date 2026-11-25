import { http, HttpResponse, type HttpHandler } from 'msw';

import { errorResponse } from '../utils';

import { API, DAY, guarded, iso, LANES, now, pick, rng, round1 } from './logistics-shared';

type Mode = 'road' | 'rail' | 'air' | 'sea';

const PARTNERS: Array<[name: string, country: string, mode: Mode]> = [
  ['Northline Freight', 'NL', 'road'],
  ['Rhenus Road', 'DE', 'road'],
  ['Alpine Express', 'AT', 'road'],
  ['BaltRail', 'PL', 'rail'],
  ['Iberia Cargo', 'ES', 'road'],
  ['Rhône Intermodal', 'FR', 'rail'],
  ['SkyBridge Air', 'DE', 'air'],
  ['Aerolink Cargo', 'BE', 'air'],
  ['Nordsee Lines', 'DK', 'sea'],
  ['Medway Shipping', 'IT', 'sea'],
  ['Danube Haulage', 'HU', 'road'],
];
const CONTACTS = ['Anouk de Vries', 'Lukas Brandt', 'Marta Nowak', 'Inés Romero', 'Paolo Ricci'];
// Typical on-time range (base + spread) and EUR/km rate at a cost index of 100.
const MODE_PROFILE: Record<Mode, { base: number; spread: number; rate: number }> = {
  road: { base: 86, spread: 11, rate: 1.6 },
  rail: { base: 82, spread: 12, rate: 1.1 },
  air: { base: 92, spread: 6, rate: 4.2 },
  sea: { base: 74, spread: 16, rate: 0.7 },
};

const clampScore = (n: number) => Math.round(Math.min(100, Math.max(0, n)));

function seedCarriers() {
  return PARTNERS.map(([name, country, mode], i) => {
    const rand = rng(7_100 + i * 31);
    const { base, spread, rate } = MODE_PROFILE[mode];
    const onTimePct = round1(base + rand() * spread);
    const damageRatePct = round1(0.1 + rand() * 1.5);
    const costIndex = Math.round(84 + rand() * 32);
    const carrier = {
      id: `car-${i + 1}`,
      name,
      country,
      mode,
      status: i % 5 === 4 ? 'suspended' : 'active',
      shipments: 40 + Math.floor(rand() * 420),
      onTimePct,
      damageRatePct,
      costIndex,
      scorecard: {
        onTime: clampScore((onTimePct - 70) * 3.4),
        damage: clampScore(100 - damageRatePct * 35),
        cost: clampScore(160 - costIndex),
        compliance: clampScore(60 + rand() * 40),
        service: clampScore(55 + rand() * 45),
      },
      onTimeTrend: Array.from({ length: 6 }, (_, m) =>
        m === 5 ? onTimePct : round1(Math.min(100, onTimePct - 3 + rand() * 6)),
      ),
    };
    const firstLane = Math.floor(rand() * LANES.length);
    const detail = {
      contact: pick(rand, CONTACTS),
      email: `ops@${name.toLowerCase().replace(/[^a-z]/g, '')}.eu`,
      contractStart: iso(now() - (180 + rand() * 900) * DAY),
      // Some contracts are expired or up for renewal so the badges show every state.
      contractEnd: iso(now() + (rand() * 440 - 20) * DAY),
      paymentTermsDays: pick(rand, [30, 45, 60]),
      lanes: Array.from({ length: 3 + Math.floor(rand() * 3) }, (_, l) => {
        const [origin, destination, distanceKm] = LANES[(firstLane + l * 2) % LANES.length]!;
        return {
          id: `${i + 1}-${l}`,
          origin,
          destination,
          distanceKm,
          ratePerKm: Math.round(rate * costIndex + rand() * 20) / 100,
          onTimePct: round1(Math.min(100, onTimePct - 4 + rand() * 8)),
          shipments: 8 + Math.floor(rand() * 90),
        };
      }),
    };
    return { carrier, detail };
  });
}
const carriers = seedCarriers();

export const logisticsCarrierHandlers: HttpHandler[] = [
  http.get(
    `${API}/carriers`,
    guarded(() => HttpResponse.json(carriers.map((c) => c.carrier))),
  ),

  http.get<{ id: string }>(
    `${API}/carriers/:id`,
    guarded(({ params }) => {
      const c = carriers.find((x) => x.carrier.id === params.id);
      return c
        ? HttpResponse.json({ ...c.carrier, ...c.detail })
        : errorResponse('Carrier not found', 404);
    }),
  ),

  http.patch<{ id: string }, { status: 'active' | 'suspended' }>(
    `${API}/carriers/:id`,
    guarded(async ({ params, request }) => {
      const c = carriers.find((x) => x.carrier.id === params.id);
      if (!c) return errorResponse('Carrier not found', 404);
      c.carrier.status = (await request.json()).status;
      return HttpResponse.json(c.carrier);
    }),
  ),
];
