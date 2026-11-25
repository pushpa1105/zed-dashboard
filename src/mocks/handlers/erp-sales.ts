import { http, HttpResponse, type HttpHandler } from 'msw';

import { env } from '@/core/config/env';

import { errorResponse, networkDelay, requireAuth } from '../utils';

import {
  bucketOf,
  CUSTOMERS,
  DAY,
  daysOverdue,
  invoices,
  iso,
  PRODUCTS,
  round2,
  seeded,
  TODAY,
  type Invoice,
} from './erp-trade';

const TAX_RATE = 0.0825;
const today = iso(TODAY);
const isUnpaid = (inv: Invoice) => inv.status === 'open' || inv.status === 'overdue';

/* -------------------------------------------------------------------------- */
/*  Receivables by customer                                                    */
/* -------------------------------------------------------------------------- */

const customers = CUSTOMERS.map(([name, email], i) => {
  const rand = seeded(`customer:${i}`);
  return {
    id: `C-${101 + i}`,
    name,
    email,
    creditLimit: 25_000 * (2 + Math.floor(rand() * 5)),
    lastReminder: rand() < 0.4 ? iso(TODAY - Math.floor(4 + rand() * 20) * DAY) : null,
  };
});

const receivable = (customer: (typeof customers)[number]) => ({
  ...customer,
  invoices: invoices
    .filter((inv) => inv.customer === customer.name && isUnpaid(inv))
    .map((inv) => ({
      id: inv.id,
      issued: inv.issued,
      due: inv.due,
      balance: round2(inv.amount - inv.paid),
      daysOverdue: Math.max(0, daysOverdue(inv)),
      bucket: bucketOf(inv),
    })),
});

/* -------------------------------------------------------------------------- */
/*  Sales orders                                                               */
/* -------------------------------------------------------------------------- */

type SoStatus = 'quote' | 'confirmed' | 'fulfilled' | 'invoiced';
type SalesOrder = {
  id: string;
  customer: string;
  email: string;
  rep: string;
  created: string;
  delivery: string;
  status: SoStatus;
  invoiceId: string | null;
  taxRate: number;
  lines: Array<{ description: string; quantity: number; unitPrice: number; discount: number }>;
  events: Array<{ at: string; label: string }>;
};

const REPS = ['Hannah Morgan', 'Lucas Meyer', 'Ana Ruiz'] as const;
const STAGES: SoStatus[] = ['quote', 'confirmed', 'fulfilled', 'invoiced'];

const salesOrders: SalesOrder[] = Array.from({ length: 30 }, (_, i) => {
  const rand = seeded(`so:${i}`);
  const status = STAGES[i < 7 ? 0 : i < 15 ? 1 : i < 21 ? 2 : 3]!;
  const invoice = status === 'invoiced' ? invoices[3 + i] : undefined;
  const [customer, email] = invoice
    ? [invoice.customer, invoice.email]
    : CUSTOMERS[Math.floor(rand() * CUSTOMERS.length)]!;
  const createdMs = TODAY - (i * 3 + Math.floor(rand() * 3)) * DAY;
  const lines = Array.from({ length: 1 + Math.floor(rand() * 4) }, () => {
    const [description, unitPrice] = PRODUCTS[Math.floor(rand() * PRODUCTS.length)]!;
    const discount = rand() < 0.3 ? 0.1 : 0;
    return { description, quantity: 1 + Math.floor(rand() * 6), unitPrice, discount };
  });
  const stage = STAGES.indexOf(status);
  const events = [
    { at: iso(createdMs), label: `Quote sent to ${email}` },
    { at: iso(createdMs + 2 * DAY), label: 'Confirmed by customer' },
    { at: iso(createdMs + 9 * DAY), label: `Shipped — ${lines.length} package(s)` },
    { at: iso(createdMs + 10 * DAY), label: `Invoiced as ${invoice?.id}` },
  ].slice(0, stage + 1);
  return {
    id: `SO-${7320 - i}`,
    customer,
    email,
    rep: REPS[i % REPS.length]!,
    created: iso(createdMs),
    delivery: iso(createdMs + (7 + Math.floor(rand() * 14)) * DAY),
    status,
    invoiceId: invoice?.id ?? null,
    taxRate: TAX_RATE,
    lines,
    events,
  };
});

/** Bills a fulfilled order: the new invoice joins the receivables ledger. */
function invoiceOrder(so: SalesOrder) {
  const next = Math.max(...invoices.map((inv) => Number(inv.id.slice(4)))) + 1;
  const lines = so.lines.map((l) => ({
    description: l.description,
    quantity: l.quantity,
    unitPrice: round2(l.unitPrice * (1 - l.discount)),
  }));
  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const invoice: Invoice = {
    id: `INV-${next}`,
    customer: so.customer,
    email: so.email,
    issued: today,
    due: iso(TODAY + 30 * DAY),
    amount: round2(subtotal * (1 + so.taxRate)),
    paid: 0,
    status: 'open',
    terms: 'Net 30',
    lines,
    events: [
      { at: today, label: `Created from ${so.id}` },
      { at: today, label: `Sent to ${so.email}` },
    ],
  };
  invoices.unshift(invoice);
  return invoice.id;
}

/* -------------------------------------------------------------------------- */
/*  Handlers                                                                   */
/* -------------------------------------------------------------------------- */

const base = `${env.API_URL}/erp`;

export const erpSalesHandlers: HttpHandler[] = [
  http.get(`${base}/receivables`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    return HttpResponse.json(customers.map(receivable));
  }),

  http.post(`${base}/receivables/:id/reminders`, async ({ request, params }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const customer = customers.find((c) => c.id === params.id);
    if (!customer) return errorResponse('Customer not found', 404);
    const overdue = invoices.filter((i) => i.customer === customer.name && i.status === 'overdue');
    if (!overdue.length) return errorResponse('Nothing is overdue for this customer', 409);
    for (const inv of overdue)
      inv.events.push({ at: today, label: `Reminder sent to ${inv.email}` });
    customer.lastReminder = today;
    return HttpResponse.json(receivable(customer));
  }),

  http.get(`${base}/sales-orders`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    return HttpResponse.json(salesOrders);
  }),

  http.patch<{ id: string }, { action: 'confirm' | 'invoice' }>(
    `${base}/sales-orders/:id`,
    async ({ request, params }) => {
      await networkDelay();
      const auth = requireAuth(request);
      if ('error' in auth) return auth.error;
      const so = salesOrders.find((o) => o.id === params.id);
      if (!so) return errorResponse('Sales order not found', 404);
      const { action } = await request.json();
      const from: Record<typeof action, SoStatus> = { confirm: 'quote', invoice: 'fulfilled' };
      if (so.status !== from[action]) {
        return errorResponse(`Cannot ${action} a ${so.status} order`, 409);
      }
      if (action === 'confirm') {
        so.status = 'confirmed';
        so.events.push({ at: today, label: 'Confirmed by customer' });
      } else {
        so.invoiceId = invoiceOrder(so);
        so.status = 'invoiced';
        so.events.push({ at: today, label: `Invoiced as ${so.invoiceId}` });
      }
      return HttpResponse.json(so);
    },
  ),
];
