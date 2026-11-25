import { http, HttpResponse, type HttpHandler } from 'msw';

import { env } from '@/core/config/env';

import {
  authed,
  isoDay,
  notFound,
  RANGE_DAYS,
  RANGE_FACTOR,
  readRange,
  seeded,
  split,
} from './analytics-utils';

/* ---- Geography ------------------------------------------------------------- */

const COUNTRIES = [
  ['US', 'americas', 0.27],
  ['GB', 'europe', 0.09],
  ['DE', 'europe', 0.085],
  ['IN', 'asia', 0.07],
  ['CA', 'americas', 0.05],
  ['FR', 'europe', 0.045],
  ['BR', 'americas', 0.04],
  ['NL', 'europe', 0.035],
  ['AU', 'oceania', 0.032],
  ['ES', 'europe', 0.03],
  ['JP', 'asia', 0.028],
  ['MX', 'americas', 0.024],
  ['IT', 'europe', 0.022],
  ['SE', 'europe', 0.018],
  ['PL', 'europe', 0.016],
  ['SG', 'asia', 0.015],
  ['KR', 'asia', 0.013],
  ['AR', 'americas', 0.012],
  ['IE', 'europe', 0.011],
  ['TR', 'europe', 0.01],
  ['ZA', 'africa', 0.009],
  ['CO', 'americas', 0.008],
  ['NG', 'africa', 0.007],
  ['ID', 'asia', 0.007],
  ['NZ', 'oceania', 0.006],
  ['EG', 'africa', 0.005],
] as const;

/** Sessions in the default 28-day range. */
const SESSIONS = 118_000;

const CHANNELS = ['organic', 'direct', 'paid', 'referral', 'social'] as const;
const DEVICES = ['desktop', 'mobile', 'tablet'] as const;

function country([code, region, share]: (typeof COUNTRIES)[number], range: string) {
  const rand = seeded(`analytics:geo:${code}:${range}`);
  const sessions = Math.round(SESSIONS * RANGE_FACTOR[range]! * share * (0.9 + rand() * 0.2));
  return {
    code,
    region,
    sessions,
    users: Math.round(sessions * (0.62 + rand() * 0.12)),
    engagementRate: 48 + rand() * 24,
    conversionRate: 1.2 + rand() * 3.4,
    delta: -18 + rand() * 46,
  };
}

function countryDetail(code: string, range: string) {
  const def = COUNTRIES.find(([c]) => c === code);
  if (!def) return null;
  const row = country(def, range);
  const rand = seeded(`analytics:geo:${code}:${range}:detail`);
  const days = RANGE_DAYS[range]!;
  const toBreakdown = ({ value, count }: { value: string; count: number }) => ({
    key: value,
    sessions: count,
  });
  return {
    ...row,
    daily: Array.from({ length: days }, (_, i) => ({
      date: isoDay(days - 1 - i),
      sessions: Math.round((row.sessions / days) * (0.75 + rand() * 0.5)),
    })),
    channels: split(row.sessions, CHANNELS, rand).map(toBreakdown),
    devices: split(row.sessions, DEVICES, rand).map(toBreakdown),
  };
}

/* ---- Devices & technology -------------------------------------------------- */

const TECHNOLOGY = {
  categories: DEVICES,
  os: ['Windows', 'iOS', 'Android', 'macOS', 'Linux', 'ChromeOS'],
  browsers: ['Chrome', 'Safari', 'Edge', 'Firefox', 'Samsung Internet', 'Opera'],
  resolutions: ['1920×1080', '390×844', '1536×864', '1440×900', '414×896', '2560×1440', '1366×768'],
};

function technology(range: string) {
  const rand = seeded(`analytics:technology:${range}`);
  const total = Math.round(SESSIONS * RANGE_FACTOR[range]!);
  return Object.fromEntries(
    Object.entries(TECHNOLOGY).map(([dimension, names]) => [
      dimension,
      split(total, names, rand)
        .map(({ value, count }) => ({
          name: value,
          sessions: count,
          conversions: Math.round(count * (0.012 + rand() * 0.034)),
          avgSessionSec: 90 + Math.round(rand() * 210),
        }))
        .sort((a, b) => b.sessions - a.sessions),
    ]),
  );
}

/* ---- Alerts ---------------------------------------------------------------- */

const ALERT_BASELINE = {
  sessions: 2_400,
  conversionRate: 3.2,
  bounceRate: 41,
  revenue: 18_400,
  pageLoad: 1.8,
  signups: 140,
};
type AlertMetric = keyof typeof ALERT_BASELINE;
const ALERT_METRICS = Object.keys(ALERT_BASELINE) as AlertMetric[];
const SEGMENTS = [
  'All traffic',
  'Mobile',
  'Germany',
  'Paid search',
  'Checkout pages',
  'United States',
  'Organic search',
];
const round = (n: number) => Math.round(n * 100) / 100;

