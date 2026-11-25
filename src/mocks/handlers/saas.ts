import { http, HttpResponse, type HttpHandler } from 'msw';

import { env } from '@/core/config/env';

import { errorResponse, networkDelay, requireAuth } from '../utils';

import { saasAdminHandlers } from './saas-admin';
import { saasIntegrationHandlers } from './saas-integrations';
import { saasRoleHandlers } from './saas-roles';
import { saasSupportHandlers } from './saas-support';

function seeded(seed: string) {
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

const RANGES = { '6h': 13, '24h': 24, '7d': 14 } as const;
type Range = keyof typeof RANGES;

/** Integration switches persist for the session (in memory). */
const integrations = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'Post deploy and error alerts to #ops',
    category: 'Messaging',
    enabled: true,
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Link commits and pull requests to releases',
    category: 'Source control',
    enabled: true,
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Sync invoices and usage-based billing',
    category: 'Billing',
    enabled: false,
  },
  {
    id: 'datadog',
    name: 'Datadog',
    description: 'Forward API latency metrics',
    category: 'Monitoring',
    enabled: false,
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Trigger workflows from webhooks',
    category: 'Automation',
    enabled: true,
  },
];

const ACTIVITY = [
  [
    'James Anderson',
    'called',
    'Books-API',
    'Readily available with proper documentation — just a webhook away from the app.',
  ],
  [
    'Victor Sam',
    'rotated a key for',
    'Payments-API',
    'Old key revoked; staging and production updated.',
  ],
  [
    'Nether Stone',
    'deployed',
    'Search-API v2.4.1',
    'Cold-start latency down 18% after the cache change.',
  ],
  [
    'Jeff Sussex',
    'raised the rate limit on',
    'Webhooks',
    'Temporary bump for the partner migration this week.',
  ],
  [
    'Amara Diallo',
    'commented on',
    'Books-API',
    'Can we version the /authors endpoint before Friday?',
  ],
] as const;

const overviewHandlers: HttpHandler[] = [
  http.get(`${env.API_URL}/dashboards/saas/overview`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;

    const param = new URL(request.url).searchParams.get('range') ?? '6h';
    const range: Range = param in RANGES ? (param as Range) : '6h';
    const rand = seeded(`saas:${range}`);
    const steps = RANGES[range];
    // Anchored to the current time so relative timestamps stay fresh.
    const now = Math.floor(Date.now() / 60_000) * 60_000;
    const stepMs = range === '6h' ? 30 * 60_000 : range === '24h' ? 3_600_000 : 12 * 3_600_000;

    let level = 3_000 + rand() * 1_500;
    const apiCalls = Array.from({ length: steps }, (_, i) => {
      level = Math.max(900, level + (rand() - 0.42) * 1_900);
      const calls = Math.round(level * (range === '7d' ? 9 : 1));
      return {
        at: now - (steps - 1 - i) * stepMs,
        calls,
        errors: Math.round(calls * (0.004 + rand() * 0.02)),
      };
    });

    const totalCalls = apiCalls.reduce((sum, p) => sum + p.calls, 0);

    return HttpResponse.json({
      stats: {
        projects: 3,
        projectsMax: 5,
        requests: totalCalls,
        requestsDelta: Math.round((rand() * 30 - 8) * 10) / 10,
        users: 3,
        usersMax: 5,
        storageUsedGb: 128,
        storageMaxGb: 500,
      },
      apiCalls,
      latencyP95: Math.round(120 + rand() * 90),
      errorRate:
        Math.round((apiCalls.reduce((s, p) => s + p.errors, 0) / totalCalls) * 10_000) / 100,
      pnl: [
        { key: 'reused', label: 'Re-used APIs', value: 18_420 },
        { key: 'webhooks', label: 'Webhooks', value: 19_380 },
        { key: 'calls', label: 'API calls', value: 12_760 },
      ],
      profitGrowth: 25,
      plan: {
        name: 'Teams',
        price: 99,
        renewsAt: Date.now() + 22 * 86_400_000,
        limits: [
          { key: 'projects', label: 'Projects', value: 3, max: 5 },
          { key: 'users', label: 'Seats', value: 3, max: 5 },
          { key: 'requests', label: 'Requests / day', value: 7_500, max: 10_000 },
          { key: 'storage', label: 'Storage (GB)', value: 128, max: 500 },
        ],
      },
      activity: ACTIVITY.map(([name, action, target, comment], i) => ({
        id: `act-${i}`,
        name,
        action,
        target,
        comment,
        at: now - (i * 47 + 6) * 60_000,
      })),
      integrations,
    });
  }),

  http.patch<{ id: string }, { enabled: boolean }>(
    `${env.API_URL}/dashboards/saas/integrations/:id`,
    async ({ request, params }) => {
      await networkDelay();
      const auth = requireAuth(request);
      if ('error' in auth) return auth.error;

      const integration = integrations.find((i) => i.id === params.id);
      if (!integration) return errorResponse('Integration not found', 404);
      const { enabled } = await request.json();
      integration.enabled = Boolean(enabled);
      return HttpResponse.json(integration);
    },
  ),
];

