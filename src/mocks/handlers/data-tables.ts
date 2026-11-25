import { http, HttpResponse, type HttpHandler } from 'msw';

import { env } from '@/core/config/env';

import { errorResponse, networkDelay, requireAuth } from '../utils';

/**
 * Mock API for the "data-tables" feature: a deterministic set of 5,000
 * orders with real server-side search, faceted filters, an advanced filter
 * tree, multi-column sorting and pagination. Mutations live in memory and
 * reset on reload.
 */

type MockOrder = {
  id: string;
  number: string;
  customerName: string;
  customerEmail: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  channel: 'web' | 'mobile' | 'marketplace' | 'retail';
  country: string;
  items: number;
  total: number;
  paid: boolean;
  createdAt: string;
  assignee: string | null;
};

const FIRST = [
  'Hannah',
  'Megan',
  'Lucas',
  'Amara',
  'Noah',
  'Priya',
  'Mateo',
  'Yuki',
  'Elena',
  'Omar',
  'Chloe',
  'Kofi',
  'Sofia',
  'Liam',
  'Ines',
  'Arjun',
  'Freya',
  'Diego',
  'Mei',
  'Jonas',
];
const LAST = [
  'Morgan',
  'Clark',
  'Silva',
  'Okafor',
  'Becker',
  'Sharma',
  'Rossi',
  'Tanaka',
  'Novak',
  'Haddad',
  'Dubois',
  'Mensah',
  'Garcia',
  'Walsh',
  'Moreau',
  'Patel',
  'Larsen',
  'Ortiz',
  'Chen',
  'Weber',
];
const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Germany',
  'France',
  'Spain',
  'Japan',
  'Brazil',
  'India',
  'Canada',
  'Australia',
  'Netherlands',
  'Nepal',
];
const ASSIGNEES = ['Ava Brooks', 'Ben Carter', 'Nina Park', 'Sam Rivera', 'Zoe Kim'];
const STATUSES: MockOrder['status'][] = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];
const STATUS_WEIGHTS = [0.12, 0.16, 0.2, 0.42, 0.06, 0.04];
const CHANNELS: MockOrder['channel'][] = ['web', 'mobile', 'marketplace', 'retail'];

/** Small seeded PRNG so every reload produces the same orders. */
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedOrders(count: number): MockOrder[] {
  const rand = mulberry32(20261124);
  const pick = <T>(list: T[]) => list[Math.floor(rand() * list.length)]!;
  const weighted = () => {
    let r = rand();
    for (let i = 0; i < STATUSES.length; i++) {
      r -= STATUS_WEIGHTS[i]!;
      if (r <= 0) return STATUSES[i]!;
    }
    return 'delivered';
  };
  const now = Date.UTC(2026, 10, 24);
  return Array.from({ length: count }, (_, i) => {
    const first = pick(FIRST);
    const last = pick(LAST);
    const items = 1 + Math.floor(rand() ** 2 * 9);
    const status = weighted();
    return {
      id: `ord_${(i + 1).toString(36).padStart(5, '0')}`,
      number: `#${(100_001 + i).toString()}`,
      customerName: `${first} ${last}`,
      customerEmail: `${first}.${last}${i % 7 === 0 ? i : ''}@example.com`.toLowerCase(),
      status,
      channel: pick(CHANNELS),
      country: pick(COUNTRIES),
      items,
      total: Math.round((items * (12 + rand() * 140) + rand() * 30) * 100) / 100,
      paid: status !== 'pending' && status !== 'cancelled' ? true : rand() > 0.6,
      createdAt: new Date(now - Math.floor(rand() * 365 * 24 * 3600 * 1000)).toISOString(),
      assignee: rand() > 0.18 ? pick(ASSIGNEES) : null,
    };
  });
}

let orders = seedOrders(5000);

/* -------------------------------- filtering ------------------------------- */

type Rule = { kind: 'rule'; field: string; operator: string; value: unknown };
type Group = { kind: 'group'; combinator: 'and' | 'or'; rules: Array<Rule | Group> };

const FIELD_TYPES: Record<string, 'text' | 'number' | 'date' | 'enum'> = {
  number: 'text',
  customerName: 'text',
  customerEmail: 'text',
  assignee: 'text',
  total: 'number',
  items: 'number',
  createdAt: 'date',
  status: 'enum',
  channel: 'enum',
  country: 'enum',
};

