import { http, HttpResponse, type HttpHandler } from 'msw';

import { env } from '@/core/config/env';

import { errorResponse, networkDelay, requireAuth } from '../utils';

/* Customers, feature flags, audit log and status page of the SaaS workspace. */

export const S = `${env.API_URL}/saas`;
export const MIN = 60_000;
export const HOUR = 3_600_000;
export const DAY = 86_400_000;

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

export const guard = async (request: Request) => {
  await networkDelay();
  const auth = requireAuth(request);
  return 'error' in auth ? auth.error : null;
};

type Plan = 'hobby' | 'teams' | 'scale' | 'enterprise';
const PLAN_PRICE: Record<Plan, number> = { hobby: 0, teams: 99, scale: 399, enterprise: 2_400 };
const SEAT_PRICE = 12;
const mrrFor = (plan: Plan, seats: number) =>
  plan === 'hobby' ? 0 : PLAN_PRICE[plan] + seats * SEAT_PRICE;

const COMPANIES = [
  'Acme Robotics',
  'Globex',
  'Initech',
  'Umbrella Health',
  'Hooli',
  'Stark Logistics',
  'Wayne Analytics',
  'Wonka Foods',
  'Soylent Labs',
  'Cyberdyne',
  'Tyrell Systems',
  'Aperture',
  'Massive Dynamic',
  'Vandelay Imports',
  'Pied Piper',
  'Dunder Paper',
  'Oscorp',
  'Gringotts Pay',
  'Monarch Travel',
  'Nakatomi Trading',
  'Blue Sun',
  'Gekko Capital',
  'Sterling Cooper',
  'Prestige Media',
  'Bluth Homes',
  'Kramerica',
  'Los Pollos',
  'Duff Brewing',
  'Ollivanders',
  'Rekall',
  'Virtucon',
  'Weyland Mining',
];
const CONTACTS = [
  'Maya Chen',
  'Luis Ortega',
  'Priya Nair',
  'Tom Becker',
  'Sara Lind',
  'Kofi Mensah',
];
const PLANS: Plan[] = ['hobby', 'teams', 'teams', 'teams', 'scale', 'scale', 'enterprise'];