/* -------------------------------------------------------------------------- */
/*  Developer platform: keys, usage, logs, webhooks, billing, team, settings.  */
/* -------------------------------------------------------------------------- */

const S = `${env.API_URL}/saas`;
const MIN = 60_000;
const HOUR = 3_600_000;
const DAYMS = 86_400_000;
const pickOne = <T>(rand: () => number, list: readonly T[]) =>
  list[Math.floor(rand() * list.length)]!;

const guardSaas = async (request: Request) => {
  await networkDelay();
  const auth = requireAuth(request);
  return 'error' in auth ? auth.error : null;
};

const randomSecret = (length: number) =>
  Array.from(
    { length },
    () => 'abcdefghijkmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 35)],
  ).join('');

type ApiKey = {
  id: string;
  name: string;
  prefix: string;
  env: 'live' | 'test';
  scopes: string[];
  createdAt: number;
  lastUsedAt: number | null;
  createdBy: string;
  status: 'active' | 'revoked';
};
type Member = {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'developer' | 'billing' | 'viewer';
  lastActiveAt: number;
  mfa: boolean;
};
type Invite = {
  id: string;
  email: string;
  role: Member['role'];
  sentAt: number;
  invitedBy: string;
};
type Webhook = {
  id: string;
  url: string;
  description: string;
  events: string[];
  status: 'enabled' | 'disabled';
  successRate: number;
  lastDeliveryAt: number;
  secretPrefix: string;
};
type Delivery = {
  id: string;
  webhookId: string;
  event: string;
  status: 'succeeded' | 'failed' | 'retrying';
  httpStatus: number | null;
  duration: number;
  at: number;
  attempt: number;
  payload: string;
};

const ENDPOINTS: Array<[string, string, number]> = [
  ['GET', '/v1/books', 42],
  ['GET', '/v1/books/:id', 18],
  ['POST', '/v1/books', 96],
  ['GET', '/v1/authors', 35],
  ['POST', '/v1/payments', 210],
  ['GET', '/v1/search', 140],
  ['PATCH', '/v1/books/:id', 74],
  ['DELETE', '/v1/books/:id', 51],
  ['POST', '/v1/webhooks/test', 88],
];
const EVENTS = [
  'book.created',
  'book.updated',
  'payment.succeeded',
  'payment.failed',
  'author.created',
  'invoice.paid',
];

