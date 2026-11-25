import { http, HttpResponse, type HttpHandler } from 'msw';

import { env } from '@/core/config/env';

import { errorResponse, networkDelay, requireAuth } from '../utils';

import {
  DAY,
  ITEMS,
  SUPPLIERS,
  TODAY,
  WAREHOUSES,
  dailyUsage,
  iso,
  movements,
  seeded,
  totals,
  type Item,
  type StockLevel,
} from './inventory-data';

const base = `${env.API_URL}/inventory`;
const pad = (n: number) => String(n).padStart(2, '0');
const daysUntil = (ms: number) => Math.round((ms - TODAY) / DAY);
const supplierName = new Map(SUPPLIERS.map((s) => [s.id, s.name]));

/* Batches ------------------------------------------------------------------ */

type Batch = {
  id: string;
  item: Item;
  warehouse: string;
  bin: string;
  quantity: number;
  received: number;
  expires: number;
  status: 'released' | 'quarantined';
};

const LOT_TRACKED = new Set(['Sensors', 'Spare parts', 'Packaging']);

const batches: Batch[] = [];
ITEMS.filter((item) => LOT_TRACKED.has(item.category)).forEach((item, i) => {
  const rand = seeded(`lot:${i}`);
  for (const level of item.stock) {
    const lots = 1 + Math.floor(rand() * 2);
    for (let k = 0; k < lots; k++) {
      const received = TODAY - Math.floor(rand() * 240) * DAY;
      batches.push({
        id: `L${iso(received).slice(2).replace(/-/g, '')}-${String(batches.length).padStart(3, '0')}`,
        item,
        warehouse: level.warehouse,
        bin: level.bin,
        quantity: Math.max(1, Math.floor(level.onHand / lots)),
        received,
        expires: received + Math.round(120 + rand() * 420) * DAY,
        status: rand() < 0.06 ? 'quarantined' : 'released',
      });
    }
  }
});

const batchView = ({ item, received, expires, ...batch }: Batch) => ({
  ...batch,
  sku: item.sku,
  name: item.name,
  category: item.category,
  supplier: supplierName.get(item.supplierId) ?? item.supplierId,
  unitCost: item.unitCost,
  received: iso(received),
  expires: iso(expires),
  daysLeft: daysUntil(expires),
});

/* Bins --------------------------------------------------------------------- */

/** Bins are slotted to hold about three reorder points of the SKUs assigned to them. */
const slotSize = (item: Item) => item.reorderPoint * 3;

type Slot = { item: Item; level: StockLevel };

function slotsByBin(warehouse: string) {
  const bins = new Map<string, Slot[]>();
  for (const item of ITEMS) {
    for (const level of item.stock.filter((s) => s.warehouse === warehouse)) {
      bins.set(level.bin, [...(bins.get(level.bin) ?? []), { item, level }]);
    }
  }
  return bins;
}

const fillOf = (slots: Slot[]) => {
  const capacity = slots.reduce((s, { item }) => s + slotSize(item), 0);
  const stored = slots.reduce((s, { level }) => s + level.onHand, 0);
  return capacity ? Math.min(100, Math.round((stored / capacity) * 100)) : 0;
};

/* Valuation ---------------------------------------------------------------- */

/** FIFO values stock at the latest purchase prices, which drift a little from the running average. */
const fifoCost = new Map(
  ITEMS.map((item) => [item.sku, item.unitCost * (0.97 + seeded(`fifo:${item.sku}`)() * 0.11)]),
);

const daysSinceSale = (sku: string) => {
  const last = movements.find((m) => m.sku === sku && m.type === 'shipment');
  return last ? -daysUntil(Date.parse(last.at)) : null;
};

const DEAD_AFTER_DAYS = 45;
const SLOW_COVER_DAYS = 365;

function slowMover(item: Item, unitCost: (item: Item) => number) {
  const { onHand } = totals(item);
  const lastSale = daysSinceSale(item.sku);
  const coverDays = Math.round(onHand / dailyUsage(item.sku));
  const dead = item.status === 'discontinued' || lastSale === null || lastSale >= DEAD_AFTER_DAYS;
  if (!onHand || (!dead && coverDays < SLOW_COVER_DAYS)) return [];
  return [
    {
      sku: item.sku,
      name: item.name,
      category: item.category,
      onHand,
      value: Math.round(onHand * unitCost(item)),
      daysSinceSale: lastSale,
      coverDays,
      class: dead ? ('dead' as const) : ('slow' as const),
    },
  ];
}

/* Handlers ----------------------------------------------------------------- */

