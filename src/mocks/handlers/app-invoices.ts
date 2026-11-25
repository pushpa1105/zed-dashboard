import { http, HttpResponse, type HttpHandler } from 'msw';

import { env } from '@/core/config/env';

import { errorResponse, networkDelay, requireAuth } from '../utils';

/** Mock API for the "app-invoices" feature. */

type Status = 'draft' | 'sent' | 'paid' | 'overdue';
type Line = { description: string; quantity: number; unitPrice: number };
type Customer = { id: string; name: string; email: string; address: string; taxId: string };
type Invoice = {
  id: string;
  number: string;
  customerId: string;
  status: Status;
  issueDate: number;
  dueDate: number;
  paidAt: number | null;
  items: Line[];
  taxRate: number;
  discount: number;
  notes: string;
  currency: 'USD';
};

const DAY = 86_400_000;

const customers: Customer[] = [
  {
    id: 'cus_northwind',
    name: 'Northwind Logistics',
    email: 'ap@northwind.io',
    address: 'Hafenstraße 12, 20457 Hamburg, Germany',
    taxId: 'DE 311 845 902',
  },
  {
    id: 'cus_fieldwork',
    name: 'Fieldwork Inc.',
    email: 'billing@fieldwork.com',
    address: '410 Townsend St, San Francisco, CA 94107',
    taxId: 'US 84-2219034',
  },
  {
    id: 'cus_lumen',
    name: 'Lumen Health',
    email: 'finance@lumenhealth.co',
    address: '25 Wellington St, Toronto, ON M5E 1A1',
    taxId: 'CA 7461 2290',
  },
  {
    id: 'cus_parcel',
    name: 'Parcelpoint',
    email: 'accounts@parcelpoint.eu',
    address: 'Rua Augusta 180, 1100-053 Lisbon, Portugal',
    taxId: 'PT 514 220 871',
  },
  {
    id: 'cus_kestrel',
    name: 'Kestrel & Co',
    email: 'pay@kestrel.co.uk',
    address: '18 Brick Lane, London E1 6RF, United Kingdom',
    taxId: 'GB 294 7712 40',
  },
  {
    id: 'cus_copper',
    name: 'Copperleaf Studio',
    email: 'hello@copperleaf.studio',
    address: 'Oudezijds 44, 1012 Amsterdam, Netherlands',
    taxId: 'NL 8631.40.112.B01',
  },
  {
    id: 'cus_brightline',
    name: 'Brightline Media',
    email: 'ap@brightline.media',
    address: '901 Congress Ave, Austin, TX 78701',
    taxId: 'US 71-0098813',
  },
];

const CATALOG: Line[] = [
  { description: 'Growth plan, annual (per workspace)', quantity: 1, unitPrice: 1488 },
  { description: 'Additional editor seats', quantity: 12, unitPrice: 15 },
  { description: 'Data warehouse connector (Snowflake)', quantity: 1, unitPrice: 240 },
  { description: 'Onboarding workshop (half day)', quantity: 1, unitPrice: 950 },
  { description: 'Custom dashboard design', quantity: 8, unitPrice: 140 },
  { description: 'Priority support, monthly', quantity: 3, unitPrice: 199 },
  { description: 'Embedded analytics, per 1k views', quantity: 40, unitPrice: 6.5 },
  { description: 'SSO & SCIM add-on', quantity: 1, unitPrice: 300 },
];

let invoices: Invoice[] = [];
let nextNumber = 2051;

const subtotal = (i: Invoice) => i.items.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
const totals = (i: Invoice) => {
  const sub = subtotal(i);
  const discount = Math.min(i.discount, sub);
  const tax = ((sub - discount) * i.taxRate) / 100;
  return { subtotal: sub, discountAmount: discount, tax, total: sub - discount + tax };
};

function effectiveStatus(i: Invoice): Status {
  if (i.status === 'sent' && i.dueDate < Date.now()) return 'overdue';
  return i.status;
}

