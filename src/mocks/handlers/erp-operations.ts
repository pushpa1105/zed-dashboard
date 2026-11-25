import { http, HttpResponse, type HttpHandler } from 'msw';

import { env } from '@/core/config/env';

import { errorResponse, networkDelay, requireAuth } from '../utils';

import { DAY, iso, round2, seeded, TODAY } from './erp-trade';

const pick = <T>(rand: () => number, list: readonly T[]) => list[Math.floor(rand() * list.length)]!;
const today = iso(TODAY);

/* -------------------------------------------------------------------------- */
/*  Purchase orders                                                            */
/* -------------------------------------------------------------------------- */

type PoStatus = 'draft' | 'approved' | 'received' | 'closed';
type PoEvent = { at: string; label: string };
type PurchaseOrder = {
  id: string;
  vendor: string;
  buyer: string;
  created: string;
  expected: string;
  status: PoStatus;
  lines: Array<{
    sku: string;
    description: string;
    quantity: number;
    received: number;
    unitPrice: number;
  }>;
  events: PoEvent[];
};

const PO_VENDORS = [
  'Northwind Components',
  'Shenzhen Brightway Electronics',
  'Sierra Freight Lines',
  'Cascade Packaging',
  'Pinecrest Office Supply',
  'Atlas Industrial Metals',
] as const;
const BUYERS = ['Maya Chen', 'Luis Romero', 'Priya Natarajan'] as const;
const ITEMS = [
  ['NW-4410', 'Sensor PCB assembly', 18.4],
  ['NW-2280', 'Aluminium enclosure, anodized', 9.75],
  ['BW-0915', 'Bluetooth LE module', 4.2],
  ['BW-1120', 'Li-ion cell 3.7V 2600mAh', 3.1],
  ['CP-0300', 'Shipping carton 30×20×15', 0.85],
  ['CP-0412', 'Anti-static foam insert', 0.4],
  ['AT-7701', 'Steel mounting bracket', 2.6],
  ['PC-1002', 'Thermal label roll (box of 12)', 38],
] as const;
const PO_STAGES: PoStatus[] = ['draft', 'approved', 'received', 'closed'];

const purchaseOrders: PurchaseOrder[] = Array.from({ length: 26 }, (_, i) => {
  const rand = seeded(`po:${i}`);
  const createdMs = TODAY - (i * 5 + Math.floor(rand() * 4)) * DAY;
  const status = PO_STAGES[i < 4 ? 0 : i < 11 ? 1 : i < 18 ? 2 : 3]!;
  const buyer = pick(rand, BUYERS);
  const lines = Array.from({ length: 2 + Math.floor(rand() * 3) }, () => {
    const [sku, description, unitPrice] = pick(rand, ITEMS);
    const quantity = (5 + Math.floor(rand() * 40)) * 25;
    const received =
      status === 'draft'
        ? 0
        : status === 'approved'
          ? Math.round((quantity * Math.floor(rand() * 3)) / 4)
          : quantity;
    return { sku, description, quantity, received, unitPrice };
  });
  const events: PoEvent[] = [{ at: iso(createdMs), label: `Created by ${buyer}` }];
  if (status !== 'draft')
    events.push({ at: iso(createdMs + DAY), label: 'Approved by Elena Park' });
  if (lines.some((l) => l.received > 0))
    events.push({ at: iso(createdMs + 9 * DAY), label: 'Goods received at Reno DC' });
  if (status === 'closed') events.push({ at: iso(createdMs + 14 * DAY), label: 'Order closed' });
  return {
    id: `PO-${4180 - i}`,
    vendor: pick(rand, PO_VENDORS),
    buyer,
    created: iso(createdMs),
    expected: iso(createdMs + (14 + Math.floor(rand() * 10)) * DAY),
    status,
    lines,
    events,
  };
});

/* -------------------------------------------------------------------------- */
/*  Bank reconciliation                                                        */
/* -------------------------------------------------------------------------- */

type BankLine = {
  id: string;
  date: string;
  description: string;
  amount: number;
  matchId: string | null;
};
type LedgerLine = Omit<BankLine, 'description'> & { reference: string; memo: string };