export const stockHandlers: HttpHandler[] = [
  http.get(`${base}/batches`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    return HttpResponse.json(batches.map(batchView));
  }),

  http.post<{ id: string }>(`${base}/batches/:id/quarantine`, async ({ request, params }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const batch = batches.find((b) => b.id === params.id);
    if (!batch) return errorResponse('Batch not found', 404);
    batch.status = 'quarantined';
    return HttpResponse.json(batchView(batch));
  }),

  http.get(`${base}/bins`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const code = new URL(request.url).searchParams.get('warehouse');
    const warehouse = WAREHOUSES.find((w) => w.code === code);
    if (!warehouse) return errorResponse('Warehouse not found', 404);
    const slots = slotsByBin(warehouse.code);
    return HttpResponse.json({
      warehouse: warehouse.code,
      zones: warehouse.zones.map((zone) => ({
        code: zone.code,
        name: zone.name,
        aisles: Array.from({ length: zone.aisles }, (_, a) => ({
          code: `${zone.code}-${pad(a + 1)}`,
          bins: Array.from({ length: zone.binsPerAisle }, (_, b) => {
            const bin = `${zone.code}-${pad(a + 1)}-${pad(b + 1)}`;
            const contents = slots.get(bin) ?? [];
            return { code: bin, fill: fillOf(contents), skus: contents.length };
          }),
        })),
      })),
    });
  }),

  http.get<{ warehouse: string; bin: string }>(
    `${base}/bins/:warehouse/:bin`,
    async ({ request, params }) => {
      await networkDelay();
      const auth = requireAuth(request);
      if ('error' in auth) return auth.error;
      const slots = slotsByBin(params.warehouse).get(params.bin) ?? [];
      return HttpResponse.json({
        warehouse: params.warehouse,
        code: params.bin,
        fill: fillOf(slots),
        contents: slots.map(({ item, level }) => ({
          sku: item.sku,
          name: item.name,
          onHand: level.onHand,
          reserved: level.reserved,
          unitCost: item.unitCost,
        })),
      });
    },
  ),

  http.post<never, { warehouse: string; from: string; to: string; sku: string; quantity: number }>(
    `${base}/bins/move`,
    async ({ request }) => {
      await networkDelay();
      const auth = requireAuth(request);
      if ('error' in auth) return auth.error;
      const { warehouse, from, to, sku, quantity } = await request.json();
      const item = ITEMS.find((i) => i.sku === sku);
      const source = item?.stock.find((s) => s.warehouse === warehouse && s.bin === from);
      if (!item || !source) return errorResponse('Stock not found in this bin', 404);
      if (from === to) return errorResponse('Pick a different bin', 422);
      if (quantity < 1 || quantity > source.onHand - source.reserved) {
        return errorResponse('Only unreserved stock can be moved', 422);
      }
      let target = item.stock.find((s) => s.warehouse === warehouse && s.bin === to);
      if (!target) {
        target = { warehouse, bin: to, onHand: 0, reserved: 0 };
        item.stock.push(target);
      }
      source.onHand -= quantity;
      target.onHand += quantity;
      if (!source.onHand) item.stock.splice(item.stock.indexOf(source), 1);
      return HttpResponse.json({ moved: quantity });
    },
  ),

  http.get(`${base}/valuation`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const method =
      new URL(request.url).searchParams.get('method') === 'average' ? 'average' : 'fifo';
    const unitCost = (item: Item) => (method === 'fifo' ? fifoCost.get(item.sku)! : item.unitCost);
    const valueAt = (item: Item, warehouse?: string) =>
      totals(item, warehouse).onHand * unitCost(item);

    const total = ITEMS.reduce((s, i) => s + valueAt(i), 0);
    const categories = [...new Set(ITEMS.map((i) => i.category))]
      .map((name) => ({
        name,
        value: Math.round(
          ITEMS.filter((i) => i.category === name).reduce((s, i) => s + valueAt(i), 0),
        ),
      }))
      .sort((a, b) => b.value - a.value);
    const rand = seeded('valuation');

    return HttpResponse.json({
      method,
      total: Math.round(total),
      units: ITEMS.reduce((s, i) => s + totals(i).onHand, 0),
      skuCount: ITEMS.filter((i) => totals(i).onHand > 0).length,
      trend: Array.from({ length: 12 }, (_, k) =>
        k === 11 ? Math.round(total) : Math.round(total * (0.84 + k * 0.013 + rand() * 0.03)),
      ),
      categories,
      warehouses: WAREHOUSES.map((w) => ({
        code: w.code,
        name: w.name,
        byCategory: Object.fromEntries(
          categories.map(({ name }) => [
            name,
            Math.round(
              ITEMS.filter((i) => i.category === name).reduce((s, i) => s + valueAt(i, w.code), 0),
            ),
          ]),
        ),
      })),
      slowMovers: ITEMS.flatMap((item) => slowMover(item, unitCost)).sort(
        (a, b) => b.value - a.value,
      ),
    });
  }),
];
