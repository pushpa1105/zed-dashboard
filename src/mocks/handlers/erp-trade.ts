import { http, HttpResponse, type HttpHandler } from 'msw';

import { env } from '@/core/config/env';

import { errorResponse, networkDelay, requireAuth } from '../utils';

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
/** "Today" for the books: a fixed close date keeps aging buckets stable. */
export const TODAY = Date.UTC(2026, 10, 25);
export const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const round2 = (n: number) => Math.round(n * 100) / 100;

/* -------------------------------------------------------------------------- */
/*  Receivables                                                                */
/* -------------------------------------------------------------------------- */

export const CUSTOMERS = [
  ['Fieldwork Inc.', 'ap@fieldwork.io'],
  ['Parcelpoint Logistics', 'billing@parcelpoint.com'],
  ['Lumen Health', 'finance@lumenhealth.org'],
  ['Brightline Studio', 'accounts@brightline.studio'],
  ['Kestrel & Co.', 'payables@kestrel.co'],
  ['Copperleaf Foods', 'ap@copperleaf.com'],
  ['Northwind Traders', 'invoices@northwind.com'],
  ['Haldane & Co.', 'ap@haldane.co'],
  ['Kumo Logistics', 'billing@kumo.jp'],
  ['Mosaic Labs', 'finance@mosaiclabs.ai'],
] as const;

export const PRODUCTS = [
  ['Orbit sensor hub (pack of 10)', 1_280],
  ['Implementation — onboarding sprint', 6_400],
  ['Annual platform subscription', 14_400],
  ['Warehouse scanner kit', 2_190],
  ['Premium support (quarter)', 3_600],
  ['Custom integration — ERP connector', 8_750],
] as const;

type InvoiceStatus = 'draft' | 'open' | 'overdue' | 'paid';
type InvoiceLine = { description: string; quantity: number; unitPrice: number };
type InvoiceEvent = { at: string; label: string };
export type Invoice = {
  id: string;
  customer: string;
  email: string;
  issued: string;
  due: string;
  amount: number;
  paid: number;
  status: InvoiceStatus;
  terms: string;
  lines: InvoiceLine[];
  events: InvoiceEvent[];
};

export const invoices: Invoice[] = Array.from({ length: 64 }, (_, i) => {
  const rand = seeded(`inv:${i}`);
  const [customer, email] = CUSTOMERS[Math.floor(rand() * CUSTOMERS.length)]!;
  const issuedMs = TODAY - Math.floor(rand() * 150) * DAY;
  const termsDays = rand() < 0.7 ? 30 : 45;
  const dueMs = issuedMs + termsDays * DAY;
  const lines = Array.from({ length: 1 + Math.floor(rand() * 3) }, () => {
    const [description, unitPrice] = PRODUCTS[Math.floor(rand() * PRODUCTS.length)]!;
    return { description, quantity: 1 + Math.floor(rand() * 4), unitPrice };
  });
  const amount = round2(lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0) * 1.0825);
  const roll = rand();
  let status: InvoiceStatus;
  let paid = 0;
  if (i < 3) status = 'draft';
  else if (dueMs < TODAY - 120 * DAY || roll < 0.5) {
    status = 'paid';
    paid = amount;
  } else if (dueMs < TODAY) {
    status = 'overdue';
    paid = roll < 0.6 ? 0 : round2(amount * 0.4);
  } else status = 'open';
  const events: InvoiceEvent[] = [{ at: iso(issuedMs), label: 'Invoice created' }];
  if (status !== 'draft') events.push({ at: iso(issuedMs + DAY), label: `Sent to ${email}` });
  if (status !== 'draft' && rand() < 0.7)
    events.push({ at: iso(issuedMs + 3 * DAY), label: 'Viewed by customer' });
  if (status === 'overdue')
    events.push({ at: iso(dueMs + 3 * DAY), label: 'Automatic reminder sent' });
  if (paid > 0)
    events.push({
      at: iso(Math.min(dueMs - 2 * DAY, TODAY)),
      label: paid === amount ? 'Paid in full — ACH' : 'Partial payment received',
    });
  return {
    id: `INV-${2164 - i}`,
    customer,
    email,
    issued: iso(issuedMs),
    due: iso(dueMs),
    amount,
    paid,
    status,
    terms: `Net ${termsDays}`,
    lines,
    events,
  };
});

export const daysOverdue = (inv: Invoice) => Math.floor((TODAY - Date.parse(inv.due)) / DAY);
export const bucketOf = (inv: Invoice) => {
  const d = daysOverdue(inv);
  if (d <= 0) return 'current';
  if (d <= 30) return '1-30';
  if (d <= 60) return '31-60';
  if (d <= 90) return '61-90';
  return '90+';
};

/* -------------------------------------------------------------------------- */
/*  Vendors & payables                                                         */
/* -------------------------------------------------------------------------- */

