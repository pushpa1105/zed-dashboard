import { http, HttpResponse, type HttpHandler } from 'msw';

import { errorResponse } from '../utils';

import { DAY, guard, S, seeded } from './saas-admin';

type Config = { account: string; events: string[]; sync: string };

const EVENTS: Record<string, string[]> = {
  communication: ['incident.opened', 'incident.resolved', 'quota.reached', 'deploy.failed'],
  developer: ['deploy.succeeded', 'deploy.failed', 'api_key.created', 'flag.toggled'],
  payments: ['invoice.paid', 'invoice.failed', 'plan.changed', 'trial.ending'],
  analytics: ['request.logged', 'usage.daily', 'error.spike'],
  crm: ['customer.created', 'plan.changed', 'trial.ending', 'churn.risk'],
  storage: ['logs.exported', 'usage.daily', 'audit.exported'],
};

const CATALOG = [
  ['Slack', 'communication', 'Post incidents, quota alerts and deploys to channels.'],
  ['Microsoft Teams', 'communication', 'Send alerts and approvals to Teams chats.'],
  ['Discord', 'communication', 'Notify community servers about status changes.'],
  ['PagerDuty', 'communication', 'Page the on-call engineer when error rates spike.'],
  ['GitHub', 'developer', 'Link deploys to commits and open issues from errors.'],
  ['GitLab', 'developer', 'Sync pipelines and merge requests with releases.'],
  ['Linear', 'developer', 'Create issues from failed webhooks and incidents.'],
  ['Sentry', 'developer', 'Attach request logs to exceptions.'],
  ['Stripe', 'payments', 'Bill usage-based plans and sync invoices.'],
  ['Paddle', 'payments', 'Merchant of record for global subscriptions.'],
  ['Segment', 'analytics', 'Stream API usage events to your warehouse.'],
  ['Datadog', 'analytics', 'Forward metrics and traces for every request.'],
  ['Mixpanel', 'analytics', 'Track product usage per customer account.'],
  ['Salesforce', 'crm', 'Keep account plans and MRR in sync with opportunities.'],
  ['HubSpot', 'crm', 'Score leads from trial activity.'],
  ['Amazon S3', 'storage', 'Archive request logs and audit exports.'],
  ['Google BigQuery', 'storage', 'Load daily usage tables for analysis.'],
  ['Snowflake', 'storage', 'Share usage data with your data team.'],
] as const;

function build() {
  const rand = seeded('saas:integrations');
  const now = Date.now();
  return CATALOG.map(([name, category, description], i) => {
    const events = EVENTS[category]!;
    const connected = i % 3 === 0;
    const config: Config | null = connected
      ? { account: 'northwind', events: events.slice(0, 2), sync: 'realtime' }
      : null;
    return {
      id: name.toLowerCase().replace(/[^a-z]+/g, '-'),
      name,
      category,
      description,
      installs: Math.round(800 + rand() * 40_000),
      events,
      config,
      connectedAt: connected ? now - Math.round(5 + rand() * 300) * DAY : null,
      synced: connected ? Math.round(rand() * 120_000) : 0,
    };
  });
}

let state: ReturnType<typeof build> | null = null;
const integrations = () => (state ??= build());

export const saasIntegrationHandlers: HttpHandler[] = [
  http.get(`${S}/integrations`, async ({ request }) => {
    const denied = await guard(request);
    return denied ?? HttpResponse.json(integrations());
  }),
  http.put<{ id: string }, Config>(`${S}/integrations/:id`, async ({ request, params }) => {
    const denied = await guard(request);
    if (denied) return denied;
    const item = integrations().find((i) => i.id === params.id);
    if (!item) return errorResponse('Integration not found', 404);
    item.connectedAt ??= Date.now();
    item.config = await request.json();
    return HttpResponse.json(item);
  }),
  http.delete<{ id: string }>(`${S}/integrations/:id`, async ({ request, params }) => {
    const denied = await guard(request);
    if (denied) return denied;
    const item = integrations().find((i) => i.id === params.id);
    if (!item) return errorResponse('Integration not found', 404);
    Object.assign(item, { config: null, connectedAt: null, synced: 0 });
    return HttpResponse.json(item);
  }),
];
