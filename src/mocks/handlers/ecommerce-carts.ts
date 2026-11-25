import { http, HttpResponse, type HttpHandler } from 'msw';

import { DAY, db, E, guard, money, NOW, pick, seeded, sum } from './ecommerce-store';

type Cart = {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    productId: string;
    name: string;
    variant: string;
    qty: number;
    price: number;
    hue: number;
  }>;
  value: number;
  lastSeenAt: number;
  checkoutStep: 'cart' | 'shipping' | 'payment';
  recovery: 'not_sent' | 'sent' | 'recovered';
  emailSentAt: number | null;
  recoveredAt: number | null;
};

const HOUR = 3_600_000;
const WEEKS = 8;
const PAGE_SIZE = 10;
const RECOVERY = ['not_sent', 'sent', 'recovered'] as const;

/** One cart every ~11 hours over the last eight weeks; the newest are too fresh to email. */
function buildCarts(): Cart[] {
  const rand = seeded('ecommerce:carts');
  const { customers, products } = db();
  return Array.from({ length: 120 }, (_, i) => {
    const customer = pick(rand, customers);
    const items = Array.from({ length: 1 + Math.floor(rand() ** 2 * 3) }, () => {
      const p = pick(rand, products);
      return {
        productId: p.id,
        name: p.name,
        variant: pick(rand, p.variants).title,
        qty: 1 + Math.floor(rand() ** 3 * 2),
        price: p.price,
        hue: p.hue,
      };
    });
    const lastSeenAt = NOW - i * 11 * HOUR - Math.floor(rand() * HOUR);
    const roll = rand();
    const recovery: Cart['recovery'] =
      NOW - lastSeenAt < 12 * HOUR || roll > 0.75 ? 'not_sent' : roll < 0.22 ? 'recovered' : 'sent';
    const emailSentAt = recovery === 'not_sent' ? null : lastSeenAt + 4 * HOUR;
    return {
      id: `cart-${(i + 1).toString().padStart(3, '0')}`,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      items,
      value: sum(items, (it) => it.price * it.qty),
      lastSeenAt,
      checkoutStep: pick(rand, ['cart', 'cart', 'shipping', 'payment'] as const),
      recovery,
      emailSentAt,
      recoveredAt:
        emailSentAt && recovery === 'recovered'
          ? Math.min(NOW, emailSentAt + Math.floor(rand() * 2 * DAY))
          : null,
    };
  });
}

let cartStore: Cart[] | null = null;
const carts = () => (cartStore ??= buildCarts());

const weekly = (all: Cart[]) =>
  Array.from({ length: WEEKS }, (_, w) => {
    const from = NOW - (WEEKS - w) * 7 * DAY;
    const week = all.filter((c) => c.lastSeenAt >= from && c.lastSeenAt < from + 7 * DAY);
    const recovered = week.filter((c) => c.recovery === 'recovered').length;
    return {
      week: new Date(from).toISOString().slice(0, 10),
      abandoned: week.length,
      recovered,
      rate: week.length ? money((recovered / week.length) * 100) : 0,
    };
  });

export const ecommerceCartHandlers: HttpHandler[] = [
  http.get(`${E}/abandoned-carts`, async ({ request }) => {
    const denied = await guard(request);
    if (denied) return denied;
    const p = new URL(request.url).searchParams;
    const status = p.get('status') ?? 'all';
    const page = Math.max(1, Number(p.get('page') ?? 1));
    const all = carts();
    const rows = all.filter((c) => status === 'all' || c.recovery === status);
    const recovered = all.filter((c) => c.recovery === 'recovered');
    return HttpResponse.json({
      data: rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      meta: {
        page,
        total: rows.length,
        totalPages: Math.max(1, Math.ceil(rows.length / PAGE_SIZE)),
      },
      counts: Object.fromEntries([
        ['all', all.length],
        ...RECOVERY.map((s) => [s, all.filter((c) => c.recovery === s).length]),
      ]),
      summary: {
        abandonedValue: sum(
          all.filter((c) => c.recovery !== 'recovered'),
          (c) => c.value,
        ),
        recoveredValue: sum(recovered, (c) => c.value),
        recoveryRate: money((recovered.length / all.length) * 100),
        pendingEmails: all.filter((c) => c.recovery === 'not_sent').length,
      },
      weekly: weekly(all),
    });
  }),

  http.post<never, { ids?: string[] }>(
    `${E}/abandoned-carts/recovery-emails`,
    async ({ request }) => {
      const denied = await guard(request);
      if (denied) return denied;
      const { ids } = await request.json();
      const targets = carts().filter(
        (c) => c.recovery === 'not_sent' && (!ids || ids.includes(c.id)),
      );
      for (const cart of targets)
        Object.assign(cart, { recovery: 'sent', emailSentAt: Date.now() });
      return HttpResponse.json({ sent: targets.length });
    },
  ),
];
