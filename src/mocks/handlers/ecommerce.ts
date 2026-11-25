import { http, HttpResponse, type HttpHandler } from 'msw';

import { env } from '@/core/config/env';

import { networkDelay, requireAuth } from '../utils';

import { ecommerceCartHandlers } from './ecommerce-carts';
import { ecommerceGiftCardHandlers } from './ecommerce-gift-cards';
import { ecommerceReportHandlers } from './ecommerce-reports';
import {
  CITIES,
  DAY,
  db,
  E,
  guard,
  money,
  notFound,
  NOW,
  pick,
  seeded,
  STREETS,
  type Customer,
  type Discount,
  type Order,
  type OrderStatus,
  type Product,
  type Review,
} from './ecommerce-store';

const YEARS = ['2025', '2024', '2023'] as const;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CUSTOMERS = [
  'Sophia Turner',
  'Nil Yeager',
  'Austin Price',
  'Thomas Grey',
  'Chase Whitfield',
  'Xavier Nunez',
  'Brody Allen',
  'Leah Kim',
];
const PRODUCTS = [
  ['Aero Running Shoe', 'Footwear', 129],
  ['Linen Overshirt', 'Apparel', 84],
  ['Canvas Weekender', 'Bags', 168],
  ['Merino Crew Sock (3-pack)', 'Accessories', 32],
  ['Trail Shell Jacket', 'Outerwear', 219],
  ['Everyday Tote', 'Bags', 58],
] as const;
const ORDER_STATUSES = ['paid', 'pending', 'shipped', 'refunded'] as const;

const walk = (rand: () => number, n: number, start: number, step: number) => {
  let v = start;
  return Array.from({ length: n }, () => {
    v = Math.max(start * 0.4, v + (rand() - 0.45) * step);
    return Math.round(v);
  });
};

const overviewHandlers: HttpHandler[] = [
  http.get(`${env.API_URL}/dashboards/ecommerce/overview`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;

    const param = new URL(request.url).searchParams.get('year') ?? '2025';
    const year = (YEARS as readonly string[]).includes(param) ? param : '2025';
    const rand = seeded(`ecommerce:${year}`);
    const scale = year === '2025' ? 1 : year === '2024' ? 0.84 : 0.7;
    const s = (n: number) => Math.round(n * scale);

    const thisYear = walk(rand, 12, s(620), s(260));
    const lastYear = walk(rand, 12, s(540), s(220));

    return HttpResponse.json({
      kpis: [
        { key: 'revenue', value: s(12_234), delta: 3.5, trend: walk(rand, 12, 40, 14) },
        { key: 'costs', value: s(2_495), delta: -1.2, trend: walk(rand, 12, 30, 10) },
        { key: 'profit', value: s(9_274), delta: 5.8, trend: walk(rand, 12, 50, 16) },
        { key: 'shipments', value: s(8_472), delta: -0.6, trend: walk(rand, 12, 45, 12) },
      ],
      orderRate: MONTHS.map((month, i) => ({
        month,
        thisYear: thisYear[i]!,
        lastYear: lastYear[i]!,
      })),
      carrying: {
        total: Math.round(2_847.9 * scale * 100) / 100,
        delta: -4.2,
        bars: MONTHS.slice(4, 11).map((month) => ({ month, value: s(220 + rand() * 260) })),
      },
      performance: DAYS.map((day) => ({
        day,
        target: s(40 + rand() * 30),
        paid: s(12 + rand() * 20),
        pending: s(10 + rand() * 30),
      })),
      channels: [
        { key: 'store', label: 'Online store', value: s(48_210) },
        { key: 'marketplace', label: 'Marketplaces', value: s(26_930) },
        { key: 'retail', label: 'Retail POS', value: s(17_480) },
        { key: 'social', label: 'Social shops', value: s(8_120) },
      ],
      orders: CUSTOMERS.map((customer, i) => {
        const [product, , price] = PRODUCTS[i % PRODUCTS.length]!;
        const qty = 1 + Math.floor(rand() * 3);
        return {
          id: `#${year.slice(2)}${(4120 + i * 7).toString()}`,
          customer,
          product,
          quantity: qty,
          amount: Math.round(price * qty * 100) / 100,
          status: ORDER_STATUSES[Math.floor(rand() * ORDER_STATUSES.length)]!,
          date: Date.UTC(Number(year), 10, 22 - Math.floor(i / 2), 9 + i, 32),
        };
      }),
      topProducts: PRODUCTS.map(([name, category, price], i) => {
        const sold = s(140 + rand() * 600);
        return {
          id: `p-${i}`,
          name,
          category,
          sold,
          revenue: Math.round(sold * price),
          stock: Math.floor(rand() * 240),
          trend: walk(rand, 10, 20, 8),
        };
      }).sort((a, b) => b.revenue - a.revenue),
      ratings: CUSTOMERS.slice(2, 7).map((name, i) => ({
        id: `c-${i}`,
        name,
        orders: 3 + Math.floor(rand() * 14),
        rating: Math.round((3.6 + rand() * 1.4) * 10) / 10,
        spent: Math.round((49 + rand() * 180) * 100) / 100,
      })),
      summary: [
        { key: 'abandoned', label: 'Abandoned carts', count: s(1_255) },
        { key: 'returns', label: 'Pending returns', count: s(86) },
        { key: 'lowStock', label: 'Low-stock SKUs', count: s(23) },
        { key: 'tickets', label: 'Open support tickets', count: s(41) },
      ],
    });
  }),
];