function matchRule(order: MockOrder, rule: Rule): boolean {
  const type = FIELD_TYPES[rule.field];
  const raw = order[rule.field as keyof MockOrder];
  const { operator, value } = rule;
  if (type === 'text') {
    const text = String(raw ?? '').toLowerCase();
    const q = String(value ?? '').toLowerCase();
    if (operator === 'isEmpty') return text === '';
    if (operator === 'isNotEmpty') return text !== '';
    if (operator === 'equals') return text === q;
    if (operator === 'startsWith') return text.startsWith(q);
    if (operator === 'endsWith') return text.endsWith(q);
    return text.includes(q);
  }
  if (type === 'number') {
    const n = Number(raw);
    if (operator === 'between') {
      const [a, b] = (value as unknown[]).map(Number);
      return n >= a! && n <= b!;
    }
    const t = Number(value);
    return operator === 'neq'
      ? n !== t
      : operator === 'gt'
        ? n > t
        : operator === 'lt'
          ? n < t
          : n === t;
  }
  if (type === 'date') {
    const d = String(raw).slice(0, 10);
    if (operator === 'between') {
      const [a, b] = (value as unknown[]).map((v) => String(v).slice(0, 10));
      return d >= a! && d <= b!;
    }
    return operator === 'before' ? d < String(value) : d > String(value);
  }
  if (type === 'enum') {
    const hit = (value as unknown[]).map(String).includes(String(raw));
    return operator === 'isNoneOf' ? !hit : hit;
  }
  return true;
}

function matchGroup(order: MockOrder, group: Group): boolean {
  if (!group.rules.length) return true;
  const results = group.rules.map((node) =>
    node.kind === 'group' ? matchGroup(order, node) : matchRule(order, node),
  );
  return group.combinator === 'or' ? results.some(Boolean) : results.every(Boolean);
}

function parseTree(raw: string | null): Group | null {
  if (!raw) return null;
  try {
    const tree = JSON.parse(raw) as Group;
    return tree && tree.kind === 'group' ? tree : null;
  } catch {
    return null;
  }
}

const csv = (value: string | null) => (value ? value.split(',').filter(Boolean) : []);

/** Applies every filter except `skip` (so facet counts ignore their own filter). */
function filterOrders(params: URLSearchParams, skip?: 'status' | 'channel') {
  const q = params.get('q')?.trim().toLowerCase() ?? '';
  const status = skip === 'status' ? [] : csv(params.get('status'));
  const channel = skip === 'channel' ? [] : csv(params.get('channel'));
  const from = params.get('from');
  const to = params.get('to');
  const min = params.get('min');
  const max = params.get('max');
  const tree = parseTree(params.get('filters'));

  return orders.filter((o) => {
    if (q && !`${o.number} ${o.customerName} ${o.customerEmail}`.toLowerCase().includes(q))
      return false;
    if (status.length && !status.includes(o.status)) return false;
    if (channel.length && !channel.includes(o.channel)) return false;
    const day = o.createdAt.slice(0, 10);
    if (from && day < from) return false;
    if (to && day > to) return false;
    if (min && o.total < Number(min)) return false;
    if (max && o.total > Number(max)) return false;
    if (tree && !matchGroup(o, tree)) return false;
    return true;
  });
}

const count = (list: MockOrder[], key: 'status' | 'channel') =>
  list.reduce<Record<string, number>>((acc, o) => {
    acc[o[key]] = (acc[o[key]] ?? 0) + 1;
    return acc;
  }, {});

function sortOrders(list: MockOrder[], sort: string | null) {
  const keys = csv(sort)
    .map((part) => part.split(':') as [keyof MockOrder, string])
    .filter(([field]) => field in (orders[0] ?? {}));
  if (!keys.length) return list;
  return [...list].sort((a, b) => {
    for (const [field, dir] of keys) {
      const av = a[field] ?? '';
      const bv = b[field] ?? '';
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv));
      if (cmp !== 0) return dir === 'desc' ? -cmp : cmp;
    }
    return 0;
  });
}

/* --------------------------------- handlers ------------------------------- */

const url = `${env.API_URL}/tables/orders`;

