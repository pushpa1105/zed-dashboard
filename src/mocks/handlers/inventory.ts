import { http, HttpResponse, type HttpHandler } from 'msw';

import { env } from '@/core/config/env';

import { errorResponse, networkDelay, requireAuth } from '../utils';

import {
  ITEMS,
  SUPPLIERS,
  TODAY,
  WAREHOUSES,
  dailyUsage,
  iso,
  movements,
  purchaseOrders,
  receipts,
  seeded,
  stockStatus,
  totals,
  transfers,
  weeklyFlow,
  type Item,
  type PurchaseOrder,
  type Supplier,
  type Transfer,
} from './inventory-data';
import { stockHandlers } from './inventory-stock';

const base = `${env.API_URL}/inventory`;
const me = (user: { firstName: string; lastName: string }) => `${user.firstName} ${user.lastName}`;
const supplierName = (id: string) => SUPPLIERS.find((s) => s.id === id)?.name ?? id;

const itemRow = (item: Item, warehouse?: string) => {
  const t = totals(item, warehouse);
  const levels = warehouse ? item.stock.filter((s) => s.warehouse === warehouse) : item.stock;
  return {
    sku: item.sku,
    name: item.name,
    category: item.category,
    unitCost: item.unitCost,
    onHand: t.onHand,
    reserved: t.reserved,
    available: t.available,
    reorderPoint: item.reorderPoint,
    location: levels[0] ? `${levels[0].warehouse} · ${levels[0].bin}` : '—',
    warehouses: item.stock.map((s) => s.warehouse),
    status: stockStatus(item),
    lifecycle: item.status,
    supplier: supplierName(item.supplierId),
    lastMovement: item.lastMovement,
  };
};

const usedPallets = (code: string) =>
  ITEMS.reduce((sum, item) => {
    const level = item.stock.find((s) => s.warehouse === code);
    // Rough pallet footprint: cheap items pack densely.
    return (
      sum +
      (level
        ? Math.ceil(level.onHand / (item.unitCost < 10 ? 50 : item.unitCost < 60 ? 14 : 3))
        : 0)
    );
  }, 0);

function applyDelta(item: Item, warehouse: string, delta: number) {
  let level = item.stock.find((s) => s.warehouse === warehouse);
  if (!level) {
    level = { warehouse, bin: 'A-01-01', onHand: 0, reserved: 0 };
    item.stock.push(level);
  }
  level.onHand = Math.max(0, level.onHand + delta);
  level.reserved = Math.min(level.reserved, level.onHand);
  item.lastMovement = iso(Date.now());
}