const productSummary = (p: Product) => {
  const { variants, description: _d, seoTitle: _s, seoDescription: _sd, ...rest } = p;
  return { ...rest, variantCount: variants.length };
};
const orderSummary = (o: Order) => ({
  id: o.id,
  number: o.number,
  customerId: o.customerId,
  customerName: o.customerName,
  customerEmail: o.customerEmail,
  channel: o.channel,
  status: o.status,
  payment: o.payment,
  itemCount: o.items.reduce((s, it) => s + it.qty, 0),
  total: o.total,
  createdAt: o.createdAt,
});
const categoryCounts = () => {
  const { categories, products } = db();
  const direct = new Map<string, number>();
  for (const p of products) direct.set(p.categoryId, (direct.get(p.categoryId) ?? 0) + 1);
  return categories
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((c) => ({
      ...c,
      productCount:
        (direct.get(c.id) ?? 0) +
        categories
          .filter((ch) => ch.parentId === c.id)
          .reduce((s, ch) => s + (direct.get(ch.id) ?? 0), 0),
    }));
};
/** Refunds up to what is left on the order. Returns the amount actually refunded. */
const applyRefund = (order: Order, amount: number, reason: string) => {
  const capped = money(Math.min(amount, order.total - order.refunded));
  if (capped <= 0) return 0;
  order.refunded = money(order.refunded + capped);
  order.payment = order.refunded >= order.total ? 'refunded' : 'partially_refunded';
  if (order.payment === 'refunded') order.status = 'refunded';
  order.events.unshift({
    id: `e-${Date.now()}`,
    type: 'refund',
    at: Date.now(),
    text: `Refunded $${capped.toFixed(2)}${reason ? ` · ${reason}` : ''}`,
    author: 'Demo User',
  });
  return capped;
};
const ORDER_TABS = [
  'all',
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const;

/* Customer profiles, payments, returns and store settings ----------------- */

type Note = { id: string; text: string; author: string; at: number };
type PaymentMethod = 'card' | 'apple_pay' | 'paypal' | 'in_person';
type ReturnReason = 'damaged' | 'wrongItem' | 'notAsDescribed' | 'changedMind' | 'other';
type ReturnStatus = 'requested' | 'approved' | 'rejected' | 'refunded';
type ReturnRequest = {
  id: string;
  number: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  item: { name: string; variant: string; hue: number; qty: number };
  reason: ReturnReason;
  comment: string;
  amount: number;
  status: ReturnStatus;
  createdAt: number;
};

const RETURN_COMMENTS: Record<ReturnReason, string> = {
  damaged: 'The box was crushed and the item has a tear along the seam.',
  wrongItem: 'I ordered a different size than the one that arrived.',
  notAsDescribed: 'The colour is much darker than in the product photos.',
  changedMind: 'Found something that suits me better, item is unworn with tags.',
  other: 'Received a duplicate as a gift.',
};
const NOTE_SEED = [
  'Prefers delivery after 5pm. Leave with the concierge.',
  'Asked about wholesale pricing for a team order of 40 units.',
  'Sizing runs small for this customer; suggest one size up.',
];

/** Home address in the customer's city; every third customer also has a work address. */
const addressesOf = (c: Customer) => {
  const n = Number(c.id.slice(4));
  const home = CITIES.findIndex(([city]) => city === c.city);
  const labels = n % 3 ? (['home'] as const) : (['home', 'work'] as const);
  return labels.map((label, i) => {
    const at = (home + i * 2) % CITIES.length;
    const [city, country, zip] = CITIES[at]!;
    return {
      id: `${c.id}-${label}`,
      label,
      line1: `${(n * 17 + i * 100) % 480} ${STREETS[at]!}`,
      city,
      zip,
      country,
      isDefault: i === 0,
    };
  });
};

function buildBackOffice() {
  const rand = seeded('ecommerce:back-office');
  const { customers, orders } = db();

  const notes: Record<string, Note[]> = {};
  customers.forEach((c, i) => {
    if (i % 4 === 0)
      notes[c.id] = [
        {
          id: `note-${c.id}`,
          text: NOTE_SEED[i % NOTE_SEED.length]!,
          author: 'Maya Chen',
          at: c.lastOrderAt + DAY,
        },
      ];
  });

  const returns: ReturnRequest[] = orders
    .filter((o) => o.status === 'delivered' || o.status === 'refunded')
    .slice(0, 40)
    .map((o, i) => {
      const line = o.items[0]!;
      const reason = pick(rand, Object.keys(RETURN_COMMENTS) as ReturnReason[]);
      return {
        id: `ret-${i + 1}`,
        number: `RMA-${(1240 - i).toString()}`,
        orderId: o.id,
        orderNumber: o.number,
        customerId: o.customerId,
        customerName: o.customerName,
        item: { name: line.name, variant: line.variant, hue: line.hue, qty: 1 },
        reason,
        comment: RETURN_COMMENTS[reason],
        amount: money(line.price * 1.08),
        status:
          o.status === 'refunded'
            ? 'refunded'
            : pick(rand, ['requested', 'requested', 'approved', 'rejected']),
        createdAt: Math.min(NOW - (i + 1) * 0.4 * DAY, o.createdAt + 5 * DAY),
      };
    });

  const settings = {
    general: {
      storeName: 'Fieldwork Supply',
      contactEmail: 'hello@fieldwork.example',
      phone: '+1 416 555 0142',
      currency: 'USD',
      timezone: 'America/Toronto',
      weightUnit: 'kg',
      orderPrefix: '#',
    },
    shipping: {
      zones: [
        {
          id: 'zone-na',
          name: 'North America',
          countries: ['Canada', 'United States'],
          rates: [
            { id: 'rate-std', name: 'Standard', price: 8.5, freeOver: 100 },
            { id: 'rate-exp', name: 'Express', price: 19, freeOver: null },
          ],
        },
        {
          id: 'zone-eu',
          name: 'Europe',
          countries: ['Germany', 'Netherlands', 'Portugal', 'Spain', 'United Kingdom'],
          rates: [{ id: 'rate-eu', name: 'International', price: 24, freeOver: 250 }],
        },
      ],
    },
    taxes: {
      pricesIncludeTax: false,
      chargeOnShipping: true,
      rates: [
        { id: 'tax-on', region: 'Ontario', rate: 13 },
        { id: 'tax-tx', region: 'Texas', rate: 8.25 },
        { id: 'tax-eu', region: 'European Union', rate: 20 },
      ],
    },
    notifications: {
      staffEmail: 'orders@fieldwork.example',
      orderConfirmation: true,
      shippingUpdates: true,
      abandonedCart: false,
      lowStock: true,
      lowStockThreshold: 10,
      dailySummary: false,
    },
  };

  return { notes, returns, settings };
}

let backOfficeStore: ReturnType<typeof buildBackOffice> | null = null;
const backOffice = () => (backOfficeStore ??= buildBackOffice());

const methodOf = (o: Order): PaymentMethod =>
  o.channel === 'pos'
    ? 'in_person'
    : o.paymentMethod.brand === 'Apple Pay'
      ? 'apple_pay'
      : o.channel === 'social'
        ? 'paypal'
        : 'card';

/** Ledger derived from orders on every read, so refunds show up immediately. */
const transactions = () =>
  db().orders.flatMap((o) => {
    const method = methodOf(o);
    const status =
      o.status === 'cancelled' ? 'failed' : o.payment === 'pending' ? 'pending' : 'succeeded';
    const base = {
      orderId: o.id,
      orderNumber: o.number,
      customerName: o.customerName,
      method,
      card: method === 'card' ? `${o.paymentMethod.brand} •••• ${o.paymentMethod.last4}` : null,
    };
    const charge = {
      ...base,
      id: `txn-${o.id.slice(4)}`,
      type: 'charge' as const,
      status,
      amount: o.total,
      fee:
        status === 'succeeded' ? money(o.total * (method === 'paypal' ? 0.0349 : 0.029) + 0.3) : 0,
      createdAt: o.createdAt + 60_000,
    };
    if (!o.refunded) return [charge];
    const refundedAt = o.events.find((e) => e.type === 'refund')?.at ?? o.createdAt + 4 * DAY;
    return [
      {
        ...base,
        id: `${charge.id}-r`,
        type: 'refund' as const,
        status: 'succeeded' as const,
        amount: -o.refunded,
        fee: 0,
        createdAt: refundedAt,
      },
      charge,
    ];
  });

const PAYOUT_DELAY = 2;
const daysAgo = (at: number) => Math.max(0, Math.floor((NOW - at) / DAY));

const payouts = () => {
  const net = new Map<number, { amount: number; count: number }>();
  for (const t of transactions()) {
    if (t.status !== 'succeeded') continue;
    const bucket = net.get(daysAgo(t.createdAt)) ?? { amount: 0, count: 0 };
    net.set(daysAgo(t.createdAt), {
      amount: bucket.amount + t.amount - t.fee,
      count: bucket.count + 1,
    });
  }
  return Array.from({ length: 14 }, (_, d) => {
    const arrivesAt = NOW - (d - PAYOUT_DELAY) * DAY;
    const { amount = 0, count = 0 } = net.get(d) ?? {};
    return {
      id: `po-${(NOW / DAY - d).toFixed(0)}`,
      amount: money(amount),
      transactions: count,
      arrivesAt,
      status: arrivesAt <= NOW ? 'paid' : d === 0 ? 'scheduled' : 'in_transit',
    };
  });
};

const RETURN_STATUSES = ['requested', 'approved', 'rejected', 'refunded'] as const;
const NEXT_RETURN_STATUS: Record<ReturnStatus, ReturnStatus[]> = {
  requested: ['approved', 'rejected'],
  approved: ['refunded', 'rejected'],
  rejected: [],
  refunded: [],
};
type Settings = ReturnType<typeof buildBackOffice>['settings'];

const backOfficeHandlers: HttpHandler[] = [
  http.get(`${E}/transactions`, async ({ request }) => {
    const denied = await guard(request);
    if (denied) return denied;
    const p = new URL(request.url).searchParams;
    const statuses = (p.get('status') ?? '').split(',').filter(Boolean);
    const methods = (p.get('method') ?? '').split(',').filter(Boolean);
    const page = Math.max(1, Number(p.get('page') ?? 1));
    const pageSize = 15;
    const all = transactions();
    const rows = all.filter(
      (t) =>
        (!statuses.length || statuses.includes(t.status)) &&
        (!methods.length || methods.includes(t.method)),
    );
    const settled = all.filter((t) => t.status === 'succeeded');
    const sum = (list: typeof all, pickValue: (t: (typeof all)[number]) => number) =>
      money(list.reduce((s, t) => s + pickValue(t), 0));
    const daily = Array.from({ length: 30 }, (_, i) => {
      const d = 29 - i;
      const day = settled.filter((t) => daysAgo(t.createdAt) === d);
      return {
        day: new Date(NOW - d * DAY).toISOString().slice(0, 10),
        gross: sum(day, (t) => Math.max(0, t.amount)),
        net: sum(day, (t) => t.amount - t.fee),
      };
    });
    return HttpResponse.json({
      data: rows.slice((page - 1) * pageSize, page * pageSize),
      meta: {
        page,
        total: rows.length,
        totalPages: Math.max(1, Math.ceil(rows.length / pageSize)),
      },
      summary: {
        gross: sum(settled, (t) => Math.max(0, t.amount)),
        refunds: sum(settled, (t) => Math.max(0, -t.amount)),
        fees: sum(settled, (t) => t.fee),
        net: sum(settled, (t) => t.amount - t.fee),
      },
      daily,
    });
  }),

  http.get(`${E}/payouts`, async ({ request }) => {
    const denied = await guard(request);
    if (denied) return denied;
    const list = payouts();
    const upcoming = list.filter((p) => p.status !== 'paid');
    return HttpResponse.json({
      schedule: { interval: 'daily', delayDays: PAYOUT_DELAY },
      account: { bank: 'First Pacific Bank', last4: '6021' },
      pending: money(upcoming.reduce((s, p) => s + p.amount, 0)),
      next: upcoming.at(-1) ?? null,
      payouts: list,
    });
  }),

  http.get(`${E}/returns`, async ({ request }) => {
    const denied = await guard(request);
    if (denied) return denied;
    const status = new URL(request.url).searchParams.get('status') ?? 'all';
    const all = backOffice().returns;
    const reasons = Object.keys(RETURN_COMMENTS).map((reason) => ({
      reason,
      count: all.filter((r) => r.reason === reason).length,
    }));
    return HttpResponse.json({
      data: all.filter((r) => status === 'all' || r.status === status),
      counts: Object.fromEntries([
        ['all', all.length],
        ...RETURN_STATUSES.map((s) => [s, all.filter((r) => r.status === s).length]),
      ]),
      reasons,
      refunded: money(all.filter((r) => r.status === 'refunded').reduce((s, r) => s + r.amount, 0)),
    });
  }),

  http.patch<{ id: string }, { status: ReturnStatus }>(
    `${E}/returns/:id`,
    async ({ request, params }) => {
      const denied = await guard(request);
      if (denied) return denied;
      const ret = backOffice().returns.find((r) => r.id === params.id);
      if (!ret) return notFound();
      const { status } = await request.json();
      if (!NEXT_RETURN_STATUS[ret.status].includes(status))
        return HttpResponse.json(
          { message: `Cannot move a ${ret.status} return to ${status}` },
          { status: 409 },
        );
      if (status === 'refunded')
        applyRefund(
          db().orders.find((o) => o.id === ret.orderId)!,
          ret.amount,
          `Return ${ret.number}`,
        );
      ret.status = status;
      return HttpResponse.json(ret);
    },
  ),

  http.get(`${E}/settings`, async ({ request }) => {
    const denied = await guard(request);
    if (denied) return denied;
    return HttpResponse.json(backOffice().settings);
  }),

  http.put<{ section: string }, Settings[keyof Settings]>(
    `${E}/settings/:section`,
    async ({ request, params }) => {
      const denied = await guard(request);
      if (denied) return denied;
      const { settings } = backOffice();
      if (!(params.section in settings)) return notFound();
      Object.assign(settings, { [params.section]: await request.json() });
      return HttpResponse.json(settings);
    },
  ),
];

const storeHandlers: HttpHandler[] = [
  http.get(`${E}/orders`, async ({ request }) => {
    const denied = await guard(request);
    if (denied) return denied;
    const p = new URL(request.url).searchParams;
    const page = Math.max(1, Number(p.get('page') ?? 1));
    const pageSize = Math.min(100, Math.max(5, Number(p.get('pageSize') ?? 20)));
    const status = p.get('status') ?? 'all';
    const q = (p.get('q') ?? '').toLowerCase().trim();
    const channels = (p.get('channel') ?? '').split(',').filter(Boolean);
    const payments = (p.get('payment') ?? '').split(',').filter(Boolean);
    const [sortField = 'createdAt', sortDir = 'desc'] = (p.get('sort') || 'createdAt:desc').split(
      ':',
    );

    const base = db().orders.filter(
      (o) =>
        (!q ||
          o.number.includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerEmail.includes(q)) &&
        (!channels.length || channels.includes(o.channel)) &&
        (!payments.length || payments.includes(o.payment)),
    );
    const counts = Object.fromEntries(
      ORDER_TABS.map((tab) => [
        tab,
        tab === 'all' ? base.length : base.filter((o) => o.status === tab).length,
      ]),
    );
    const rows = base.filter((o) => status === 'all' || o.status === status);
    const key = sortField as keyof Order;
    rows.sort((a, b) => {
      const av = a[key] as string | number;
      const bv = b[key] as string | number;
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    const total = rows.length;
    return HttpResponse.json({
      data: rows.slice((page - 1) * pageSize, page * pageSize).map(orderSummary),
      meta: { page, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
      counts,
    });
  }),

  http.patch<never, { ids: string[]; status: OrderStatus }>(`${E}/orders`, async ({ request }) => {
    const denied = await guard(request);
    if (denied) return denied;
    const { ids, status } = await request.json();
    for (const o of db().orders) {
      if (!ids.includes(o.id) || o.status === status) continue;
      o.status = status;
      const type =
        status === 'shipped'
          ? 'shipped'
          : status === 'delivered'
            ? 'delivered'
            : status === 'cancelled'
              ? 'cancelled'
              : 'note';
      o.events.unshift({
        id: `e-${Date.now()}-${o.id}`,
        type,
        at: Date.now(),
        text: `Marked as ${status}`,
        author: 'Demo User',
      });
      if (status === 'shipped' && !o.carrier) {
        o.carrier = 'UPS';
        o.tracking = `1Z${Date.now().toString().slice(-10)}`;
      }
    }
    return HttpResponse.json({ updated: ids.length });
  }),

  http.get<{ id: string }>(`${E}/orders/:id`, async ({ request, params }) => {
    const denied = await guard(request);
    if (denied) return denied;
    const order = db().orders.find((o) => o.id === params.id);
    if (!order) return notFound();
    const customer = db().customers.find((c) => c.id === order.customerId)!;
    return HttpResponse.json({
      ...order,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        orders: customer.orders,
        spent: customer.spent,
        segment: customer.segment,
        joinedAt: customer.joinedAt,
      },
    });
  }),

  http.post<{ id: string }, { amount: number; reason: string; restock: boolean }>(
    `${E}/orders/:id/refund`,
    async ({ request, params }) => {
      const denied = await guard(request);
      if (denied) return denied;
      const order = db().orders.find((o) => o.id === params.id);
      if (!order) return notFound();
      const { amount, reason } = await request.json();
      if (!applyRefund(order, amount, reason))
        return HttpResponse.json({ message: 'Nothing left to refund' }, { status: 422 });
      return HttpResponse.json({ ok: true });
    },
  ),

  http.post<{ id: string }, { text: string }>(
    `${E}/orders/:id/notes`,
    async ({ request, params }) => {
      const denied = await guard(request);
      if (denied) return denied;
      const order = db().orders.find((o) => o.id === params.id);
      if (!order) return notFound();
      const { text } = await request.json();
      order.events.unshift({
        id: `e-${Date.now()}`,
        type: 'note',
        at: Date.now(),
        text,
        author: 'Demo User',
      });
      return HttpResponse.json({ ok: true });
    },
  ),

  http.get(`${E}/products`, async ({ request }) => {
    const denied = await guard(request);
    if (denied) return denied;
    const cats = categoryCounts();
    return HttpResponse.json({ data: db().products.map(productSummary), categories: cats });
  }),

  http.get<{ id: string }>(`${E}/products/:id`, async ({ request, params }) => {
    const denied = await guard(request);
    if (denied) return denied;
    const product = db().products.find((p) => p.id === params.id);
    if (!product) return notFound();
    return HttpResponse.json({ ...product, categories: categoryCounts() });
  }),

  http.put<{ id: string }, Partial<Product>>(`${E}/products/:id`, async ({ request, params }) => {
    const denied = await guard(request);
    if (denied) return denied;
    const product = db().products.find((p) => p.id === params.id);
    if (!product) return notFound();
    const body = await request.json();
    Object.assign(product, body, { updatedAt: Date.now() });
    product.stock = product.variants.reduce((s, v) => s + v.stock, 0);
    return HttpResponse.json({ ...product, categories: categoryCounts() });
  }),

  http.get(`${E}/categories`, async ({ request }) => {
    const denied = await guard(request);
    if (denied) return denied;
    return HttpResponse.json(categoryCounts());
  }),

  http.patch<{ id: string }, { direction?: 'up' | 'down'; visible?: boolean }>(
    `${E}/categories/:id`,
    async ({ request, params }) => {
      const denied = await guard(request);
      if (denied) return denied;
      const { categories } = db();
      const cat = categories.find((c) => c.id === params.id);
      if (!cat) return notFound();
      const body = await request.json();
      if (body.visible !== undefined) cat.visible = body.visible;
      if (body.direction) {
        const siblings = categories
          .filter((c) => c.parentId === cat.parentId)
          .sort((a, b) => a.position - b.position);
        const index = siblings.indexOf(cat);
        const other = siblings[body.direction === 'up' ? index - 1 : index + 1];
        if (other) [cat.position, other.position] = [other.position, cat.position];
      }
      return HttpResponse.json(categoryCounts());
    },
  ),

  http.get(`${E}/customers`, async ({ request }) => {
    const denied = await guard(request);
    if (denied) return denied;
    const p = new URL(request.url).searchParams;
    const q = (p.get('q') ?? '').toLowerCase();
    const segment = p.get('segment') ?? 'all';
    const base = db().customers.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.includes(q) ||
        c.city.toLowerCase().includes(q),
    );
    const segments = { all: base.length, vip: 0, repeat: 0, new: 0, at_risk: 0 } as Record<
      string,
      number
    >;
    for (const c of base) segments[c.segment]! += 1;
    return HttpResponse.json({
      data: base
        .filter((c) => segment === 'all' || c.segment === segment)
        .sort((a, b) => b.lastOrderAt - a.lastOrderAt),
      segments,
    });
  }),

  http.get<{ id: string }>(`${E}/customers/:id`, async ({ request, params }) => {
    const denied = await guard(request);
    if (denied) return denied;
    const customer = db().customers.find((c) => c.id === params.id);
    if (!customer) return notFound();
    const orders = db().orders.filter((o) => o.customerId === customer.id);
    return HttpResponse.json({
      ...customer,
      history: orders.map(orderSummary),
      addresses: addressesOf(customer),
      notes: backOffice().notes[customer.id] ?? [],
    });
  }),

  http.post<{ id: string }, { text: string }>(
    `${E}/customers/:id/notes`,
    async ({ request, params }) => {
      const denied = await guard(request);
      if (denied) return denied;
      if (!db().customers.some((c) => c.id === params.id)) return notFound();
      const { text } = await request.json();
      const notes = (backOffice().notes[params.id] ??= []);
      notes.unshift({ id: `note-${Date.now()}`, text, author: 'Demo User', at: Date.now() });
      return HttpResponse.json(notes[0], { status: 201 });
    },
  ),

  http.get(`${E}/reviews`, async ({ request }) => {
    const denied = await guard(request);
    if (denied) return denied;
    const status = new URL(request.url).searchParams.get('status') ?? 'pending';
    const all = db().reviews;
    return HttpResponse.json({
      data: all.filter((r) => status === 'all' || r.status === status),
      counts: {
        all: all.length,
        pending: all.filter((r) => r.status === 'pending').length,
        approved: all.filter((r) => r.status === 'approved').length,
        rejected: all.filter((r) => r.status === 'rejected').length,
      },
      average: money(
        all
          .filter((r) => r.status === 'approved')
          .reduce((s, r, _, a) => s + r.rating / a.length, 0),
      ),
      distribution: [5, 4, 3, 2, 1].map((stars) => ({
        stars,
        count: all.filter((r) => r.rating === stars).length,
      })),
    });
  }),

  http.patch<{ id: string }, { status: Review['status'] }>(
    `${E}/reviews/:id`,
    async ({ request, params }) => {
      const denied = await guard(request);
      if (denied) return denied;
      const review = db().reviews.find((r) => r.id === params.id);
      if (!review) return notFound();
      review.status = (await request.json()).status;
      return HttpResponse.json(review);
    },
  ),

  http.get(`${E}/discounts`, async ({ request }) => {
    const denied = await guard(request);
    if (denied) return denied;
    return HttpResponse.json(db().discounts);
  }),

  http.post<never, Omit<Discount, 'id' | 'used' | 'status'>>(
    `${E}/discounts`,
    async ({ request }) => {
      const denied = await guard(request);
      if (denied) return denied;
      const body = await request.json();
      if (db().discounts.some((d) => d.code === body.code.toUpperCase())) {
        return HttpResponse.json(
          { message: `Code ${body.code.toUpperCase()} already exists` },
          { status: 409 },
        );
      }
      const discount: Discount = {
        ...body,
        code: body.code.toUpperCase(),
        id: `disc-${Date.now()}`,
        used: 0,
        status: body.startsAt > Date.now() ? 'scheduled' : 'active',
      };
      db().discounts.unshift(discount);
      return HttpResponse.json(discount, { status: 201 });
    },
  ),

  http.patch<{ id: string }, { status: Discount['status'] }>(
    `${E}/discounts/:id`,
    async ({ request, params }) => {
      const denied = await guard(request);
      if (denied) return denied;
      const discount = db().discounts.find((d) => d.id === params.id);
      if (!discount) return notFound();
      discount.status = (await request.json()).status;
      if (discount.status === 'expired') discount.endsAt = Date.now();
      return HttpResponse.json(discount);
    },
  ),
];

export const ecommerceHandlers: HttpHandler[] = [
  ...overviewHandlers,
  ...storeHandlers,
  ...backOfficeHandlers,
  ...ecommerceGiftCardHandlers,
  ...ecommerceCartHandlers,
  ...ecommerceReportHandlers,
];