export const dataTablesHandlers: HttpHandler[] = [
  http.get(url, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;

    const params = new URL(request.url).searchParams;
    const page = Math.max(1, Number(params.get('page')) || 1);
    const pageSize = Math.min(200, Math.max(1, Number(params.get('pageSize')) || 20));
    const filtered = sortOrders(filterOrders(params), params.get('sort'));
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

    return HttpResponse.json({
      data: filtered.slice((page - 1) * pageSize, page * pageSize),
      meta: { page, total: filtered.length, totalPages },
      facets: {
        status: count(filterOrders(params, 'status'), 'status'),
        channel: count(filterOrders(params, 'channel'), 'channel'),
      },
    });
  }),

  http.patch<never, { ids: string[]; status: MockOrder['status'] }>(url, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;

    const { ids, status } = await request.json();
    if (!Array.isArray(ids) || !STATUSES.includes(status))
      return errorResponse('Invalid request', 422);
    const set = new Set(ids);
    orders = orders.map((o) =>
      set.has(o.id) ? { ...o, status, paid: o.paid || status !== 'cancelled' } : o,
    );
    return HttpResponse.json({ updated: ids.length });
  }),

  http.post<never, { ids: string[] }>(`${url}/delete`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;

    const { ids } = await request.json();
    if (!Array.isArray(ids)) return errorResponse('Invalid request', 422);
    const set = new Set(ids);
    orders = orders.filter((o) => !set.has(o.id));
    return HttpResponse.json({ deleted: ids.length });
  }),
];

/* -------------------------------------------------------------------------- */
/*  Activity log for the infinite-scroll example (cursor pagination)           */
/* -------------------------------------------------------------------------- */

type MockEvent = {
  id: string;
  at: string;
  actor: string;
  action: 'created' | 'updated' | 'deleted' | 'exported' | 'signed_in' | 'invited';
  resource: string;
  ip: string;
  severity: 'info' | 'warning' | 'critical';
};

const EVENT_ACTORS = [
  'Hannah Morgan',
  'Ivan Serhin',
  'Mia Chen',
  'Raj Patel',
  'api-token: ci-deploy',
  'Lena Duarte',
];
const EVENT_ACTIONS: MockEvent['action'][] = [
  'created',
  'updated',
  'updated',
  'deleted',
  'exported',
  'signed_in',
  'invited',
];
const EVENT_RESOURCES = [
  'Dashboard “Revenue”',
  'Report “Q4 pipeline”',
  'API key ****9f2a',
  'Workspace settings',
  'User ines@northwind.io',
  'Webhook /orders',
  'Billing plan',
];

const events: MockEvent[] = (() => {
  const rand = mulberry32(2026);
  // Newest first: each event happens 1.5–11.5 minutes before the previous one.
  let at = Date.UTC(2026, 10, 24, 18, 0);
  return Array.from({ length: 2000 }, (_, i) => {
    at -= 90_000 + Math.floor(rand() * 600_000);
    const action = EVENT_ACTIONS[Math.floor(rand() * EVENT_ACTIONS.length)]!;
    return {
      id: `evt_${(100000 + i).toString(36)}`,
      at: new Date(at).toISOString(),
      actor: EVENT_ACTORS[Math.floor(rand() * EVENT_ACTORS.length)]!,
      action,
      resource: EVENT_RESOURCES[Math.floor(rand() * EVENT_RESOURCES.length)]!,
      ip: `10.${Math.floor(rand() * 255)}.${Math.floor(rand() * 255)}.${Math.floor(rand() * 255)}`,
      severity: action === 'deleted' ? 'critical' : action === 'exported' ? 'warning' : 'info',
    };
  });
})();

dataTablesHandlers.push(
  http.get(`${env.API_URL}/tables/activity`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;

    const params = new URL(request.url).searchParams;
    const cursor = Number(params.get('cursor') ?? 0) || 0;
    const limit = Math.min(200, Number(params.get('limit') ?? 50) || 50);
    const q = (params.get('q') ?? '').toLowerCase();
    const severity = params.get('severity');
    const list = events.filter(
      (e) =>
        (!q || `${e.actor} ${e.resource} ${e.action}`.toLowerCase().includes(q)) &&
        (!severity || e.severity === severity),
    );
    const items = list.slice(cursor, cursor + limit);
    const next = cursor + limit;
    return HttpResponse.json({
      items,
      nextCursor: next < list.length ? next : null,
      total: list.length,
    });
  }),
);