function buildPlatform() {
  const rand = seeded('saas:platform');
  const now = Date.now();
  const keys: ApiKey[] = [
    {
      id: 'key-1',
      name: 'Production backend',
      prefix: 'sk_live_4f9a',
      env: 'live',
      scopes: ['read', 'write'],
      createdAt: now - 210 * DAYMS,
      lastUsedAt: now - 2 * MIN,
      createdBy: 'James Anderson',
      status: 'active',
    },
    {
      id: 'key-2',
      name: 'Payments worker',
      prefix: 'sk_live_9c21',
      env: 'live',
      scopes: ['read', 'write', 'payments'],
      createdAt: now - 96 * DAYMS,
      lastUsedAt: now - 11 * MIN,
      createdBy: 'Amara Diallo',
      status: 'active',
    },
    {
      id: 'key-3',
      name: 'Analytics export (read-only)',
      prefix: 'sk_live_b07e',
      env: 'live',
      scopes: ['read'],
      createdAt: now - 40 * DAYMS,
      lastUsedAt: now - 5 * HOUR,
      createdBy: 'Victor Sam',
      status: 'active',
    },
    {
      id: 'key-4',
      name: 'Local development',
      prefix: 'sk_test_51d3',
      env: 'test',
      scopes: ['read', 'write', 'admin'],
      createdAt: now - 12 * DAYMS,
      lastUsedAt: now - 26 * HOUR,
      createdBy: 'Demo User',
      status: 'active',
    },
    {
      id: 'key-5',
      name: 'CI pipeline',
      prefix: 'sk_test_e8a0',
      env: 'test',
      scopes: ['read', 'write'],
      createdAt: now - 66 * DAYMS,
      lastUsedAt: now - 3 * DAYMS,
      createdBy: 'Jeff Sussex',
      status: 'active',
    },
    {
      id: 'key-6',
      name: 'Old mobile app',
      prefix: 'sk_live_02fd',
      env: 'live',
      scopes: ['read'],
      createdAt: now - 400 * DAYMS,
      lastUsedAt: now - 120 * DAYMS,
      createdBy: 'Nether Stone',
      status: 'revoked',
    },
  ];

  const LEVELS = ['info', 'info', 'info', 'info', 'info', 'warn', 'error', 'debug'] as const;
  const REGIONS = ['iad1', 'fra1', 'sfo1', 'sin1'];
  const logs = Array.from({ length: 320 }, (_, i) => {
    const [method, path, base] = ENDPOINTS[Math.floor(rand() * ENDPOINTS.length)]!;
    let level: (typeof LEVELS)[number] = pickOne(rand, LEVELS);
    const status =
      level === 'error'
        ? pickOne(rand, [500, 502, 504])
        : level === 'warn'
          ? pickOne(rand, [401, 404, 422, 429])
          : method === 'POST'
            ? 201
            : 200;
    if (status >= 500) level = 'error';
    const duration = Math.round(base * (0.5 + rand() * 1.8) + (level === 'error' ? 900 : 0));
    const requestId = `req_${Math.floor(rand() * 1e12).toString(36)}`;
    const message =
      level === 'error'
        ? pickOne(rand, [
            'Upstream timeout from payments provider',
            'Database connection pool exhausted',
            'Unhandled exception in serializer',
          ])
        : level === 'warn'
          ? status === 429
            ? 'Rate limit exceeded for key sk_live_4f9a'
            : status === 401
              ? 'Invalid or expired API key'
              : 'Request validation failed'
          : level === 'debug'
            ? `Cache ${rand() > 0.5 ? 'hit' : 'miss'} for ${path}`
            : `${method} ${path} ${status} in ${duration}ms`;
    return {
      id: `log-${i}`,
      at: now - i * 23_000 - Math.floor(rand() * 20_000),
      level,
      method,
      path: path.replace(':id', `bk_${Math.floor(rand() * 9000 + 1000)}`),
      status,
      duration,
      region: pickOne(rand, REGIONS),
      requestId,
      message,
      payload: JSON.stringify(
        {
          requestId,
          method,
          path,
          status,
          durationMs: duration,
          key: pickOne(rand, ['sk_live_4f9a', 'sk_live_9c21', 'sk_test_51d3']),
          ip: `203.0.113.${Math.floor(rand() * 254)}`,
          userAgent: pickOne(rand, [
            'node-fetch/3.3',
            'python-requests/2.32',
            'Go-http-client/2.0',
          ]),
          ...(level === 'error' ? { error: { code: 'upstream_timeout', retryable: true } } : {}),
        },
        null,
        2,
      ),
    };
  });

  const webhooks: Webhook[] = [
    {
      id: 'wh-1',
      url: 'https://api.northwind.dev/hooks/books',
      description: 'Sync catalog to search index',
      events: ['book.created', 'book.updated'],
      status: 'enabled',
      successRate: 99.6,
      lastDeliveryAt: now - 3 * MIN,
      secretPrefix: 'whsec_7Hq',
    },
    {
      id: 'wh-2',
      url: 'https://billing.acme.io/webhooks/payments',
      description: 'Payments ledger',
      events: ['payment.succeeded', 'payment.failed', 'invoice.paid'],
      status: 'enabled',
      successRate: 92.4,
      lastDeliveryAt: now - 9 * MIN,
      secretPrefix: 'whsec_k2P',
    },
    {
      id: 'wh-3',
      url: 'https://hooks.slack.com/services/T01/B02/XyZ',
      description: 'Alerts to #api-alerts',
      events: ['payment.failed'],
      status: 'enabled',
      successRate: 100,
      lastDeliveryAt: now - 2 * HOUR,
      secretPrefix: 'whsec_9Lm',
    },
    {
      id: 'wh-4',
      url: 'https://staging.northwind.dev/hooks/all',
      description: 'Staging mirror',
      events: EVENTS,
      status: 'disabled',
      successRate: 61.2,
      lastDeliveryAt: now - 6 * DAYMS,
      secretPrefix: 'whsec_Q0a',
    },
  ];
  const deliveries: Delivery[] = webhooks.flatMap((wh) =>
    Array.from({ length: 14 }, (_, i) => {
      const failed = rand() * 100 > wh.successRate;
      const event = pickOne(rand, wh.events);
      return {
        id: `dl-${wh.id}-${i}`,
        webhookId: wh.id,
        event,
        status: failed ? (i < 2 ? 'retrying' : 'failed') : 'succeeded',
        httpStatus: failed ? pickOne(rand, [500, 503, null]) : 200,
        duration: Math.round(80 + rand() * 600),
        at: wh.lastDeliveryAt - i * 17 * MIN,
        attempt: failed ? 1 + Math.floor(rand() * 4) : 1,
        payload: JSON.stringify(
          {
            id: `evt_${Math.floor(rand() * 1e10).toString(36)}`,
            type: event,
            created: Math.floor((wh.lastDeliveryAt - i * 17 * MIN) / 1000),
            data: { object: { id: `bk_${1000 + i}` } },
          },
          null,
          2,
        ),
      } satisfies Delivery;
    }),
  );

  const members: Member[] = [
    {
      id: 'm-1',
      name: 'Demo User',
      email: 'demo@example.com',
      role: 'owner',
      lastActiveAt: now - MIN,
      mfa: true,
    },
    {
      id: 'm-2',
      name: 'James Anderson',
      email: 'james@northwind.dev',
      role: 'admin',
      lastActiveAt: now - 7 * MIN,
      mfa: true,
    },
    {
      id: 'm-3',
      name: 'Amara Diallo',
      email: 'amara@northwind.dev',
      role: 'developer',
      lastActiveAt: now - 3 * HOUR,
      mfa: true,
    },
    {
      id: 'm-4',
      name: 'Victor Sam',
      email: 'victor@northwind.dev',
      role: 'developer',
      lastActiveAt: now - 26 * HOUR,
      mfa: false,
    },
    {
      id: 'm-5',
      name: 'Nether Stone',
      email: 'nether@northwind.dev',
      role: 'viewer',
      lastActiveAt: now - 9 * DAYMS,
      mfa: false,
    },
    {
      id: 'm-6',
      name: 'Jeff Sussex',
      email: 'jeff@northwind.dev',
      role: 'billing',
      lastActiveAt: now - 2 * DAYMS,
      mfa: true,
    },
  ];
  const invites: Invite[] = [
    {
      id: 'inv-1',
      email: 'priya@northwind.dev',
      role: 'developer',
      sentAt: now - 2 * DAYMS,
      invitedBy: 'James Anderson',
    },
    {
      id: 'inv-2',
      email: 'contractor@studio-ink.com',
      role: 'viewer',
      sentAt: now - 6 * DAYMS,
      invitedBy: 'Demo User',
    },
  ];

  const plans = [
    {
      id: 'hobby',
      name: 'Hobby',
      price: 0,
      requests: 100_000,
      seats: 1,
      storage: 5,
      features: ['100k requests / month', '1 seat', 'Community support'],
    },
    {
      id: 'teams',
      name: 'Teams',
      price: 99,
      requests: 10_000_000,
      seats: 5,
      storage: 500,
      features: ['10M requests / month', '5 seats', 'Webhooks & logs (7 days)', 'Email support'],
    },
    {
      id: 'scale',
      name: 'Scale',
      price: 399,
      requests: 50_000_000,
      seats: 20,
      storage: 2_000,
      features: [
        '50M requests / month',
        '20 seats',
        'Logs retention 30 days',
        'SSO & audit log',
        '99.95% SLA',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: -1,
      requests: 0,
      seats: 0,
      storage: 0,
      features: ['Custom volume', 'Unlimited seats', 'Dedicated region', 'Named support engineer'],
    },
  ];
  const billing = {
    planId: 'teams',
    renewsAt: now + 22 * DAYMS,
    paymentMethod: { brand: 'Visa', last4: '4242', exp: '08/28', name: 'Northwind Labs Ltd.' },
    invoices: Array.from({ length: 8 }, (_, i) => ({
      id: `in-${i}`,
      number: `NW-${(2026_10 - i).toString().slice(-4)}-${(48 - i).toString().padStart(3, '0')}`,
      date: now - (i + 0.2) * 30 * DAYMS,
      amount: i === 0 ? 99 + 37.4 : 99 + Math.round(rand() * 6000) / 100,
      status: i === 0 ? ('open' as const) : i === 5 ? ('void' as const) : ('paid' as const),
    })),
  };

  const settings = {
    workspaceName: 'Northwind Labs',
    slug: 'northwind',
    region: 'iad1',
    timezone: 'America/New_York',
    ipAllowlist: ['203.0.113.0/24', '198.51.100.14'],
    requireMfa: false,
    sessionTimeout: 720,
    notifications: { usageAlerts: true, weeklyDigest: true, incidents: true, productNews: false },
  };

  return { keys, logs, webhooks, deliveries, members, invites, plans, billing, settings };
}

let platform: ReturnType<typeof buildPlatform> | null = null;
const pdb = () => (platform ??= buildPlatform());

const platformHandlers: HttpHandler[] = [
  http.get(`${S}/keys`, async ({ request }) => {
    const denied = await guardSaas(request);
    if (denied) return denied;
    return HttpResponse.json(pdb().keys);
  }),
  http.post<never, { name: string; env: 'live' | 'test'; scopes: string[] }>(
    `${S}/keys`,
    async ({ request }) => {
      const denied = await guardSaas(request);
      if (denied) return denied;
      const body = await request.json();
      const secret = `sk_${body.env}_${randomSecret(32)}`;
      const key: ApiKey = {
        id: `key-${Date.now()}`,
        name: body.name,
        prefix: secret.slice(0, 12),
        env: body.env,
        scopes: body.scopes,
        createdAt: Date.now(),
        lastUsedAt: null,
        createdBy: 'Demo User',
        status: 'active',
      };
      pdb().keys.unshift(key);
      return HttpResponse.json({ ...key, secret }, { status: 201 });
    },
  ),
  http.delete<{ id: string }>(`${S}/keys/:id`, async ({ request, params }) => {
    const denied = await guardSaas(request);
    if (denied) return denied;
    const key = pdb().keys.find((k) => k.id === params.id);
    if (!key) return errorResponse('Key not found', 404);
    key.status = 'revoked';
    return HttpResponse.json(key);
  }),

  http.get(`${S}/usage`, async ({ request }) => {
    const denied = await guardSaas(request);
    if (denied) return denied;
    const range = new URL(request.url).searchParams.get('range') === '30d' ? 30 : 14;
    const rand = seeded(`saas:usage:${range}`);
    const today = Math.floor(Date.now() / DAYMS) * DAYMS;
    const byDay = Array.from({ length: range }, (_, i) => {
      const weekend = new Date(today - (range - 1 - i) * DAYMS).getUTCDay() % 6 === 0;
      const f = weekend ? 0.55 : 1;
      return {
        day: today - (range - 1 - i) * DAYMS,
        read: Math.round((180_000 + rand() * 90_000) * f),
        write: Math.round((46_000 + rand() * 30_000) * f),
        admin: Math.round((3_000 + rand() * 4_000) * f),
      };
    });
    const total = byDay.reduce((s, d) => s + d.read + d.write + d.admin, 0);
    const endpoints = ENDPOINTS.map(([method, path, base]) => {
      const calls = Math.round(total * (0.02 + rand() * 0.2));
      return {
        method,
        path,
        calls,
        p50: Math.round(base * (0.6 + rand() * 0.3)),
        p95: Math.round(base * (1.8 + rand() * 1.4)),
        errorRate: Math.round(rand() ** 3 * 400) / 100,
        trend: Array.from({ length: 12 }, () => Math.round(40 + rand() * 60)),
      };
    }).sort((a, b) => b.calls - a.calls);
    return HttpResponse.json({
      byDay,
      endpoints,
      totals: { calls: total, quota: 10_000_000, errors: Math.round(total * 0.0123), p95: 205 },
    });
  }),

  http.get(`${S}/logs`, async ({ request }) => {
    const denied = await guardSaas(request);
    if (denied) return denied;
    const p = new URL(request.url).searchParams;
    const levels = (p.get('levels') ?? '').split(',').filter(Boolean);
    const q = (p.get('q') ?? '').toLowerCase();
    const cursor = Number(p.get('cursor') ?? 0);
    const rows = pdb().logs.filter(
      (l) =>
        (!levels.length || levels.includes(l.level)) &&
        (!q || `${l.message} ${l.path} ${l.requestId} ${l.status}`.toLowerCase().includes(q)),
    );
    const page = rows.slice(cursor, cursor + 50);
    const counts = Object.fromEntries(
      ['error', 'warn', 'info', 'debug'].map((lvl) => [
        lvl,
        pdb().logs.filter((l) => l.level === lvl).length,
      ]),
    );
    return HttpResponse.json({
      data: page,
      nextCursor: cursor + 50 < rows.length ? cursor + 50 : null,
      total: rows.length,
      counts,
    });
  }),

  http.get(`${S}/webhooks`, async ({ request }) => {
    const denied = await guardSaas(request);
    if (denied) return denied;
    return HttpResponse.json(pdb().webhooks);
  }),
  http.get<{ id: string }>(`${S}/webhooks/:id/deliveries`, async ({ request, params }) => {
    const denied = await guardSaas(request);
    if (denied) return denied;
    return HttpResponse.json(
      pdb()
        .deliveries.filter((d) => d.webhookId === params.id)
        .sort((a, b) => b.at - a.at),
    );
  }),
  http.patch<{ id: string }, { status: Webhook['status'] }>(
    `${S}/webhooks/:id`,
    async ({ request, params }) => {
      const denied = await guardSaas(request);
      if (denied) return denied;
      const hook = pdb().webhooks.find((w) => w.id === params.id);
      if (!hook) return errorResponse('Webhook not found', 404);
      hook.status = (await request.json()).status;
      return HttpResponse.json(hook);
    },
  ),
  http.post<{ id: string }>(`${S}/webhooks/:id/test`, async ({ request, params }) => {
    const denied = await guardSaas(request);
    if (denied) return denied;
    const hook = pdb().webhooks.find((w) => w.id === params.id);
    if (!hook) return errorResponse('Webhook not found', 404);
    const ok = hook.status === 'enabled';
    const delivery: Delivery = {
      id: `dl-test-${Date.now()}`,
      webhookId: hook.id,
      event: 'ping',
      status: ok ? 'succeeded' : 'failed',
      httpStatus: ok ? 200 : null,
      duration: 143,
      at: Date.now(),
      attempt: 1,
      payload: JSON.stringify({ type: 'ping', created: Math.floor(Date.now() / 1000) }, null, 2),
    };
    pdb().deliveries.unshift(delivery);
    hook.lastDeliveryAt = delivery.at;
    return HttpResponse.json(delivery);
  }),

  http.get(`${S}/billing`, async ({ request }) => {
    const denied = await guardSaas(request);
    if (denied) return denied;
    const { billing, plans, members } = pdb();
    const plan = plans.find((p) => p.id === billing.planId)!;
    return HttpResponse.json({
      ...billing,
      plans,
      usage: {
        requests: { used: 7_512_340, limit: plan.requests },
        seats: { used: members.length, limit: plan.seats },
        storage: { used: 128, limit: plan.storage },
      },
    });
  }),
  http.post<never, { planId: string }>(`${S}/billing/plan`, async ({ request }) => {
    const denied = await guardSaas(request);
    if (denied) return denied;
    const { planId } = await request.json();
    if (!pdb().plans.some((p) => p.id === planId && p.price >= 0))
      return errorResponse('Contact sales for this plan', 422);
    pdb().billing.planId = planId;
    return HttpResponse.json({ ok: true });
  }),

  http.get(`${S}/team`, async ({ request }) => {
    const denied = await guardSaas(request);
    if (denied) return denied;
    return HttpResponse.json({ members: pdb().members, invites: pdb().invites });
  }),
  http.patch<{ id: string }, { role: Member['role'] }>(
    `${S}/team/members/:id`,
    async ({ request, params }) => {
      const denied = await guardSaas(request);
      if (denied) return denied;
      const member = pdb().members.find((m) => m.id === params.id);
      if (!member) return errorResponse('Member not found', 404);
      if (member.role === 'owner')
        return errorResponse('Transfer ownership before changing the owner role', 422);
      member.role = (await request.json()).role;
      return HttpResponse.json(member);
    },
  ),
  http.delete<{ id: string }>(`${S}/team/members/:id`, async ({ request, params }) => {
    const denied = await guardSaas(request);
    if (denied) return denied;
    const db = pdb();
    const member = db.members.find((m) => m.id === params.id);
    if (member?.role === 'owner') return errorResponse('The owner cannot be removed', 422);
    db.members = db.members.filter((m) => m.id !== params.id);
    return HttpResponse.json({ ok: true });
  }),
  http.post<never, { emails: string[]; role: Member['role'] }>(
    `${S}/team/invites`,
    async ({ request }) => {
      const denied = await guardSaas(request);
      if (denied) return denied;
      const { emails, role } = await request.json();
      const db = pdb();
      for (const email of emails) {
        if (db.members.some((m) => m.email === email) || db.invites.some((i) => i.email === email))
          continue;
        db.invites.unshift({
          id: `inv-${Date.now()}-${email}`,
          email,
          role,
          sentAt: Date.now(),
          invitedBy: 'Demo User',
        });
      }
      return HttpResponse.json({ ok: true }, { status: 201 });
    },
  ),
  http.delete<{ id: string }>(`${S}/team/invites/:id`, async ({ request, params }) => {
    const denied = await guardSaas(request);
    if (denied) return denied;
    pdb().invites = pdb().invites.filter((i) => i.id !== params.id);
    return HttpResponse.json({ ok: true });
  }),

  http.get(`${S}/settings`, async ({ request }) => {
    const denied = await guardSaas(request);
    if (denied) return denied;
    return HttpResponse.json(pdb().settings);
  }),
  http.put<never, ReturnType<typeof buildPlatform>['settings']>(
    `${S}/settings`,
    async ({ request }) => {
      const denied = await guardSaas(request);
      if (denied) return denied;
      const body = await request.json();
      if (body.slug === 'taken') return errorResponse('That URL is already in use', 409);
      Object.assign(pdb().settings, body);
      return HttpResponse.json(pdb().settings);
    },
  ),
];

export const saasHandlers: HttpHandler[] = [
  ...overviewHandlers,
  ...platformHandlers,
  ...saasAdminHandlers,
  ...saasIntegrationHandlers,
  ...saasRoleHandlers,
  ...saasSupportHandlers,
];