const VENDORS = [
  [
    'Northwind Components',
    'Materials',
    'Daniel Okafor',
    'orders@northwind-components.com',
    'Net 30',
    'US',
    4.6,
  ],
  [
    'Shenzhen Brightway Electronics',
    'Materials',
    'Lin Wei',
    'sales@brightway.cn',
    'Net 45',
    'CN',
    4.1,
  ],
  [
    'Sierra Freight Lines',
    'Logistics',
    'Maria Gomez',
    'billing@sierrafreight.com',
    'Net 15',
    'US',
    4.4,
  ],
  [
    'Amazon Web Services',
    'Software',
    '—',
    'aws-receivables@amazon.com',
    'Due on receipt',
    'US',
    4.8,
  ],
  ['Packwell Packaging', 'Materials', 'Oliver Grant', 'ar@packwell.co', 'Net 30', 'US', 3.9],
  [
    'Reno Industrial Park LLC',
    'Facilities',
    'Jenna Holt',
    'leasing@renoindustrial.com',
    'Net 10',
    'US',
    4.5,
  ],
  [
    'Atlas Insurance Group',
    'Insurance',
    'Kevin Doyle',
    'premiums@atlasins.com',
    'Net 30',
    'US',
    4.2,
  ],
  ['Figma', 'Software', '—', 'billing@figma.com', 'Due on receipt', 'US', 4.9],
  ['Datadog', 'Software', '—', 'ar@datadoghq.com', 'Net 30', 'US', 4.7],
  [
    'Kraftwerk Tooling GmbH',
    'Equipment',
    'Jonas Becker',
    'buchhaltung@kraftwerk.de',
    'Net 60',
    'DE',
    4.3,
  ],
  ['Lumio Office Supply', 'Office', 'Grace Kim', 'orders@lumio.com', 'Net 30', 'US', 3.7],
  ['Coastline Staffing', 'Services', 'Ana Ruiz', 'billing@coastlinestaff.com', 'Net 15', 'US', 4.0],
  ['Quanta Calibration Labs', 'Services', 'Ravi Shah', 'ops@quantalabs.com', 'Net 30', 'US', 4.6],
  ['Pacific Pallet Co.', 'Materials', 'Tom Reyes', 'sales@pacificpallet.com', 'Net 30', 'US', 3.8],
] as const;

type PayableStatus = 'draft' | 'pending' | 'approved' | 'paid' | 'rejected';
type PayableStep = { key: 'submitted' | 'approved' | 'paid'; by: string | null; at: string | null };
type Payable = {
  id: string;
  kind: 'po' | 'bill';
  vendor: string;
  description: string;
  amount: number;
  created: string;
  due: string;
  status: PayableStatus;
  requester: string;
  approver: string;
  steps: PayableStep[];
  note: string | null;
};

const REQUESTERS = ['Daniel Okafor', 'Lucas Meyer', 'Tom Becker', 'Hannah Morgan', 'Ivan Serhin'];
const ITEMS = [
  'Q1 component restock — sensor boards',
  'Pallet racking for zone C',
  'Freight — Reno to Dallas, 3 trailers',
  'Cloud infrastructure — November',
  'Shipping cartons, 12k units',
  'Calibration of 14 handheld scanners',
  'Temporary pickers — peak season',
  'Design tool seats renewal',
  'Forklift battery replacement',
  'Monitoring — usage overage',
];

const payables: Payable[] = Array.from({ length: 28 }, (_, i) => {
  const rand = seeded(`ap:${i}`);
  const vendor = VENDORS[Math.floor(rand() * VENDORS.length)]!;
  const kind = rand() < 0.5 ? 'po' : 'bill';
  const createdMs = TODAY - Math.floor(rand() * 45) * DAY;
  const statuses: PayableStatus[] = [
    'draft',
    'pending',
    'pending',
    'approved',
    'paid',
    'paid',
    'rejected',
  ];
  const status = statuses[Math.floor(rand() * statuses.length)]!;
  const requester = REQUESTERS[Math.floor(rand() * REQUESTERS.length)]!;
  const approver = 'Priya Raman';
  const submitted = status !== 'draft';
  const approved = status === 'approved' || status === 'paid';
  return {
    id: kind === 'po' ? `PO-${5340 - i}` : `BILL-${8830 - i}`,
    kind,
    vendor: vendor[0],
    description: ITEMS[Math.floor(rand() * ITEMS.length)]!,
    amount: round2(800 + rand() * 46_000),
    created: iso(createdMs),
    due: iso(createdMs + 30 * DAY),
    status,
    requester,
    approver,
    steps: [
      {
        key: 'submitted',
        by: submitted ? requester : null,
        at: submitted ? iso(createdMs + DAY) : null,
      },
      {
        key: 'approved',
        by: approved ? approver : null,
        at: approved ? iso(createdMs + 3 * DAY) : null,
      },
      {
        key: 'paid',
        by: status === 'paid' ? 'Sofia Alvarez' : null,
        at: status === 'paid' ? iso(createdMs + 12 * DAY) : null,
      },
    ],
    note:
      status === 'rejected'
        ? 'Over department budget — resubmit with a quote from a second vendor.'
        : null,
  };
});