function logMovement(
  sku: string,
  type: (typeof movements)[number]['type'],
  warehouse: string,
  quantity: number,
  reference: string,
  user: string,
) {
  movements.unshift({
    id: `MV-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    at: new Date().toISOString(),
    sku,
    type,
    warehouse,
    quantity,
    reference,
    user,
  });
}

type PurchaseOrderBody = Pick<PurchaseOrder, 'supplierId' | 'warehouse' | 'expected'> & {
  status: 'draft' | 'sent';
  lines: Array<{ sku: string; quantity: number; unitCost: number }>;
};

let poSequence = 5400;
const itemNames = new Map(ITEMS.map((i) => [i.sku, i.name]));
const isOpen = (po: PurchaseOrder) => po.status === 'sent' || po.status === 'partial';

const poView = (po: PurchaseOrder) => ({
  ...po,
  supplier: supplierName(po.supplierId),
  total: Math.round(po.lines.reduce((s, l) => s + l.quantity * l.unitCost, 0) * 100) / 100,
});

const supplierSummary = (s: Supplier) => ({
  ...s,
  skuCount: ITEMS.filter((i) => i.supplierId === s.id).length,
  openPOs: purchaseOrders.filter((po) => po.supplierId === s.id && isOpen(po)).length,
});

const onOrder = (sku: string) =>
  purchaseOrders
    .filter(isOpen)
    .flatMap((po) => po.lines)
    .filter((l) => l.sku === sku)
    .reduce((s, l) => s + l.quantity - l.received, 0);

/** A sent PO shows up on the Receiving page as an inbound order. */
function openReceipt(po: PurchaseOrder) {
  receipts.unshift({
    id: `RC-${3310 + receipts.length}`,
    po: po.id,
    supplierId: po.supplierId,
    warehouse: po.warehouse,
    expected: po.expected,
    status: 'open',
    lines: po.lines.map(({ sku, name, quantity }) => ({
      sku,
      name,
      expected: quantity,
      received: 0,
    })),
  });
}

export const inventoryHandlers: HttpHandler[] = [
  http.get(`${base}/overview`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const active = ITEMS.filter((i) => i.status === 'active');
    const value = active.reduce((s, i) => s + totals(i).onHand * i.unitCost, 0);
    const units = active.reduce((s, i) => s + totals(i).onHand, 0);
    const low = active.filter((i) => stockStatus(i) === 'low');
    const out = active.filter((i) => stockStatus(i) === 'out');
    const byCategory = new Map<string, number>();
    active.forEach((i) =>
      byCategory.set(i.category, (byCategory.get(i.category) ?? 0) + totals(i).onHand * i.unitCost),
    );
    const rand = seeded('overview');
    return HttpResponse.json({
      stockValue: Math.round(value),
      units,
      skuCount: active.length,
      lowCount: low.length,
      outCount: out.length,
      turns: 7.4,
      valueTrend: Array.from({ length: 12 }, (_, k) =>
        Math.round(value * (0.86 + k * 0.012 + rand() * 0.03)),
      ),
      flow: weeklyFlow,
      categories: [...byCategory.entries()]
        .map(([name, v]) => ({ name, value: Math.round(v) }))
        .sort((a, b) => b.value - a.value),
      warehouses: WAREHOUSES.map((w) => ({
        code: w.code,
        name: w.name,
        used: usedPallets(w.code),
        capacity: w.capacity,
      })),
      alerts: [...out, ...low].slice(0, 8).map((i) => ({ ...itemRow(i) })),
      suggestions: [...out, ...low].slice(0, 6).map((i) => {
        const supplier = SUPPLIERS.find((s) => s.id === i.supplierId)!;
        return {
          sku: i.sku,
          name: i.name,
          available: totals(i).available,
          reorderPoint: i.reorderPoint,
          quantity: i.reorderQty + Math.max(0, i.reorderPoint - totals(i).available),
          supplier: supplier.name,
          supplierId: supplier.id,
          leadTimeDays: supplier.leadTimeDays,
          cost: Math.round(
            (i.reorderQty + Math.max(0, i.reorderPoint - totals(i).available)) * i.unitCost,
          ),
        };
      }),
    });
  }),

  http.get(`${base}/items`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const warehouse = new URL(request.url).searchParams.get('warehouse') || undefined;
    const rows = (
      warehouse ? ITEMS.filter((i) => i.stock.some((s) => s.warehouse === warehouse)) : ITEMS
    ).map((i) => itemRow(i, warehouse));
    return HttpResponse.json(rows);
  }),

  http.get(`${base}/items/:sku`, async ({ request, params }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const item = ITEMS.find((i) => i.sku === params.sku);
    if (!item) return errorResponse('Item not found', 404);
    const suppliers = [item.supplierId, item.altSupplierId].map((id, idx) => {
      const s = SUPPLIERS.find((x) => x.id === id)!;
      return {
        id: s.id,
        name: s.name,
        leadTimeDays: s.leadTimeDays,
        onTimeRate: s.onTimeRate,
        unitCost: Math.round(item.unitCost * (idx === 0 ? 1 : 1.07) * 100) / 100,
        preferred: idx === 0,
      };
    });
    return HttpResponse.json({
      ...itemRow(item),
      reorderQty: item.reorderQty,
      autoReorder: item.autoReorder,
      supplierId: item.supplierId,
      levels: item.stock.map((s) => ({
        ...s,
        warehouseName: WAREHOUSES.find((w) => w.code === s.warehouse)!.name,
      })),
      movements: movements.filter((m) => m.sku === item.sku).slice(0, 25),
      suppliers,
    });
  }),

  http.patch<
    { sku: string },
    { reorderPoint: number; reorderQty: number; supplierId: string; autoReorder: boolean }
  >(`${base}/items/:sku`, async ({ request, params }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const item = ITEMS.find((i) => i.sku === params.sku);
    if (!item) return errorResponse('Item not found', 404);
    const body = await request.json();
    Object.assign(item, body);
    return HttpResponse.json({ ok: true });
  }),

  http.post<never, { skus: string[]; warehouse: string; delta: number; reason: string }>(
    `${base}/adjustments`,
    async ({ request }) => {
      await networkDelay();
      const auth = requireAuth(request);
      if ('error' in auth) return auth.error;
      const { skus, warehouse, delta, reason } = await request.json();
      if (!delta) return errorResponse('Quantity cannot be zero', 422);
      skus.forEach((sku) => {
        const item = ITEMS.find((i) => i.sku === sku);
        if (!item) return;
        applyDelta(item, warehouse, delta);
        logMovement(sku, 'adjustment', warehouse, delta, reason, me(auth.user));
      });
      return HttpResponse.json({ updated: skus.length });
    },
  ),

  http.get(`${base}/warehouses`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    return HttpResponse.json(
      WAREHOUSES.map((w) => {
        const items = ITEMS.filter((i) => i.stock.some((s) => s.warehouse === w.code));
        const rand = seeded(`wh:${w.code}`);
        return {
          code: w.code,
          name: w.name,
          city: w.city,
          manager: w.manager,
          capacity: w.capacity,
          used: usedPallets(w.code),
          skuCount: items.length,
          value: Math.round(items.reduce((s, i) => s + totals(i, w.code).onHand * i.unitCost, 0)),
          zones: w.zones.map((z) => ({
            code: z.code,
            name: z.name,
            aisles: Array.from({ length: z.aisles }, (_, a) => ({
              code: `${z.code}-${String(a + 1).padStart(2, '0')}`,
              bins: Array.from({ length: z.binsPerAisle }, (_, b) => ({
                code: `${z.code}-${String(a + 1).padStart(2, '0')}-${String(b + 1).padStart(2, '0')}`,
                occupancy: Math.min(
                  100,
                  Math.round(rand() * (z.code === 'C' || z.code === 'X' ? 70 : 115)),
                ),
              })),
            })),
          })),
        };
      }),
    );
  }),

  http.get(`${base}/transfers`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    return HttpResponse.json(transfers);
  }),

  http.post<
    never,
    { from: string; to: string; carrier: string; lines: Array<{ sku: string; quantity: number }> }
  >(`${base}/transfers`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const body = await request.json();
    if (body.from === body.to) return errorResponse('Pick two different warehouses', 422);
    const transfer: Transfer = {
      id: `TR-${781 + transfers.length - 16}`,
      from: body.from,
      to: body.to,
      status: 'requested',
      carrier: body.carrier,
      requestedBy: me(auth.user),
      created: iso(Date.now()),
      eta: iso(Date.now() + (body.from === 'RTM' || body.to === 'RTM' ? 14 : 4) * 86_400_000),
      lines: body.lines.map((l) => ({
        sku: l.sku,
        name: ITEMS.find((i) => i.sku === l.sku)?.name ?? l.sku,
        quantity: l.quantity,
      })),
    };
    transfers.unshift(transfer);
    return HttpResponse.json(transfer, { status: 201 });
  }),

  http.patch<{ id: string }, { status: Transfer['status'] }>(
    `${base}/transfers/:id`,
    async ({ request, params }) => {
      await networkDelay();
      const auth = requireAuth(request);
      if ('error' in auth) return auth.error;
      const transfer = transfers.find((tr) => tr.id === params.id);
      if (!transfer) return errorResponse('Transfer not found', 404);
      const { status } = await request.json();
      if (status === 'in-transit' && transfer.status !== 'in-transit') {
        transfer.lines.forEach((l) => {
          const item = ITEMS.find((i) => i.sku === l.sku);
          if (item) applyDelta(item, transfer.from, -l.quantity);
          logMovement(
            l.sku,
            'transfer-out',
            transfer.from,
            -l.quantity,
            transfer.id,
            me(auth.user),
          );
        });
      }
      if (status === 'received' && transfer.status !== 'received') {
        transfer.lines.forEach((l) => {
          const item = ITEMS.find((i) => i.sku === l.sku);
          if (item) applyDelta(item, transfer.to, l.quantity);
          logMovement(l.sku, 'transfer-in', transfer.to, l.quantity, transfer.id, me(auth.user));
        });
      }
      transfer.status = status;
      return HttpResponse.json(transfer);
    },
  ),

  http.get(`${base}/receipts`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    return HttpResponse.json(receipts.map((r) => ({ ...r, supplier: supplierName(r.supplierId) })));
  }),

  http.post<{ id: string }, { lines: Array<{ sku: string; received: number }> }>(
    `${base}/receipts/:id/receive`,
    async ({ request, params }) => {
      await networkDelay();
      const auth = requireAuth(request);
      if ('error' in auth) return auth.error;
      const receipt = receipts.find((r) => r.id === params.id);
      if (!receipt) return errorResponse('Receipt not found', 404);
      const { lines } = await request.json();
      const po = purchaseOrders.find((p) => p.id === receipt.po);
      lines.forEach(({ sku, received }) => {
        const line = receipt.lines.find((l) => l.sku === sku);
        if (!line) return;
        const delta = received - line.received;
        if (delta <= 0) return;
        line.received = received;
        const poLine = po?.lines.find((l) => l.sku === sku);
        if (poLine) poLine.received = received;
        const item = ITEMS.find((i) => i.sku === sku);
        if (item) applyDelta(item, receipt.warehouse, delta);
        logMovement(sku, 'receipt', receipt.warehouse, delta, receipt.po, me(auth.user));
      });
      receipt.status = receipt.lines.every((l) => l.received >= l.expected)
        ? 'complete'
        : receipt.lines.some((l) => l.received > 0)
          ? 'partial'
          : 'open';
      if (po && receipt.status !== 'open') {
        po.status = receipt.status === 'complete' ? 'received' : 'partial';
        po.deliveredOn = receipt.status === 'complete' ? iso(Date.now()) : null;
      }
      return HttpResponse.json({ ...receipt, supplier: supplierName(receipt.supplierId) });
    },
  ),

  http.get(`${base}/counts`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const url = new URL(request.url);
    const warehouse = url.searchParams.get('warehouse') ?? 'RNO';
    const zone = url.searchParams.get('zone') ?? 'A';
    const lines = ITEMS.flatMap((item) =>
      item.stock
        .filter((s) => s.warehouse === warehouse && s.bin.startsWith(`${zone}-`))
        .map((s) => ({
          bin: s.bin,
          sku: item.sku,
          name: item.name,
          system: s.onHand,
          unitCost: item.unitCost,
        })),
    ).sort((a, b) => a.bin.localeCompare(b.bin));
    return HttpResponse.json({ warehouse, zone, scheduled: iso(TODAY), lines: lines.slice(0, 40) });
  }),

  http.post<
    never,
    { warehouse: string; lines: Array<{ sku: string; bin: string; counted: number }> }
  >(`${base}/counts`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const { warehouse, lines } = await request.json();
    let adjusted = 0;
    lines.forEach(({ sku, bin, counted }) => {
      const item = ITEMS.find((i) => i.sku === sku);
      const level = item?.stock.find((s) => s.warehouse === warehouse && s.bin === bin);
      if (!item || !level || level.onHand === counted) return;
      const delta = counted - level.onHand;
      applyDelta(item, warehouse, delta);
      logMovement(sku, 'count', warehouse, delta, `Cycle count ${bin}`, me(auth.user));
      adjusted++;
    });
    return HttpResponse.json({ adjusted });
  }),

  http.get(`${base}/suppliers`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    return HttpResponse.json(SUPPLIERS.map(supplierSummary));
  }),

  http.get(`${base}/suppliers/:id`, async ({ request, params }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const supplier = SUPPLIERS.find((s) => s.id === params.id);
    if (!supplier) return errorResponse('Supplier not found', 404);
    return HttpResponse.json({
      ...supplierSummary(supplier),
      items: ITEMS.filter(
        (i) => i.supplierId === supplier.id || i.altSupplierId === supplier.id,
      ).map((i) => ({
        sku: i.sku,
        name: i.name,
        category: i.category,
        unitCost: i.unitCost,
        available: totals(i).available,
        reorderPoint: i.reorderPoint,
        status: stockStatus(i),
        preferred: i.supplierId === supplier.id,
      })),
      purchaseOrders: purchaseOrders
        .filter((po) => po.supplierId === supplier.id)
        .slice(0, 8)
        .map(poView),
    });
  }),

  http.get(`${base}/purchase-orders`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    return HttpResponse.json(purchaseOrders.map(poView));
  }),

  http.post<never, PurchaseOrderBody>(`${base}/purchase-orders`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const body = await request.json();
    if (!body.lines.length) return errorResponse('Add at least one line', 422);
    const po: PurchaseOrder = {
      id: `PO-${poSequence++}`,
      supplierId: body.supplierId,
      warehouse: body.warehouse,
      status: body.status,
      created: iso(Date.now()),
      expected: body.expected,
      deliveredOn: null,
      createdBy: me(auth.user),
      lines: body.lines.map((l) => ({ ...l, name: itemNames.get(l.sku) ?? l.sku, received: 0 })),
    };
    purchaseOrders.unshift(po);
    if (po.status === 'sent') openReceipt(po);
    return HttpResponse.json(poView(po), { status: 201 });
  }),

  http.post<{ id: string }>(`${base}/purchase-orders/:id/send`, async ({ request, params }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const po = purchaseOrders.find((p) => p.id === params.id);
    if (!po) return errorResponse('Purchase order not found', 404);
    if (po.status !== 'draft') return errorResponse('Only drafts can be sent', 409);
    po.status = 'sent';
    openReceipt(po);
    return HttpResponse.json(poView(po));
  }),

  http.get(`${base}/movements`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const params = new URL(request.url).searchParams;
    const [type, warehouse, from, to] = ['type', 'warehouse', 'from', 'to'].map((k) =>
      params.get(k),
    );
    const rows = movements.filter((m) => {
      const day = m.at.slice(0, 10);
      return (
        (!type || m.type === type) &&
        (!warehouse || m.warehouse === warehouse) &&
        (!from || day >= from) &&
        (!to || day <= to)
      );
    });
    return HttpResponse.json(rows.map((m) => ({ ...m, name: itemNames.get(m.sku) ?? m.sku })));
  }),

  http.get(`${base}/reorder-plan`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    return HttpResponse.json(
      ITEMS.filter((i) => i.status === 'active' && stockStatus(i) !== 'ok').map((item) => {
        const supplier = SUPPLIERS.find((s) => s.id === item.supplierId)!;
        return {
          sku: item.sku,
          name: item.name,
          category: item.category,
          available: totals(item).available,
          onOrder: onOrder(item.sku),
          reorderPoint: item.reorderPoint,
          reorderQty: item.reorderQty,
          dailyUsage: dailyUsage(item.sku),
          leadTimeDays: supplier.leadTimeDays,
          unitCost: item.unitCost,
          supplierId: supplier.id,
          supplier: supplier.name,
        };
      }),
    );
  }),
  ...stockHandlers,
];
