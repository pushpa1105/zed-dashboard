import { http, HttpResponse, type HttpHandler } from 'msw';

import { DAY, db, E, guard, money, notFound, NOW, pick, seeded, sum } from './ecommerce-store';

type GiftCardStatus = 'active' | 'redeemed' | 'expired' | 'disabled';
type GiftCard = {
  id: string;
  code: string;
  initialValue: number;
  balance: number;
  status: GiftCardStatus;
  recipientName: string;
  recipientEmail: string;
  source: 'purchase' | 'staff';
  issuedAt: number;
  expiresAt: number | null;
  lastUsedAt: number | null;
  note: string;
  redemptions: Array<{
    id: string;
    orderId: string;
    orderNumber: string;
    amount: number;
    at: number;
  }>;
};

const STATUSES = ['active', 'redeemed', 'expired', 'disabled'] as const;
const CODE_CHARS = [...'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'];
const NOTES = {
  purchase: [
    'Happy birthday! Treat yourself.',
    'Congrats on the new place!',
    'Thank you for everything.',
  ],
  staff: ['Apology for a delayed shipment', 'Giveaway winner', 'Loyalty reward'],
};

const giftCode = (rand: () => number) =>
  Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => pick(rand, CODE_CHARS)).join(''),
  ).join('-');

const statusOf = (card: Pick<GiftCard, 'balance' | 'expiresAt'>): GiftCardStatus =>
  card.balance <= 0 ? 'redeemed' : card.expiresAt && card.expiresAt < NOW ? 'expired' : 'active';

/** Redemptions are real orders placed after the card was issued, newest first. */
function buildGiftCards(): GiftCard[] {
  const rand = seeded('ecommerce:gift-cards');
  const { customers, orders } = db();
  return Array.from({ length: 56 }, (_, i) => {
    const recipient = customers[(i * 13) % customers.length]!;
    const issuedAt = NOW - Math.floor(i * 6 + rand() * 5) * DAY;
    const initialValue = pick(rand, [25, 50, 50, 100, 100, 150, 250]);
    const source = rand() > 0.25 ? 'purchase' : 'staff';
    const later = orders.filter((o) => o.createdAt > issuedAt);
    const uses = later.length ? Math.floor(rand() * 4) : 0;
    let balance = initialValue;
    const redemptions = Array.from({ length: uses }, (_, u) => {
      const order = pick(rand, later);
      const drain = u === uses - 1 && rand() > 0.5;
      const amount = drain ? balance : money(balance * (0.2 + rand() * 0.5));
      balance = money(balance - amount);
      return {
        id: `gcr-${i}-${u}`,
        orderId: order.id,
        orderNumber: order.number,
        amount,
        at: order.createdAt,
      };
    }).sort((a, b) => b.at - a.at);
    const card = {
      id: `gc-${(i + 1).toString().padStart(3, '0')}`,
      code: giftCode(rand),
      initialValue,
      balance,
      recipientName: recipient.name,
      recipientEmail: recipient.email,
      source,
      issuedAt,
      expiresAt: rand() > 0.4 ? issuedAt + 365 * DAY : null,
      lastUsedAt: redemptions[0]?.at ?? null,
      note: pick(rand, NOTES[source]),
      redemptions,
    } satisfies Omit<GiftCard, 'status'>;
    return { ...card, status: i % 11 === 5 && balance > 0 ? 'disabled' : statusOf(card) };
  });
}

let giftCardStore: GiftCard[] | null = null;
const giftCards = () => (giftCardStore ??= buildGiftCards());

const monthKey = (at: number) => new Date(at).toISOString().slice(0, 7);
const lastMonths = (n: number) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date(NOW);
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() - n + 1 + i);
    return monthKey(d.getTime());
  });

export const ecommerceGiftCardHandlers: HttpHandler[] = [
  http.get(`${E}/gift-cards`, async ({ request }) => {
    const denied = await guard(request);
    if (denied) return denied;
    const p = new URL(request.url).searchParams;
    const status = p.get('status') ?? 'all';
    const q = (p.get('q') ?? '').toLowerCase().replace(/-/g, '').trim();
    const all = giftCards();
    const base = all.filter(
      (c) =>
        !q ||
        c.code.toLowerCase().replace(/-/g, '').includes(q) ||
        c.recipientName.toLowerCase().includes(q) ||
        c.recipientEmail.includes(q),
    );
    const redemptions = all.flatMap((c) => c.redemptions);
    const active = all.filter((c) => c.status === 'active');
    return HttpResponse.json({
      data: base
        .filter((c) => status === 'all' || c.status === status)
        .map(({ redemptions: _r, note: _n, ...card }) => card),
      counts: Object.fromEntries([
        ['all', base.length],
        ...STATUSES.map((s) => [s, base.filter((c) => c.status === s).length]),
      ]),
      summary: {
        outstanding: sum(active, (c) => c.balance),
        issued: sum(all, (c) => c.initialValue),
        redeemed: sum(redemptions, (r) => r.amount),
        active: active.length,
      },
      monthly: lastMonths(12).map((month) => ({
        month,
        issued: sum(
          all.filter((c) => monthKey(c.issuedAt) === month),
          (c) => c.initialValue,
        ),
        redeemed: sum(
          redemptions.filter((r) => monthKey(r.at) === month),
          (r) => r.amount,
        ),
      })),
    });
  }),

  http.get<{ id: string }>(`${E}/gift-cards/:id`, async ({ request, params }) => {
    const denied = await guard(request);
    if (denied) return denied;
    const card = giftCards().find((c) => c.id === params.id);
    return card ? HttpResponse.json(card) : notFound();
  }),

  http.post<
    never,
    { recipientName: string; recipientEmail: string; value: number; expiry: string; note: string }
  >(`${E}/gift-cards`, async ({ request }) => {
    const denied = await guard(request);
    if (denied) return denied;
    const { value, expiry, ...body } = await request.json();
    const issuedAt = Date.now();
    const card: GiftCard = {
      ...body,
      id: `gc-${issuedAt}`,
      code: giftCode(seeded(String(issuedAt))),
      initialValue: value,
      balance: value,
      status: 'active',
      source: 'staff',
      issuedAt,
      expiresAt: expiry === 'never' ? null : issuedAt + Number(expiry) * 30 * DAY,
      lastUsedAt: null,
      redemptions: [],
    };
    giftCards().unshift(card);
    return HttpResponse.json(card, { status: 201 });
  }),

  http.patch<{ id: string }, { status: 'active' | 'disabled' }>(
    `${E}/gift-cards/:id`,
    async ({ request, params }) => {
      const denied = await guard(request);
      if (denied) return denied;
      const card = giftCards().find((c) => c.id === params.id);
      if (!card) return notFound();
      const { status } = await request.json();
      const from = status === 'disabled' ? 'active' : 'disabled';
      if (card.status !== from)
        return HttpResponse.json(
          { message: `Cannot change a ${card.status} card to ${status}` },
          { status: 409 },
        );
      card.status = status === 'disabled' ? 'disabled' : statusOf(card);
      return HttpResponse.json(card);
    },
  ),
];