function buildAdmin() {
  const rand = seeded('saas:admin');
  const pick = <T>(list: readonly T[]) => list[Math.floor(rand() * list.length)]!;
  const now = Date.now();

  const customers = COMPANIES.map((name, i) => {
    const plan = pick(PLANS);
    const seats =
      plan === 'hobby' ? 1 : Math.round(3 + rand() * (plan === 'enterprise' ? 180 : 40));
    const health = Math.round(25 + rand() * 75);
    const trialing = plan !== 'hobby' && rand() < 0.15;
    const slug = name.toLowerCase().replace(/[^a-z]+/g, '');
    return {
      id: `cus_${(1000 + i * 37).toString(36)}`,
      name,
      domain: `${slug}.com`,
      contact: pick(CONTACTS),
      email: `billing@${slug}.com`,
      plan,
      status: trialing ? 'trialing' : rand() < 0.08 ? 'past_due' : 'active',
      mrr: mrrFor(plan, seats),
      seats,
      seatsUsed: Math.max(1, Math.round(seats * (0.4 + rand() * 0.6))),
      health,
      churnRisk: health < 45 ? 'high' : health < 70 ? 'medium' : 'low',
      region: pick(['iad1', 'fra1', 'sfo1', 'sin1']),
      createdAt: now - Math.round(30 + rand() * 900) * DAY,
      trialEndsAt: trialing ? now + Math.round(2 + rand() * 12) * DAY : null,
    };
  });

  const usage = (id: string) => {
    const r = seeded(`usage:${id}`);
    let level = 2_000 + r() * 40_000;
    return Array.from({ length: 30 }, (_, i) => {
      level = Math.max(200, level * (0.9 + r() * 0.22));
      return { day: now - (29 - i) * DAY, requests: Math.round(level) };
    });
  };

  const flags = [
    ['new-billing-page', 'Redesigned billing page with usage forecast', 'Priya Nair'],
    ['edge-cache-v2', 'Serve GET responses from the regional edge cache', 'Tom Becker'],
    ['ai-log-summaries', 'Summarise error bursts in the logs viewer', 'Maya Chen'],
    ['webhook-retries-backoff', 'Exponential backoff for failed webhook deliveries', 'Luis Ortega'],
    ['sso-enforcement', 'Allow admins to require SSO for every member', 'Sara Lind'],
    ['usage-alerts-slack', 'Send quota alerts to Slack', 'Kofi Mensah'],
    ['graphql-beta', 'Expose the GraphQL endpoint to beta accounts', 'Priya Nair'],
    ['dark-launch-search', 'Shadow traffic to the new search cluster', 'Tom Becker'],
  ].map(([key, description, owner], i) => {
    const stage = i % 4;
    return {
      id: `flag-${i + 1}`,
      key: key!,
      description: description!,
      owner: owner!,
      updatedAt: now - Math.round(rand() * 20 * DAY),
      environments: { development: stage >= 1, staging: stage >= 2, production: stage === 3 },
      rollout: stage === 3 ? pick([25, 50, 100, 100]) : 0,
      rules: [
        ...(i % 3 === 0 ? [{ attribute: 'plan', operator: 'in', value: 'scale, enterprise' }] : []),
        ...(i % 2 === 1
          ? [{ attribute: 'email', operator: 'endsWith', value: '@northwind.dev' }]
          : []),
        ...(i === 6 ? [{ attribute: 'accountAge', operator: 'gte', value: '90d' }] : []),
      ],
    };
  });

  const ACTIONS = [
    ['auth', 'user.login', 'info'],
    ['auth', 'user.login_failed', 'warning'],
    ['auth', 'user.mfa_disabled', 'critical'],
    ['api_keys', 'api_key.created', 'info'],
    ['api_keys', 'api_key.revoked', 'warning'],
    ['team', 'member.invited', 'info'],
    ['team', 'member.role_changed', 'warning'],
    ['team', 'member.removed', 'warning'],
    ['billing', 'plan.changed', 'info'],
    ['billing', 'payment_method.updated', 'info'],
    ['settings', 'ip_allowlist.updated', 'critical'],
    ['settings', 'sso.configured', 'warning'],
    ['flags', 'flag.toggled', 'info'],
  ] as const;
  const ACTORS = [
    ['James Anderson', 'james@northwind.dev'],
    ['Amara Diallo', 'amara@northwind.dev'],
    ['Victor Sam', 'victor@northwind.dev'],
    ['Demo User', 'demo@northwind.dev'],
  ];
  const audit = Array.from({ length: 140 }, (_, i) => {
    const [category, action, severity] = pick(ACTIONS);
    const [name, email] = pick(ACTORS);
    const ip = `${pick(['203.0.113', '198.51.100', '192.0.2'])}.${Math.floor(rand() * 254) + 1}`;
    const target =
      category === 'api_keys'
        ? `sk_live_${Math.floor(rand() * 0xffff).toString(16)}`
        : category === 'team'
          ? pick(ACTORS)[1]!
          : category === 'flags'
            ? pick(flags).key
            : category === 'billing'
              ? 'subscription'
              : category === 'auth'
                ? email!
                : 'workspace';
    const at = now - i * 47 * MIN - Math.floor(rand() * 40 * MIN);
    return {
      id: `evt_${(i + 1).toString().padStart(4, '0')}`,
      at,
      actor: { name: name!, email: email! },
      action,
      category,
      severity,
      target,
      ip,
      location: pick(['New York, US', 'Berlin, DE', 'Lisbon, PT', 'Singapore, SG']),
      payload: JSON.stringify(
        {
          id: `evt_${(i + 1).toString().padStart(4, '0')}`,
          type: action,
          occurred_at: new Date(at).toISOString(),
          actor: {
            email,
            ip,
            user_agent: pick(['Chrome 131 / macOS', 'Firefox 133 / Linux', 'cli/2.4.0']),
          },
          target: { id: target },
          context: {
            workspace: 'northwind',
            request_id: `req_${Math.floor(rand() * 1e12).toString(36)}`,
          },
        },
        null,
        2,
      ),
    };
  });

  const components = [
    ['api', 'REST API'],
    ['dashboard', 'Dashboard'],
    ['webhooks', 'Webhooks'],
    ['auth', 'Authentication'],
    ['edge', 'Edge network'],
    ['billing', 'Billing'],
  ].map(([id, name]) => {
    const days = Array.from({ length: 90 }, (_, i) => {
      const roll = rand();
      const downtime =
        roll > 0.985
          ? Math.round(30 + rand() * 120)
          : roll > 0.95
            ? Math.round(2 + rand() * 20)
            : 0;
      return { day: now - (89 - i) * DAY, downtime };
    });
    return { id: id!, name: name!, status: 'operational', days };
  });

  const incidents = [
    {
      id: 'inc-3',
      title: 'Elevated webhook delivery latency',
      impact: 'minor',
      status: 'monitoring',
      componentIds: ['webhooks'],
      startedAt: now - 3 * HOUR,
      resolvedAt: null,
      updates: [
        [
          'monitoring',
          'A fix is deployed. Delivery times are back to normal; we keep watching the queue.',
          40 * MIN,
        ],
        [
          'identified',
          'A noisy tenant saturated the fra1 delivery workers. We are rebalancing the queue.',
          2 * HOUR,
        ],
        ['investigating', 'Webhook deliveries are delayed by up to 6 minutes in Europe.', 3 * HOUR],
      ],
    },
    {
      id: 'inc-2',
      title: 'Dashboard login errors for SSO users',
      impact: 'major',
      status: 'resolved',
      componentIds: ['auth', 'dashboard'],
      startedAt: now - 9 * DAY,
      resolvedAt: now - 9 * DAY + 95 * MIN,
      updates: [
        [
          'resolved',
          'The expired IdP certificate was rotated and logins succeed again.',
          9 * DAY - 95 * MIN,
        ],
        ['investigating', 'Some SSO users see a 500 error after signing in.', 9 * DAY],
      ],
    },
    {
      id: 'inc-1',
      title: 'API outage in iad1',
      impact: 'critical',
      status: 'resolved',
      componentIds: ['api', 'edge'],
      startedAt: now - 41 * DAY,
      resolvedAt: now - 41 * DAY + 38 * MIN,
      updates: [
        [
          'resolved',
          'Traffic was failed over to sfo1 and the primary database recovered.',
          41 * DAY - 38 * MIN,
        ],
        [
          'identified',
          'The primary database in iad1 lost its storage volume.',
          41 * DAY - 12 * MIN,
        ],
        ['investigating', 'API requests to iad1 return 503.', 41 * DAY],
      ],
    },
  ].map(({ updates, ...incident }) => ({
    ...incident,
    updates: updates.map(([status, message, ago], i) => ({
      id: `${incident.id}-u${i}`,
      status: status as string,
      message: message as string,
      at: now - (ago as number),
    })),
  }));
  components.find((c) => c.id === 'webhooks')!.status = 'degraded';

  return { customers, usage, flags, audit, components, incidents };
}