const vendorRows = () =>
  VENDORS.map(([name, category, contact, email, terms, country, rating], i) => {
    const rand = seeded(`vendor:${i}`);
    const open = payables
      .filter((p) => p.vendor === name && p.status !== 'paid' && p.status !== 'rejected')
      .reduce((s, p) => s + p.amount, 0);
    return {
      id: `V-${110 + i}`,
      name,
      category,
      contact,
      email,
      terms,
      country,
      rating,
      balance: round2(open),
      ytdSpend: round2(20_000 + rand() * 420_000),
      onTimeRate: Math.round(82 + rand() * 17),
      status: i === 10 ? 'on-hold' : 'active',
    };
  });

/* -------------------------------------------------------------------------- */
/*  Handlers                                                                   */
/* -------------------------------------------------------------------------- */

const base = `${env.API_URL}/erp`;
const summary = (inv: Invoice) => {
  const { lines: _lines, events: _events, ...rest } = inv;
  return { ...rest, bucket: bucketOf(inv), daysOverdue: Math.max(0, daysOverdue(inv)) };
};

export const erpTradeHandlers: HttpHandler[] = [
  http.get(`${base}/invoices`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const bucket = url.searchParams.get('bucket');
    const unpaid = invoices.filter((i) => i.status === 'open' || i.status === 'overdue');
    const buckets = ['current', '1-30', '31-60', '61-90', '90+'].map((key) => {
      const rows = unpaid.filter((i) => bucketOf(i) === key);
      return {
        key,
        count: rows.length,
        amount: round2(rows.reduce((s, r) => s + r.amount - r.paid, 0)),
      };
    });
    let rows = invoices;
    if (status) rows = rows.filter((i) => i.status === status);
    if (bucket)
      rows = rows.filter(
        (i) => (i.status === 'open' || i.status === 'overdue') && bucketOf(i) === bucket,
      );
    return HttpResponse.json({
      buckets,
      collectedThisMonth: round2(
        invoices
          .filter((i) => i.status === 'paid' && i.due >= '2026-11-01')
          .reduce((s, i) => s + i.paid, 0),
      ),
      averageDaysToPay: 27,
      invoices: rows.map(summary),
    });
  }),

  http.get(`${base}/invoices/:id`, async ({ request, params }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const inv = invoices.find((i) => i.id === params.id);
    if (!inv) return errorResponse('Invoice not found', 404);
    return HttpResponse.json({ ...summary(inv), lines: inv.lines, events: inv.events });
  }),

  http.post<{ id: string }, { action: 'remind' | 'payment'; amount?: number }>(
    `${base}/invoices/:id/actions`,
    async ({ request, params }) => {
      await networkDelay();
      const auth = requireAuth(request);
      if ('error' in auth) return auth.error;
      const inv = invoices.find((i) => i.id === params.id);
      if (!inv) return errorResponse('Invoice not found', 404);
      const body = await request.json();
      const today = iso(Date.now());
      if (body.action === 'remind') {
        inv.events.push({ at: today, label: `Reminder sent to ${inv.email}` });
      } else {
        const amount = Math.min(body.amount ?? inv.amount - inv.paid, inv.amount - inv.paid);
        inv.paid = round2(inv.paid + amount);
        if (inv.paid >= inv.amount) inv.status = 'paid';
        inv.events.push({ at: today, label: `Payment recorded — ${amount.toFixed(2)}` });
      }
      return HttpResponse.json({ ...summary(inv), lines: inv.lines, events: inv.events });
    },
  ),

  http.get(`${base}/payables`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const status = new URL(request.url).searchParams.get('status');
    return HttpResponse.json(status ? payables.filter((p) => p.status === status) : payables);
  }),

  http.patch<{ id: string }, { action: 'submit' | 'approve' | 'reject' | 'pay'; note?: string }>(
    `${base}/payables/:id`,
    async ({ request, params }) => {
      await networkDelay();
      const auth = requireAuth(request);
      if ('error' in auth) return auth.error;
      const doc = payables.find((p) => p.id === params.id);
      if (!doc) return errorResponse('Document not found', 404);
      const { action, note } = await request.json();
      const me = `${auth.user.firstName} ${auth.user.lastName}`;
      const today = iso(Date.now());
      const step = (key: PayableStep['key']) => doc.steps.find((s) => s.key === key)!;
      const allowed: Record<typeof action, PayableStatus[]> = {
        submit: ['draft', 'rejected'],
        approve: ['pending'],
        reject: ['pending'],
        pay: ['approved'],
      };
      if (!allowed[action].includes(doc.status)) {
        return errorResponse(`Cannot ${action} a ${doc.status} document`, 409);
      }
      if (action === 'submit') {
        doc.status = 'pending';
        doc.note = null;
        Object.assign(step('submitted'), { by: me, at: today });
      } else if (action === 'approve') {
        doc.status = 'approved';
        Object.assign(step('approved'), { by: me, at: today });
      } else if (action === 'reject') {
        doc.status = 'rejected';
        doc.note = note || 'Rejected without comment.';
      } else {
        doc.status = 'paid';
        Object.assign(step('paid'), { by: me, at: today });
      }
      return HttpResponse.json(doc);
    },
  ),

  http.get(`${base}/vendors`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    return HttpResponse.json(vendorRows());
  }),
];