const PAYEES = [
  ['Fieldwork Inc.', 1],
  ['Parcelpoint Logistics', 1],
  ['Lumen Health', 1],
  ['Northwind Components', -1],
  ['Sierra Freight Lines', -1],
  ['Gusto Payroll', -1],
  ['Amazon Web Services', -1],
  ['Reno Commerce Center lease', -1],
] as const;

const statementLines: BankLine[] = [];
const ledgerLines: LedgerLine[] = [];
for (let i = 0; i < 22; i++) {
  const rand = seeded(`bank:${i}`);
  const [payee, sign] = pick(rand, PAYEES);
  const amount = round2(sign * (800 + rand() * 24_000));
  const postedMs = Date.UTC(2026, 10, 1) + Math.floor(i * 1.1) * DAY;
  const onStatement = i % 7 !== 6; // outstanding checks and deposits in transit
  const inLedger = i % 6 !== 5; // bank fees and interest not booked yet
  const matched = i < 10 && onStatement && inLedger;
  const bankId = `BS-${1100 + i}`;
  const ledgerId = `GL-${8840 + i}`;
  if (onStatement)
    statementLines.push({
      id: bankId,
      date: iso(postedMs),
      description: inLedger
        ? `${sign > 0 ? 'ACH CREDIT' : 'ACH DEBIT'} ${payee.toUpperCase()}`
        : i % 2
          ? 'MONTHLY SERVICE FEE'
          : 'INTEREST PAYMENT',
      amount: inLedger ? amount : i % 2 ? -45 : 128.37,
      matchId: matched ? ledgerId : null,
    });
  if (inLedger)
    ledgerLines.push({
      id: ledgerId,
      date: iso(postedMs - DAY),
      reference: sign > 0 ? `RCPT-${5200 + i}` : `CHK-${10400 + i}`,
      memo: `${sign > 0 ? 'Customer payment' : 'Payment'} — ${payee}`,
      amount,
      matchId: matched ? bankId : null,
    });
}

const reconciliation = () => ({
  account: 'Chase Operating ••4821',
  period: '2026-11',
  openingBalance: 184_250,
  statement: statementLines,
  ledger: ledgerLines,
});

/* -------------------------------------------------------------------------- */
/*  Fixed assets                                                               */
/* -------------------------------------------------------------------------- */

type AssetCategory = 'buildings' | 'machinery' | 'vehicles' | 'computers' | 'furniture';
type AssetMethod = 'straight-line' | 'declining-balance';
type AssetInput = {
  name: string;
  category: AssetCategory;
  location: string;
  acquired: string;
  cost: number;
  salvage: number;
  usefulLife: number;
  method: AssetMethod;
};

/** Full-year convention; declining balance is double-declining, floored at salvage. */
function schedule(a: AssetInput) {
  const start = Number(a.acquired.slice(0, 4));
  let book = a.cost;
  return Array.from({ length: a.usefulLife }, (_, y) => {
    const rate =
      a.method === 'straight-line'
        ? (a.cost - a.salvage) / a.usefulLife
        : (book * 2) / a.usefulLife;
    const depreciation = round2(
      y === a.usefulLife - 1 ? book - a.salvage : Math.min(rate, book - a.salvage),
    );
    book = round2(book - depreciation);
    return { year: start + y, depreciation, bookValue: book };
  });
}

let assetSeq = 1000;
function toAsset(input: AssetInput) {
  const rows = schedule(input);
  const bookValue = rows.filter((r) => r.year <= 2026).at(-1)?.bookValue ?? input.cost;
  return {
    ...input,
    id: `FA-${++assetSeq}`,
    bookValue,
    accumulated: round2(input.cost - bookValue),
    schedule: rows,
  };
}

const ASSET_SEEDS: Array<[AssetCategory, string, number, number]> = [
  ['buildings', 'Reno distribution center — roof', 420_000, 20],
  ['machinery', 'Pick-and-place SMT line', 268_000, 8],
  ['machinery', 'Reflow oven, 8-zone', 74_500, 7],
  ['machinery', 'Pallet racking, aisle A–F', 38_900, 10],
  ['vehicles', 'Ford Transit cargo van', 52_300, 5],
  ['vehicles', 'Toyota 8FGU25 forklift', 31_800, 6],
  ['computers', 'MacBook Pro fleet (24)', 71_900, 3],
  ['computers', 'Dell PowerEdge R760 cluster', 46_200, 4],
  ['computers', 'Warehouse scanners (40)', 19_600, 3],
  ['furniture', 'HQ workstations & seating', 28_400, 7],
  ['furniture', 'Conference room fit-out', 12_750, 7],
];
const LOCATIONS = ['Reno HQ', 'Reno DC', 'Austin office'] as const;

