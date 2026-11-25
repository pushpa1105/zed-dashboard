import { http, HttpResponse, type HttpHandler } from 'msw';

import { DAY, db, E, guard, money, NOW, sum, type Order } from './ecommerce-store';

const PERIOD_DAYS: Record<string, number> = { '7d': 7, '30d': 30, '60d': 60 };
const CHANNELS = ['online', 'pos', 'marketplace', 'social'] as const;

const delta = (current: number, previous: number) =>
  previous ? money(((current - previous) / previous) * 100) : 0;

const totals = (orders: Order[]) => {
  const revenue = sum(orders, (o) => o.total - o.refunded);
  return {
    revenue,
    orders: orders.length,
    units: orders.reduce((s, o) => s + o.items.reduce((n, it) => n + it.qty, 0), 0),
    aov: orders.length ? money(revenue / orders.length) : 0,
  };
};

/** Groups order lines by `keyOf`, summing units, revenue and the number of orders. */
const byLine = (orders: Order[], keyOf: (productId: string) => string) => {
  const rows = new Map<string, { units: number; revenue: number; orders: Set<string> }>();
  for (const o of orders)
    for (const it of o.items) {
      const key = keyOf(it.productId);
      const row = rows.get(key) ?? { units: 0, revenue: 0, orders: new Set<string>() };
      row.units += it.qty;
      row.revenue = money(row.revenue + it.price * it.qty);
      row.orders.add(o.id);
      rows.set(key, row);
    }
  return [...rows].sort(([, a], [, b]) => b.revenue - a.revenue);
};

/** Sales derived from the live orders, so refunds and status changes show up immediately. */
export const ecommerceReportHandlers: HttpHandler[] = [
  http.get(`${E}/reports/sales`, async ({ request }) => {
    const denied = await guard(request);
    if (denied) return denied;
    const p = new URL(request.url).searchParams;
    const days = PERIOD_DAYS[p.get('period') ?? ''] ?? 30;
    const channels = (p.get('channel') ?? '').split(',').filter(Boolean);
    const { orders, products, categories } = db();
    const between = (fromDay: number, toDay: number) =>
      orders.filter(
        (o) =>
          o.status !== 'cancelled' &&
          o.createdAt > NOW - fromDay * DAY &&
          o.createdAt <= NOW - toDay * DAY &&
          (!channels.length || channels.includes(o.channel)),
      );
    const current = between(days, 0);
    const now = totals(current);
    const before = totals(between(days * 2, days));
    const product = (id: string) => products.find((pr) => pr.id === id)!;
    const topCategory = (id: string) => {
      const category = categories.find((c) => c.id === product(id).categoryId)!;
      return categories.find((c) => c.id === (category.parentId ?? category.id))!;
    };

    return HttpResponse.json({
      summary: Object.fromEntries(
        (['revenue', 'orders', 'units', 'aov'] as const).map((key) => [
          key,
          { value: now[key], delta: delta(now[key], before[key]) },
        ]),
      ),
      daily: Array.from({ length: days }, (_, i) => {
        const start = NOW - (days - i) * DAY;
        const day = current.filter((o) => o.createdAt > start && o.createdAt <= start + DAY);
        return {
          day: new Date(start + DAY).toISOString().slice(0, 10),
          ...Object.fromEntries(
            CHANNELS.map((ch) => [
              ch,
              sum(
                day.filter((o) => o.channel === ch),
                (o) => o.total - o.refunded,
              ),
            ]),
          ),
        };
      }),
      channels: CHANNELS.map((channel) => {
        const list = current.filter((o) => o.channel === channel);
        return { channel, revenue: totals(list).revenue, orders: list.length };
      }).filter((c) => c.orders),
      categories: byLine(current, (id) => topCategory(id).id).map(([id, row]) => ({
        id,
        name: categories.find((c) => c.id === id)!.name,
        revenue: row.revenue,
        units: row.units,
      })),
      products: byLine(current, (id) => id).map(([id, row]) => ({
        id,
        name: product(id).name,
        category: topCategory(id).name,
        hue: product(id).hue,
        units: row.units,
        orders: row.orders.size,
        revenue: row.revenue,
      })),
    });
  }),
];