let state: ReturnType<typeof buildAdmin> | null = null;
const adb = () => (state ??= buildAdmin());

type Customer = ReturnType<typeof buildAdmin>['customers'][number];
type Flag = ReturnType<typeof buildAdmin>['flags'][number];

const findCustomer = (id: string) => adb().customers.find((c) => c.id === id);

function customerDetail(customer: Customer) {
  const rand = seeded(`invoices:${customer.id}`);
  return {
    ...customer,
    usage: adb().usage(customer.id),
    invoices:
      customer.plan === 'hobby'
        ? []
        : Array.from({ length: 6 }, (_, i) => ({
            id: `${customer.id}-in-${i}`,
            number: `INV-${customer.id.slice(4).toUpperCase()}-${(24 - i).toString().padStart(3, '0')}`,
            date: Date.now() - (i + 0.3) * 30 * DAY,
            amount: Math.round(customer.mrr * (0.92 + rand() * 0.16) * 100) / 100,
            status: i === 0 && customer.status === 'past_due' ? 'open' : 'paid',
          })),
  };
}

const IMPACT_STATUS = {
  minor: 'degraded',
  major: 'partial_outage',
  critical: 'major_outage',
} as const;
type Impact = keyof typeof IMPACT_STATUS;

export const saasAdminHandlers: HttpHandler[] = [
  http.get(`${S}/customers`, async ({ request }) => {
    const denied = await guard(request);
    if (denied) return denied;
    return HttpResponse.json(adb().customers);
  }),
  http.get<{ id: string }>(`${S}/customers/:id`, async ({ request, params }) => {
    const denied = await guard(request);
    if (denied) return denied;
    const customer = findCustomer(params.id);
    return customer
      ? HttpResponse.json(customerDetail(customer))
      : errorResponse('Customer not found', 404);
  }),
  http.post<{ id: string }, { plan: Plan }>(
    `${S}/customers/:id/plan`,
    async ({ request, params }) => {
      const denied = await guard(request);
      if (denied) return denied;
      const customer = findCustomer(params.id);
      if (!customer) return errorResponse('Customer not found', 404);
      const { plan } = await request.json();
      if (!(plan in PLAN_PRICE)) return errorResponse('Unknown plan', 422);
      customer.plan = plan;
      customer.mrr = mrrFor(plan, customer.seats);
      return HttpResponse.json(customerDetail(customer));
    },
  ),
  http.post<{ id: string }, { days: number }>(
    `${S}/customers/:id/trial`,
    async ({ request, params }) => {
      const denied = await guard(request);
      if (denied) return denied;
      const customer = findCustomer(params.id);
      if (!customer) return errorResponse('Customer not found', 404);
      const { days } = await request.json();
      customer.status = 'trialing';
      customer.trialEndsAt = Math.max(customer.trialEndsAt ?? Date.now(), Date.now()) + days * DAY;
      return HttpResponse.json(customerDetail(customer));
    },
  ),

  http.get(`${S}/flags`, async ({ request }) => {
    const denied = await guard(request);
    if (denied) return denied;
    return HttpResponse.json(adb().flags);
  }),
  http.patch<{ id: string }, Partial<Pick<Flag, 'environments' | 'rollout'>>>(
    `${S}/flags/:id`,
    async ({ request, params }) => {
      const denied = await guard(request);
      if (denied) return denied;
      const flag = adb().flags.find((f) => f.id === params.id);
      if (!flag) return errorResponse('Flag not found', 404);
      const body = await request.json();
      if (body.environments) Object.assign(flag.environments, body.environments);
      if (body.rollout !== undefined) flag.rollout = Math.min(100, Math.max(0, body.rollout));
      flag.updatedAt = Date.now();
      return HttpResponse.json(flag);
    },
  ),

  http.get(`${S}/audit`, async ({ request }) => {
    const denied = await guard(request);
    if (denied) return denied;
    return HttpResponse.json(adb().audit);
  }),

  http.get(`${S}/status`, async ({ request }) => {
    const denied = await guard(request);
    if (denied) return denied;
    const { components, incidents } = adb();
    return HttpResponse.json({ components, incidents });
  }),
  http.post<never, { title: string; impact: Impact; componentIds: string[]; message: string }>(
    `${S}/status/incidents`,
    async ({ request }) => {
      const denied = await guard(request);
      if (denied) return denied;
      const { title, impact, componentIds, message } = await request.json();
      const { components, incidents } = adb();
      const now = Date.now();
      const id = `inc-${now}`;
      incidents.unshift({
        id,
        title,
        impact,
        status: 'investigating',
        componentIds,
        startedAt: now,
        resolvedAt: null,
        updates: [{ id: `${id}-u0`, status: 'investigating', message, at: now }],
      });
      for (const c of components) if (componentIds.includes(c.id)) c.status = IMPACT_STATUS[impact];
      return HttpResponse.json(incidents[0], { status: 201 });
    },
  ),
  http.post<{ id: string }>(`${S}/status/incidents/:id/resolve`, async ({ request, params }) => {
    const denied = await guard(request);
    if (denied) return denied;
    const { components, incidents } = adb();
    const incident = incidents.find((i) => i.id === params.id);
    if (!incident) return errorResponse('Incident not found', 404);
    const now = Date.now();
    incident.status = 'resolved';
    incident.resolvedAt = now;
    incident.updates.unshift({
      id: `${incident.id}-u${incident.updates.length}`,
      status: 'resolved',
      message: 'This incident has been resolved.',
      at: now,
    });
    const stillOpen = incidents
      .filter((i) => i.status !== 'resolved')
      .flatMap((i) => i.componentIds);
    for (const c of components) if (!stillOpen.includes(c.id)) c.status = 'operational';
    return HttpResponse.json(incident);
  }),
];