const assets = ASSET_SEEDS.map(([category, name, cost, usefulLife], i) => {
  const rand = seeded(`asset:${i}`);
  return toAsset({
    name,
    category,
    location: pick(rand, LOCATIONS),
    acquired: iso(Date.UTC(2020 + Math.floor(rand() * 6), Math.floor(rand() * 12), 1)),
    cost,
    salvage: round2(cost * (category === 'computers' ? 0 : 0.1)),
    usefulLife,
    method:
      category === 'computers' || category === 'vehicles' ? 'declining-balance' : 'straight-line',
  });
});

/* -------------------------------------------------------------------------- */
/*  Expense claims                                                             */
/* -------------------------------------------------------------------------- */

type ClaimStatus = 'pending' | 'approved' | 'rejected';
const EMPLOYEES = [
  ['Maya Chen', 'Operations'],
  ['Jonah Weiss', 'Sales'],
  ['Amara Okoye', 'Engineering'],
  ['Diego Alvarez', 'Sales'],
  ['Hannah Kim', 'Marketing'],
  ['Tom Becker', 'Engineering'],
  ['Sofia Rossi', 'Finance'],
] as const;
const EXPENSES = {
  travel: ['Flight SFO → AUS, customer visit', 'Train to Sacramento, trade show'],
  lodging: ['Hotel, 3 nights — Austin', 'Hotel, 2 nights — Chicago'],
  meals: ['Client dinner — Parcelpoint', 'Team lunch, sprint review'],
  software: ['Figma seat, annual', 'JetBrains license renewal'],
  equipment: ['External monitor 27"', 'Noise-cancelling headset'],
  mileage: ['Mileage — Reno DC site visits', 'Mileage — Carson City supplier'],
} as const;
type ClaimCategory = keyof typeof EXPENSES;
const CATEGORY_KEYS = Object.keys(EXPENSES) as ClaimCategory[];
const RANGES: Record<ClaimCategory, [number, number]> = {
  travel: [180, 1_400],
  lodging: [240, 980],
  meals: [35, 420],
  software: [90, 650],
  equipment: [60, 720],
  mileage: [25, 310],
};

const claims = Array.from({ length: 32 }, (_, i) => {
  const rand = seeded(`claim:${i}`);
  const [employee, department] = pick(rand, EMPLOYEES);
  const category = pick(rand, CATEGORY_KEYS);
  const [min, max] = RANGES[category];
  const roll = rand();
  const status: ClaimStatus = i < 9 ? 'pending' : roll < 0.15 ? 'rejected' : 'approved';
  return {
    id: `EXP-${3310 - i}`,
    employee,
    department,
    submitted: iso(TODAY - (i * 2 + Math.floor(rand() * 2)) * DAY),
    category,
    description: pick(rand, EXPENSES[category]),
    amount: round2(min + rand() * (max - min)),
    receipts: i % 8 === 3 ? 0 : 1 + Math.floor(rand() * 3),
    status,
    note:
      status === 'rejected' ? 'Over the per-diem limit — resubmit with itemized receipt.' : null,
  };
});

/* -------------------------------------------------------------------------- */
/*  Handlers                                                                   */
/* -------------------------------------------------------------------------- */

const base = `${env.API_URL}/erp`;

async function authorize(request: Request) {
  await networkDelay();
  return requireAuth(request);
}