function seed() {
  const now = Date.now();
  const statuses: Status[] = [
    'paid',
    'paid',
    'sent',
    'paid',
    'draft',
    'sent',
    'paid',
    'sent',
    'paid',
    'draft',
    'paid',
    'sent',
    'paid',
    'paid',
    'sent',
    'paid',
    'paid',
    'sent',
    'paid',
    'draft',
    'paid',
    'sent',
    'paid',
    'paid',
  ];
  invoices = statuses.map((status, n) => {
    const issueDate = now - (n * 5 + 2) * DAY;
    const customer = customers[n % customers.length]!;
    const lines = [
      CATALOG[n % CATALOG.length]!,
      CATALOG[(n * 3 + 1) % CATALOG.length]!,
      ...(n % 3 === 0 ? [CATALOG[(n + 5) % CATALOG.length]!] : []),
    ];
    // A few sent invoices are past due so the "overdue" tab has content.
    const dueDate = issueDate + (n % 4 === 2 ? 14 : 30) * DAY;
    return {
      id: `inv_${2050 - n}`,
      number: `INV-${2050 - n}`,
      customerId: customer.id,
      status,
      issueDate,
      dueDate,
      paidAt: status === 'paid' ? issueDate + (6 + (n % 9)) * DAY : null,
      items: lines.map((l) => ({ ...l })),
      taxRate: customer.taxId.startsWith('US') ? 0 : 20,
      discount: n % 5 === 0 ? 150 : 0,
      notes: 'Payment by bank transfer within the due date. Thank you for your business.',
      currency: 'USD',
    };
  });
}
seed();

const customerOf = (i: Invoice) => customers.find((c) => c.id === i.customerId)!;
const summary = (i: Invoice) => ({
  id: i.id,
  number: i.number,
  customer: { id: i.customerId, name: customerOf(i).name, email: customerOf(i).email },
  status: effectiveStatus(i),
  issueDate: i.issueDate,
  dueDate: i.dueDate,
  total: totals(i).total,
  currency: i.currency,
});
const detail = (i: Invoice) => ({
  ...summary(i),
  customer: customerOf(i),
  paidAt: i.paidAt,
  items: i.items,
  taxRate: i.taxRate,
  discount: i.discount,
  notes: i.notes,
  ...totals(i),
});

type InvoiceInput = Pick<
  Invoice,
  'customerId' | 'issueDate' | 'dueDate' | 'items' | 'taxRate' | 'discount' | 'notes'
> & { send?: boolean };

export const appInvoicesHandlers: HttpHandler[] = [
  http.get(`${env.API_URL}/invoices`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const q = url.searchParams.get('q')?.toLowerCase().trim();
    const all = invoices.map(summary);
    const byStatus = (['draft', 'sent', 'paid', 'overdue'] as const).map((s) => {
      const list = all.filter((i) => i.status === s);
      return { status: s, count: list.length, amount: list.reduce((sum, i) => sum + i.total, 0) };
    });
    const data = all
      .filter((i) => !status || status === 'all' || i.status === status)
      .filter(
        (i) =>
          !q || i.number.toLowerCase().includes(q) || i.customer.name.toLowerCase().includes(q),
      )
      .sort((a, b) => b.issueDate - a.issueDate);
    return HttpResponse.json({ data, byStatus });
  }),

  http.get(`${env.API_URL}/invoices/customers`, async ({ request }) => {
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    return HttpResponse.json(customers);
  }),

  http.get(`${env.API_URL}/invoices/next-number`, async ({ request }) => {
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    return HttpResponse.json({ number: `INV-${nextNumber}` });
  }),

  http.get(`${env.API_URL}/invoices/:id`, async ({ request, params }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const invoice = invoices.find((i) => i.id === params.id);
    if (!invoice) return errorResponse('Invoice not found', 404);
    return HttpResponse.json(detail(invoice));
  }),

  http.post<never, InvoiceInput>(`${env.API_URL}/invoices`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const input = await request.json();
    if (!customers.some((c) => c.id === input.customerId))
      return errorResponse('Pick a customer', 422);
    if (!input.items.length) return errorResponse('Add at least one line item', 422);
    const number = nextNumber++;
    const invoice: Invoice = {
      id: `inv_${number}`,
      number: `INV-${number}`,
      customerId: input.customerId,
      status: input.send ? 'sent' : 'draft',
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      paidAt: null,
      items: input.items,
      taxRate: input.taxRate,
      discount: input.discount,
      notes: input.notes,
      currency: 'USD',
    };
    invoices.unshift(invoice);
    return HttpResponse.json(detail(invoice));
  }),

  http.patch<{ id: string }, { status: 'sent' | 'paid' }>(
    `${env.API_URL}/invoices/:id`,
    async ({ request, params }) => {
      await networkDelay();
      const auth = requireAuth(request);
      if ('error' in auth) return auth.error;
      const invoice = invoices.find((i) => i.id === params.id);
      if (!invoice) return errorResponse('Invoice not found', 404);
      const { status } = await request.json();
      invoice.status = status;
      if (status === 'paid') invoice.paidAt = Date.now();
      if (status === 'sent' && invoice.dueDate < Date.now())
        invoice.dueDate = Date.now() + 30 * DAY;
      return HttpResponse.json(detail(invoice));
    },
  ),
];