const alerts = Array.from({ length: 16 }, (_, i) => {
  const rand = seeded(`analytics:alert:${i}`);
  const metric = ALERT_METRICS[Math.floor(rand() * ALERT_METRICS.length)]!;
  const change = (rand() < 0.65 ? -1 : 1) * (12 + rand() * 58);
  const expected = ALERT_BASELINE[metric] * (0.85 + rand() * 0.3);
  const size = Math.abs(change);
  return {
    id: `alert-${i + 1}`,
    metric,
    severity: size > 45 ? 'critical' : size > 25 ? 'warning' : 'info',
    status: i < 6 ? 'open' : rand() < 0.65 ? 'acknowledged' : 'muted',
    value: round(expected * (1 + change / 100)),
    expected: round(expected),
    change: round(change),
    segment: SEGMENTS[Math.floor(rand() * SEGMENTS.length)]!,
    at: new Date(Date.now() - (i * 5 + rand() * 5) * 3_600_000).toISOString(),
  };
});

type RuleBody = {
  name: string;
  metric: AlertMetric;
  condition: string;
  threshold: number;
  window: string;
  severity: string;
  notify: string;
};
type Rule = RuleBody & { id: string; enabled: boolean; triggered: number };

const RULE_DEFS: [string, AlertMetric, string, number, string, string, string][] = [
  ['Traffic drop', 'sessions', 'drops', 30, '1h', 'critical', 'slack'],
  ['Checkout conversion dip', 'conversionRate', 'drops', 20, '24h', 'critical', 'email'],
  ['Bounce rate spike', 'bounceRate', 'rises', 25, '24h', 'warning', 'inApp'],
  ['Revenue anomaly', 'revenue', 'changes', 35, '24h', 'warning', 'email'],
  ['Slow page loads', 'pageLoad', 'rises', 50, '1h', 'info', 'slack'],
];

let rules: Rule[] = RULE_DEFS.map(
  ([name, metric, condition, threshold, window, severity, notify], i) => ({
    id: `rule-${i + 1}`,
    name,
    metric,
    condition,
    threshold,
    window,
    severity,
    notify,
    enabled: i !== 4,
    triggered: alerts.filter((a) => a.metric === metric).length,
  }),
);

export const analyticsInsightsHandlers: HttpHandler[] = [
  http.get(`${env.API_URL}/analytics/geography`, async ({ request }) => {
    const error = await authed(request);
    const range = readRange(request);
    return error ?? HttpResponse.json(COUNTRIES.map((def) => country(def, range)));
  }),
  http.get(`${env.API_URL}/analytics/geography/:code`, async ({ request, params }) => {
    const error = await authed(request);
    if (error) return error;
    const detail = countryDetail(String(params.code), readRange(request));
    return detail ? HttpResponse.json(detail) : notFound('Country');
  }),
  http.get(`${env.API_URL}/analytics/technology`, async ({ request }) => {
    const error = await authed(request);
    return error ?? HttpResponse.json(technology(readRange(request)));
  }),
  http.get(`${env.API_URL}/analytics/alerts`, async ({ request }) => {
    const error = await authed(request);
    return error ?? HttpResponse.json(alerts);
  }),
  http.patch<{ id: string }, { status: string }>(
    `${env.API_URL}/analytics/alerts/:id`,
    async ({ request, params }) => {
      const error = await authed(request);
      if (error) return error;
      const alert = alerts.find((a) => a.id === params.id);
      if (!alert) return notFound('Alert');
      alert.status = (await request.json()).status;
      return HttpResponse.json(alert);
    },
  ),
  http.get(`${env.API_URL}/analytics/alert-rules`, async ({ request }) => {
    const error = await authed(request);
    return error ?? HttpResponse.json(rules);
  }),
  http.post<never, RuleBody>(`${env.API_URL}/analytics/alert-rules`, async ({ request }) => {
    const error = await authed(request);
    if (error) return error;
    const rule = {
      ...(await request.json()),
      id: `rule-${Date.now()}`,
      enabled: true,
      triggered: 0,
    };
    rules.push(rule);
    return HttpResponse.json(rule, { status: 201 });
  }),
  http.patch<{ id: string }, { enabled: boolean }>(
    `${env.API_URL}/analytics/alert-rules/:id`,
    async ({ request, params }) => {
      const error = await authed(request);
      if (error) return error;
      const rule = rules.find((r) => r.id === params.id);
      if (!rule) return notFound('Rule');
      rule.enabled = (await request.json()).enabled;
      return HttpResponse.json(rule);
    },
  ),
  http.delete(`${env.API_URL}/analytics/alert-rules/:id`, async ({ request, params }) => {
    const error = await authed(request);
    if (error) return error;
    rules = rules.filter((r) => r.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),
];