export const erpOperationsHandlers: HttpHandler[] = [
  http.get(`${base}/purchase-orders`, async ({ request }) => {
    const auth = await authorize(request);
    if ('error' in auth) return auth.error;
    return HttpResponse.json(purchaseOrders);
  }),

  http.get(`${base}/purchase-orders/:id`, async ({ request, params }) => {
    const auth = await authorize(request);
    if ('error' in auth) return auth.error;
    const po = purchaseOrders.find((p) => p.id === params.id);
    return po ? HttpResponse.json(po) : errorResponse('Purchase order not found', 404);
  }),

  http.patch<{ id: string }, { action: 'approve' | 'receive' | 'close' }>(
    `${base}/purchase-orders/:id`,
    async ({ request, params }) => {
      const auth = await authorize(request);
      if ('error' in auth) return auth.error;
      const po = purchaseOrders.find((p) => p.id === params.id);
      if (!po) return errorResponse('Purchase order not found', 404);
      const { action } = await request.json();
      const from: Record<typeof action, PoStatus> = {
        approve: 'draft',
        receive: 'approved',
        close: 'received',
      };
      if (po.status !== from[action]) {
        return errorResponse(`Cannot ${action} a ${po.status} purchase order`, 409);
      }
      const me = `${auth.user.firstName} ${auth.user.lastName}`;
      if (action === 'approve') {
        po.status = 'approved';
        po.events.push({ at: today, label: `Approved by ${me}` });
      } else if (action === 'receive') {
        po.lines.forEach((l) => (l.received = l.quantity));
        po.status = 'received';
        po.events.push({ at: today, label: `Remaining goods received by ${me}` });
      } else {
        po.status = 'closed';
        po.events.push({ at: today, label: 'Order closed' });
      }
      return HttpResponse.json(po);
    },
  ),

  http.get(`${base}/reconciliation`, async ({ request }) => {
    const auth = await authorize(request);
    if ('error' in auth) return auth.error;
    return HttpResponse.json(reconciliation());
  }),

  http.post<never, { statementId: string; ledgerId: string }>(
    `${base}/reconciliation/matches`,
    async ({ request }) => {
      const auth = await authorize(request);
      if ('error' in auth) return auth.error;
      const { statementId, ledgerId } = await request.json();
      const bank = statementLines.find((l) => l.id === statementId);
      const book = ledgerLines.find((l) => l.id === ledgerId);
      if (!bank || !book) return errorResponse('Line not found', 404);
      if (bank.matchId || book.matchId) return errorResponse('Line is already matched', 409);
      if (bank.amount !== book.amount) return errorResponse('Amounts do not match', 422);
      bank.matchId = book.id;
      book.matchId = bank.id;
      return HttpResponse.json(reconciliation());
    },
  ),

  http.delete(`${base}/reconciliation/matches/:statementId`, async ({ request, params }) => {
    const auth = await authorize(request);
    if ('error' in auth) return auth.error;
    const bank = statementLines.find((l) => l.id === params.statementId);
    const book = ledgerLines.find((l) => l.id === bank?.matchId);
    if (!bank || !book) return errorResponse('Match not found', 404);
    bank.matchId = null;
    book.matchId = null;
    return HttpResponse.json(reconciliation());
  }),

  http.get(`${base}/assets`, async ({ request }) => {
    const auth = await authorize(request);
    if ('error' in auth) return auth.error;
    return HttpResponse.json(assets);
  }),

  http.post<never, AssetInput>(`${base}/assets`, async ({ request }) => {
    const auth = await authorize(request);
    if ('error' in auth) return auth.error;
    const asset = toAsset(await request.json());
    assets.unshift(asset);
    return HttpResponse.json(asset, { status: 201 });
  }),

  http.get(`${base}/expense-claims`, async ({ request }) => {
    const auth = await authorize(request);
    if ('error' in auth) return auth.error;
    return HttpResponse.json(claims);
  }),

  http.patch<{ id: string }, { action: 'approve' | 'reject'; note?: string }>(
    `${base}/expense-claims/:id`,
    async ({ request, params }) => {
      const auth = await authorize(request);
      if ('error' in auth) return auth.error;
      const claim = claims.find((c) => c.id === params.id);
      if (!claim) return errorResponse('Claim not found', 404);
      if (claim.status !== 'pending') return errorResponse('Claim was already reviewed', 409);
      const { action, note } = await request.json();
      claim.status = action === 'approve' ? 'approved' : 'rejected';
      claim.note = action === 'reject' ? note || 'Rejected without comment.' : null;
      return HttpResponse.json(claim);
    },
  ),
];
