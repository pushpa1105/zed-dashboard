/**
 * Seeded in-memory data for the inventory workspace mock API. Mutations
 * (adjustments, transfers, receipts, counts) change these arrays, so the UI
 * reflects them until the page reloads.
 */

export function seeded(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DAY = 86_400_000;
export const TODAY = Date.UTC(2026, 10, 25);
export const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/* Warehouses --------------------------------------------------------------- */

export type Zone = { code: string; name: string; aisles: number; binsPerAisle: number };
export type Warehouse = {
  code: string;
  name: string;
  city: string;
  manager: string;
  capacity: number; // pallet positions
  zones: Zone[];
};

export const WAREHOUSES: Warehouse[] = [
  {
    code: 'RNO',
    name: 'Reno distribution center',
    city: 'Reno, NV',
    manager: 'Lucas Meyer',
    capacity: 4_800,
    zones: [
      { code: 'A', name: 'Fast pick', aisles: 6, binsPerAisle: 12 },
      { code: 'B', name: 'Bulk storage', aisles: 8, binsPerAisle: 10 },
      { code: 'C', name: 'Returns & QA', aisles: 2, binsPerAisle: 8 },
    ],
  },
  {
    code: 'DFW',
    name: 'Dallas fulfillment',
    city: 'Dallas, TX',
    manager: 'Maria Gomez',
    capacity: 3_200,
    zones: [
      { code: 'A', name: 'Fast pick', aisles: 5, binsPerAisle: 12 },
      { code: 'B', name: 'Bulk storage', aisles: 6, binsPerAisle: 10 },
    ],
  },
  {
    code: 'EWR',
    name: 'Newark cross-dock',
    city: 'Newark, NJ',
    manager: 'Oliver Grant',
    capacity: 1_600,
    zones: [
      { code: 'X', name: 'Cross-dock lanes', aisles: 4, binsPerAisle: 6 },
      { code: 'A', name: 'Overflow pick', aisles: 3, binsPerAisle: 10 },
    ],
  },
  {
    code: 'RTM',
    name: 'Rotterdam EU hub',
    city: 'Rotterdam, NL',
    manager: 'Jonas Becker',
    capacity: 2_400,
    zones: [
      { code: 'A', name: 'Fast pick', aisles: 4, binsPerAisle: 12 },
      { code: 'B', name: 'Bulk storage', aisles: 5, binsPerAisle: 10 },
    ],
  },
];

/* Suppliers ---------------------------------------------------------------- */

export type Supplier = {
  id: string;
  name: string;
  country: string;
  contact: string;
  leadTimeDays: number;
  onTimeRate: number;
  fillRate: number;
  openPOs: number;
  spendYtd: number;
  leadTimeTrend: number[]; // last 6 months, avg days
  onTimeTrend: number[]; // last 6 months, % delivered by the expected date
  email: string;
  phone: string;
  terms: string;
};

const SUPPLIER_ROWS: Array<[string, string, string, number]> = [
  ['Northwind Components', 'US', 'Daniel Okafor', 12],
  ['Shenzhen Brightway Electronics', 'CN', 'Lin Wei', 34],
  ['Packwell Packaging', 'US', 'Oliver Grant', 6],
  ['Kraftwerk Tooling GmbH', 'DE', 'Jonas Becker', 21],
  ['Pacific Pallet Co.', 'US', 'Tom Reyes', 4],
  ['Taipei Precision Cable', 'TW', 'Chen Hao', 28],
  ['Monterrey Plastics', 'MX', 'Ana Ruiz', 15],
  ['Baltic Metalworks', 'PL', 'Piotr Nowak', 19],
];

export const SUPPLIERS: Supplier[] = SUPPLIER_ROWS.map(([name, country, contact, lead], i) => {
  const rand = seeded(`sup:${i}`);
  const onTimeRate = Math.round(78 + rand() * 21);
  return {
    id: `SUP-${101 + i}`,
    name,
    country,
    contact,
    leadTimeDays: lead,
    onTimeRate,
    fillRate: Math.round(88 + rand() * 11),
    openPOs: Math.floor(rand() * 6),
    spendYtd: Math.round(40_000 + rand() * 520_000),
    leadTimeTrend: Array.from({ length: 6 }, () =>
      Math.max(2, Math.round(lead + (rand() - 0.5) * lead * 0.5)),
    ),
    onTimeTrend: Array.from({ length: 6 }, () =>
      Math.min(100, Math.round(onTimeRate + (rand() - 0.5) * 14)),
    ),
    email: `${contact.split(' ')[0]!.toLowerCase()}@${name.split(' ')[0]!.toLowerCase()}.example`,
    phone: `+1 555 ${String(1000 + Math.floor(rand() * 9000))}`,
    terms: ['Net 30', 'Net 45', 'Net 60'][i % 3]!,
  };
});

/* Items -------------------------------------------------------------------- */

export type StockLevel = { warehouse: string; bin: string; onHand: number; reserved: number };
export type Item = {
  sku: string;
  name: string;
  category: string;
  unitCost: number;
  reorderPoint: number;
  reorderQty: number;
  supplierId: string;
  altSupplierId: string;
  autoReorder: boolean;
  status: 'active' | 'discontinued';
  stock: StockLevel[];
  lastMovement: string;
};

const CATALOG: Array<[string, string, string[], [number, number]]> = [
  [
    'SNS',
    'Sensors',
    [
      'Temperature sensor',
      'Humidity sensor',
      'Door contact sensor',
      'Vibration sensor',
      'Leak detector',
      'CO₂ monitor',
      'Light sensor',
      'Motion sensor',
    ],
    [14, 68],
  ],
  [
    'GTW',
    'Gateways',
    ['LTE gateway', 'Wi-Fi bridge', 'LoRa gateway', 'Edge hub', 'PoE gateway'],
    [89, 340],
  ],
  [
    'CBL',
    'Cables & accessories',
    [
      'USB-C cable 1 m',
      'USB-C cable 2 m',
      'PoE injector',
      'DIN rail mount',
      'Wall bracket',
      'Magnetic mount',
      'Power adapter EU',
      'Power adapter US',
    ],
    [3, 22],
  ],
  [
    'PKG',
    'Packaging',
    [
      'Shipping carton S',
      'Shipping carton M',
      'Shipping carton L',
      'Foam insert',
      'Anti-static bag',
      'Pallet wrap roll',
    ],
    [0.4, 9],
  ],
  [
    'SPR',
    'Spare parts',
    [
      'Battery pack 2400 mAh',
      'Replacement antenna',
      'Enclosure lid',
      'Gasket set',
      'Display module',
      'Main board rev C',
    ],
    [6, 74],
  ],
  [
    'TLS',
    'Tools',
    ['Handheld scanner', 'Label printer', 'Torque driver', 'Calibration kit'],
    [48, 620],
  ],
];
const VARIANTS = ['', ' v2', ' v3', ' Pro', ' Lite', ' — black', ' — white', ' (10-pack)'];

const SUPPLIER_BY_PREFIX: Record<string, number[]> = {
  SNS: [0, 1, 5],
  GTW: [0, 1],
  CBL: [5, 6],
  PKG: [2, 4],
  SPR: [1, 6, 7],
  TLS: [3, 7],
};

export const ITEMS: Item[] = [];
let n = 0;
for (const [prefix, category, names, [minCost, maxCost]] of CATALOG) {
  for (const base of names) {
    const variants = prefix === 'TLS' ? 2 : prefix === 'GTW' ? 4 : 5;
    for (let v = 0; v < variants; v++) {
      const rand = seeded(`item:${n}`);
      const sku = `OR-${prefix}-${1000 + n * 7}`;
      const unitCost = Math.round((minCost + rand() * (maxCost - minCost)) * 100) / 100;
      const velocity = unitCost < 10 ? 900 : unitCost < 60 ? 260 : 60;
      const reorderPoint = Math.round(velocity * (0.3 + rand() * 0.5));
      const supplierPool = SUPPLIER_BY_PREFIX[prefix]!;
      const supplier = supplierPool[Math.floor(rand() * supplierPool.length)]!;
      const stock: StockLevel[] = WAREHOUSES.filter((_, wi) => wi === 0 || rand() < 0.6).map(
        (wh) => {
          const zone = wh.zones[Math.floor(rand() * wh.zones.length)]!;
          // A slice of SKUs is deliberately short so the low-stock views have content.
          const scarce = n % 9 === 0 || n % 13 === 0;
          const onHand = scarce
            ? Math.floor(rand() * reorderPoint * 0.4)
            : Math.round(reorderPoint * (0.6 + rand() * 2.4));
          return {
            warehouse: wh.code,
            // Spread SKUs across bins deterministically so a bin rarely holds two SKUs.
            bin: `${zone.code}-${String(1 + (n % zone.aisles)).padStart(2, '0')}-${String(1 + (Math.floor(n / zone.aisles) % zone.binsPerAisle)).padStart(2, '0')}`,
            onHand,
            reserved: Math.min(onHand, Math.floor(onHand * rand() * 0.3)),
          };
        },
      );
      ITEMS.push({
        sku,
        name: `${base}${VARIANTS[v] ?? ''}`,
        category,
        unitCost,
        reorderPoint,
        reorderQty: Math.round((reorderPoint * 1.5) / 10) * 10 || 10,
        supplierId: SUPPLIERS[supplier]!.id,
        altSupplierId:
          SUPPLIERS[supplierPool[(supplierPool.indexOf(supplier) + 1) % supplierPool.length]!]!.id,
        autoReorder: rand() < 0.4,
        status: n % 37 === 5 ? 'discontinued' : 'active',
        stock,
        lastMovement: iso(TODAY - Math.floor(rand() * 20) * DAY),
      });
      n++;
    }
  }
}

export const totals = (item: Item, warehouse?: string) => {
  const levels = warehouse ? item.stock.filter((s) => s.warehouse === warehouse) : item.stock;
  const onHand = levels.reduce((s, l) => s + l.onHand, 0);
  const reserved = levels.reduce((s, l) => s + l.reserved, 0);
  return { onHand, reserved, available: onHand - reserved };
};

export const stockStatus = (item: Item) => {
  const { available } = totals(item);
  if (available <= 0) return 'out';
  if (available <= item.reorderPoint) return 'low';
  return 'ok';
};

/* Movements ---------------------------------------------------------------- */

export type Movement = {
  id: string;
  at: string;
  sku: string;
  type: 'receipt' | 'shipment' | 'transfer-in' | 'transfer-out' | 'adjustment' | 'count';
  warehouse: string;
  quantity: number;
  reference: string;
  user: string;
};

const PEOPLE = [
  'Lucas Meyer',
  'Maria Gomez',
  'Oliver Grant',
  'Jonas Becker',
  'Priya Raman',
  'Sam Ortiz',
];
export const movements: Movement[] = [];
ITEMS.forEach((item, i) => {
  const rand = seeded(`mv:${i}`);
  for (let k = 0; k < 14; k++) {
    const roll = rand();
    const type: Movement['type'] =
      roll < 0.45
        ? 'shipment'
        : roll < 0.7
          ? 'receipt'
          : roll < 0.8
            ? 'transfer-out'
            : roll < 0.9
              ? 'transfer-in'
              : 'adjustment';
    const qty = Math.max(1, Math.round(item.reorderPoint * (0.05 + rand() * 0.4)));
    movements.push({
      id: `MV-${i}-${k}`,
      at: new Date(TODAY - Math.floor(rand() * 84) * DAY - Math.floor(rand() * DAY)).toISOString(),
      sku: item.sku,
      type,
      warehouse: item.stock[Math.floor(rand() * item.stock.length)]!.warehouse,
      quantity:
        type === 'shipment' || type === 'transfer-out'
          ? -qty
          : type === 'adjustment'
            ? (rand() < 0.5 ? -1 : 1) * Math.ceil(qty / 6)
            : qty,
      reference:
        type === 'shipment'
          ? `SO-${48_000 + Math.floor(rand() * 2000)}`
          : type === 'receipt'
            ? `PO-${5_200 + Math.floor(rand() * 140)}`
            : type === 'adjustment'
              ? 'Damaged in handling'
              : `TR-${700 + Math.floor(rand() * 60)}`,
      user: PEOPLE[Math.floor(rand() * PEOPLE.length)]!,
    });
  }
});
movements.sort((a, b) => b.at.localeCompare(a.at));

const USAGE_WINDOW_DAYS = 84;
/** Average units shipped per day over the seeded movement history. */
export function dailyUsage(sku: string) {
  const since = new Date(TODAY - USAGE_WINDOW_DAYS * DAY).toISOString();
  const shipped = movements
    .filter((m) => m.sku === sku && m.type === 'shipment' && m.at >= since)
    .reduce((s, m) => s - m.quantity, 0);
  return Math.max(0.1, Math.round((shipped / USAGE_WINDOW_DAYS) * 10) / 10);
}

/* Transfers ---------------------------------------------------------------- */

export type TransferLine = { sku: string; name: string; quantity: number };
export type Transfer = {
  id: string;
  from: string;
  to: string;
  status: 'requested' | 'picking' | 'in-transit' | 'received';
  carrier: string;
  requestedBy: string;
  created: string;
  eta: string;
  lines: TransferLine[];
};

const CARRIERS = ['Sierra Freight', 'UPS Freight', 'DHL Express', 'Maersk LCL', 'Own fleet'];
export const transfers: Transfer[] = Array.from({ length: 16 }, (_, i) => {
  const rand = seeded(`tr:${i}`);
  const from = WAREHOUSES[Math.floor(rand() * WAREHOUSES.length)]!.code;
  const to = WAREHOUSES.filter((w) => w.code !== from)[Math.floor(rand() * 3)]!.code;
  const statuses: Transfer['status'][] = [
    'requested',
    'requested',
    'picking',
    'picking',
    'in-transit',
    'in-transit',
    'received',
  ];
  const created = TODAY - Math.floor(rand() * 18) * DAY;
  return {
    id: `TR-${780 - i}`,
    from,
    to,
    status: statuses[Math.floor(rand() * statuses.length)]!,
    carrier: CARRIERS[Math.floor(rand() * CARRIERS.length)]!,
    requestedBy: PEOPLE[Math.floor(rand() * PEOPLE.length)]!,
    created: iso(created),
    eta: iso(created + (from === 'RTM' || to === 'RTM' ? 14 : 4) * DAY),
    lines: Array.from({ length: 1 + Math.floor(rand() * 4) }, () => {
      const item = ITEMS[Math.floor(rand() * ITEMS.length)]!;
      return {
        sku: item.sku,
        name: item.name,
        quantity: Math.max(5, Math.round(item.reorderPoint * rand())),
      };
    }),
  };
});

/* Receipts ----------------------------------------------------------------- */

export type ReceiptLine = { sku: string; name: string; expected: number; received: number };
export type Receipt = {
  id: string;
  po: string;
  supplierId: string;
  warehouse: string;
  expected: string;
  status: 'open' | 'partial' | 'complete';
  lines: ReceiptLine[];
};

export const receipts: Receipt[] = Array.from({ length: 6 }, (_, i) => {
  const rand = seeded(`rc:${i}`);
  const supplier = SUPPLIERS[Math.floor(rand() * SUPPLIERS.length)]!;
  const pool = ITEMS.filter((it) => it.supplierId === supplier.id);
  const lines = Array.from({ length: 3 + Math.floor(rand() * 5) }, (_, k) => {
    const item = pool[(k * 3 + i) % Math.max(pool.length, 1)] ?? ITEMS[k]!;
    return { sku: item.sku, name: item.name, expected: Math.max(10, item.reorderQty), received: 0 };
  }).filter((l, idx, arr) => arr.findIndex((x) => x.sku === l.sku) === idx);
  return {
    id: `RC-${3310 + i}`,
    po: `PO-${5341 + i}`,
    supplierId: supplier.id,
    warehouse: i % 3 === 0 ? 'DFW' : 'RNO',
    expected: iso(TODAY + (i - 2) * DAY),
    status: 'open',
    lines,
  };
});

/* Purchase orders ---------------------------------------------------------- */

export type PurchaseOrderLine = {
  sku: string;
  name: string;
  quantity: number;
  received: number;
  unitCost: number;
};
export type PurchaseOrder = {
  id: string;
  supplierId: string;
  warehouse: string;
  status: 'draft' | 'sent' | 'partial' | 'received';
  created: string;
  expected: string;
  deliveredOn: string | null;
  createdBy: string;
  lines: PurchaseOrderLine[];
};

// Newest first: a few drafts, then orders still in flight, then delivered history.
export const purchaseOrders: PurchaseOrder[] = Array.from({ length: 32 }, (_, i) => {
  const rand = seeded(`po:${i}`);
  const supplier = SUPPLIERS[(i * 3) % SUPPLIERS.length]!;
  const pool = ITEMS.filter(
    (it) =>
      it.status === 'active' && (it.supplierId === supplier.id || it.altSupplierId === supplier.id),
  );
  const created = TODAY - (i * 3 + Math.floor(rand() * 3)) * DAY;
  const expected = created + supplier.leadTimeDays * DAY;
  const status: PurchaseOrder['status'] =
    i < 3
      ? 'draft'
      : expected > TODAY
        ? rand() < 0.3
          ? 'partial'
          : 'sent'
        : rand() < 0.12
          ? 'partial'
          : 'received';
  const slip =
    rand() * 100 > supplier.onTimeRate ? 1 + Math.floor(rand() * 6) : -Math.floor(rand() * 3);
  const start = Math.floor(rand() * pool.length);
  const lines = Array.from(
    { length: Math.min(pool.length, 1 + Math.floor(rand() * 5)) },
    (_, k) => {
      const item = pool[(start + k) % pool.length]!;
      const quantity = item.reorderQty;
      return {
        sku: item.sku,
        name: item.name,
        quantity,
        received:
          status === 'received'
            ? quantity
            : status === 'partial'
              ? Math.floor(quantity * (0.3 + rand() * 0.5))
              : 0,
        unitCost: item.unitCost,
      };
    },
  );
  return {
    id: `PO-${5329 - i}`,
    supplierId: supplier.id,
    warehouse: WAREHOUSES[i % 3 === 0 ? 1 : i % 7 === 0 ? 3 : 0]!.code,
    status,
    created: iso(created),
    expected: iso(expected),
    deliveredOn: status === 'received' ? iso(Math.min(TODAY, expected + slip * DAY)) : null,
    createdBy: PEOPLE[Math.floor(rand() * PEOPLE.length)]!,
    lines,
  };
});

/* Weekly flow -------------------------------------------------------------- */

export const weeklyFlow = Array.from({ length: 12 }, (_, w) => {
  const rand = seeded(`flow:${w}`);
  const start = new Date(TODAY - (11 - w) * 7 * DAY);
  return {
    week: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
    inbound: Math.round(9_000 + rand() * 6_500 + (w > 8 ? 3_500 : 0)),
    outbound: Math.round(10_500 + rand() * 5_000 + w * 280),
  };
});
