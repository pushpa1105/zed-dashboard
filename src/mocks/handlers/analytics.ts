import { http, HttpResponse, type HttpHandler } from 'msw';

import { env } from '@/core/config/env';

import { networkDelay, requireAuth } from '../utils';

import { analyticsInsightsHandlers } from './analytics-insights';
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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = ['00', '03', '06', '09', '12', '15', '18', '21'];

const ORDERS = [
  ['13256498', 'Keyboard', 125, 'rejected', 70_999],
  ['13286564', 'Computer accessories', 100, 'approved', 83_348],
  ['84564564', 'Camera lens', 40, 'rejected', 40_570],
  ['86739658', 'TV', 99, 'pending', 410_780],
  ['98652366', 'Handset', 50, 'approved', 10_239],
  ['98753263', 'Mouse', 89, 'rejected', 10_570],
  ['98753275', 'Desktop', 185, 'approved', 98_063],
] as const;

const homeHandlers: HttpHandler[] = [
  http.get(`${env.API_URL}/analytics/overview`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;

    const range = new URL(request.url).searchParams.get('range') ?? '28d';
    const rand = seeded(`analytics:overview:${range}`);
    const f = RANGE_FACTOR[range] ?? 1;
    const k = (n: number) => Math.round(n * f);

    // Weekday × hour sessions: busy mid-week working hours, quiet nights.
    const heatmap = WEEKDAYS.map((_, d) =>
      HOURS.map((_, h) => {
        const work = h >= 3 && h <= 6 ? 1 : 0.35;
        const weekday = d < 5 ? 1 : 0.55;
        return Math.round((180 + rand() * 220) * work * weekday);
      }),
    );

    return HttpResponse.json({
      kpis: [
        { key: 'pageViews', value: k(442_236), delta: 59.3, extra: k(35_000) },
        { key: 'users', value: k(78_250), delta: 70.5, extra: k(8_900) },
        { key: 'orders', value: k(18_800), delta: -27.4, extra: k(1_943) },
        { key: 'sales', value: k(35_078), delta: -27.4, extra: k(20_395) },
      ],
      income: {
        total: 7_650,
        days: WEEKDAYS.map((day) => ({ day, value: Math.round(60 + rand() * 90) })),
      },
      orders: ORDERS.map(([id, product, quantity, status, amount]) => ({
        id,
        product,
        quantity,
        status,
        amount,
      })),
      report: [
        { key: 'growth', label: 'Company finance growth', value: '+45.14%', tone: 'good' },
        { key: 'expenses', label: 'Company expenses ratio', value: '0.58%', tone: 'neutral' },
        { key: 'risk', label: 'Business risk cases', value: 'Low', tone: 'good' },
      ],
      reportTrend: Array.from({ length: 12 }, (_, i) => ({
        month: MONTHS[i]!,
        value: Math.round(40 + i * 3 + rand() * 18),
      })),
      heatmap: { rows: WEEKDAYS, columns: HOURS.map((h) => `${h}:00`), values: heatmap },
      salesReport: {
        total: 1_560,
        weeks: WEEKDAYS.slice(0, 6).map((day) => ({
          day,
          income: Math.round(120 + rand() * 80),
          costs: Math.round(60 + rand() * 70),
        })),
      },
    });
  }),

  http.get(`${env.API_URL}/analytics/visitors`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;

    const granularity =
      new URL(request.url).searchParams.get('granularity') === 'week' ? 'week' : 'month';
    const rand = seeded(`analytics:visitors:${granularity}`);
    const labels = granularity === 'month' ? MONTHS : WEEKDAYS;
    const base = granularity === 'month' ? 90 : 35;

    return HttpResponse.json({
      granularity,
      points: labels.map((label, i) => ({
        label,
        pageViews: Math.round(base + Math.sin(i / 1.6) * base * 0.25 + rand() * base * 0.35),
        sessions: Math.round(base * 0.45 + Math.cos(i / 1.3) * base * 0.2 + rand() * base * 0.2),
      })),
    });
  }),
];

/* ---- Campaigns (ported marketing dashboard) ---------------------------- */
/** Deterministic pseudo-random numbers so the dashboard looks the same on every load. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const PERIOD_DAYS = { '7d': 7, '30d': 30, '90d': 90 } as const;
type Period = keyof typeof PERIOD_DAYS;

const toPeriod = (value: string | null): Period =>
  value && value in PERIOD_DAYS ? (value as Period) : '30d';

function overview(period: Period) {
  const days = PERIOD_DAYS[period];
  const rand = rng(days * 31 + 7);
  const scale = days / 30;

  const spark = (base: number) =>
    Array.from({ length: 12 }, (_, i) => Math.round(base * (0.8 + rand() * 0.35 + i * 0.015)));

  const kpis = [
    { key: 'domains', value: 48, delta: 4.2, spark: spark(40) },
    {
      key: 'projects',
      value: Math.round(19 * Math.max(scale, 0.6)),
      delta: 12.5,
      spark: spark(15),
    },
    { key: 'clicks', value: Math.round(41_780 * scale), delta: 8.1, spark: spark(1200) },
    { key: 'links', value: Math.round(2_714 * scale), delta: -2.4, spark: spark(90) },
  ];

  // Daily points for 7d/30d, weekly points for 90d.
  const step = days === 90 ? 7 : 1;
  const traffic = Array.from({ length: Math.ceil(days / step) }, (_, i) => {
    const daysAgo = days - 1 - i * step;
    const wave = Math.sin(i / 2.2) * 0.18 + Math.cos(i / 5) * 0.1;
    const impressions = Math.round((3_400 + rand() * 900) * (1 + wave) * step);
    return {
      date: isoDay(daysAgo),
      impressions,
      uniques: Math.round(impressions * (0.42 + rand() * 0.12)),
    };
  });

  const earnings = [
    { id: 'INV-2041', type: 'Rank commission', date: isoDay(1), amount: 1_420 },
    { id: 'INV-2040', type: 'Level commission', date: isoDay(3), amount: 860 },
    { id: 'INV-2039', type: 'Rank commission', date: isoDay(4), amount: 1_175.5 },
    { id: 'INV-2038', type: 'Affiliate bonus', date: isoDay(6), amount: 312 },
    { id: 'INV-2037', type: 'Level commission', date: isoDay(9), amount: 945 },
  ];
  const expenses = [
    { id: 'EXP-881', type: 'Paid social · Meta', date: isoDay(1), amount: 640 },
    { id: 'EXP-880', type: 'Search ads · Google', date: isoDay(2), amount: 1_180 },
    { id: 'EXP-879', type: 'Design contractor', date: isoDay(5), amount: 900 },
    { id: 'EXP-878', type: 'Email platform', date: isoDay(8), amount: 149 },
    { id: 'EXP-877', type: 'Influencer brief', date: isoDay(11), amount: 750 },
  ];
  const payouts = [
    { id: 'PO-311', type: 'Bank transfer', date: isoDay(2), amount: 2_400, status: 'paid' },
    { id: 'PO-310', type: 'PayPal', date: isoDay(5), amount: 615, status: 'pending' },
    { id: 'PO-309', type: 'Bank transfer', date: isoDay(12), amount: 3_050, status: 'paid' },
    { id: 'PO-308', type: 'Wise', date: isoDay(15), amount: 480, status: 'failed' },
    { id: 'PO-307', type: 'Bank transfer', date: isoDay(19), amount: 1_900, status: 'paid' },
  ];

  const posts = [
    {
      id: 'p1',
      title: 'What is the value of brand consistency?',
      kind: 'Company',
      reach: 7_120,
      delta: -4,
    },
    { id: 'p2', title: 'How we cut onboarding time in half', kind: 'Blog', reach: 3_480, delta: 5 },
    { id: 'p3', title: 'Introducing scheduled reports', kind: 'Product', reach: 2_265, delta: 6 },
    { id: 'p4', title: 'A day with our support team', kind: 'Persona', reach: 1_390, delta: 8 },
  ];

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const postStats = weekdays.map((day, i) => ({
    day,
    posts: Math.round((18 + rand() * 22) * Math.max(scale, 0.5) + (i === 3 ? 22 : 0)),
  }));

  const channels = ['Organic', 'Paid search', 'Social', 'Email', 'Referral', 'Direct'].map(
    (channel) => ({
      channel,
      current: Math.round(45 + rand() * 50),
      previous: Math.round(40 + rand() * 45),
    }),
  );

  const visitors = Math.round(128_400 * scale);
  const funnel = [
    { stage: 'Visitors', value: visitors },
    { stage: 'Leads', value: Math.round(visitors * 0.184) },
    { stage: 'Qualified', value: Math.round(visitors * 0.071) },
    { stage: 'Proposals', value: Math.round(visitors * 0.026) },
    { stage: 'Won', value: Math.round(visitors * 0.0094) },
  ];

  return { kpis, traffic, earnings, expenses, payouts, posts, postStats, channels, funnel };
}

function deals(interval: 'weekly' | 'monthly') {
  const rand = rng(interval === 'weekly' ? 11 : 23);
  if (interval === 'weekly') {
    return Array.from({ length: 12 }, (_, i) => ({
      label: `W${36 + i}`,
      open: Math.round(60 + rand() * 90 + Math.sin(i / 2) * 30),
      closed: Math.round(30 + rand() * 60),
    }));
  }
  const months = [
    'Dec',
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
  ];
  return months.map((label, i) => ({
    label,
    open: Math.round(110 + rand() * 120 + Math.sin(i / 1.6) * 50),
    closed: Math.round(70 + rand() * 90),
  }));
}

/** Mock API for the "dashboard-marketing" feature. */
const campaignHandlers: HttpHandler[] = [
  http.get(`${env.API_URL}/analytics/campaigns/overview`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const period = toPeriod(new URL(request.url).searchParams.get('period'));
    return HttpResponse.json(overview(period));
  }),

  http.get(`${env.API_URL}/analytics/campaigns/deals`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const interval = new URL(request.url).searchParams.get('interval');
    return HttpResponse.json(deals(interval === 'weekly' ? 'weekly' : 'monthly'));
  }),
];

/* ---- Workspace pages: realtime, audience, acquisition, pages, funnels, reports ---- */

const PAGES = [
  ['/', 'Home', 0.24],
  ['/pricing', 'Pricing', 0.13],
  ['/product/dashboards', 'Dashboards', 0.1],
  ['/docs/getting-started', 'Getting started', 0.09],
  ['/blog/metric-definitions', 'How we define a metric', 0.07],
  ['/customers/fieldwork', 'Fieldwork case study', 0.05],
  ['/integrations/stripe', 'Stripe integration', 0.05],
  ['/changelog', 'Changelog', 0.04],
  ['/signup', 'Sign up', 0.04],
  ['/docs/api/metrics', 'Metrics API reference', 0.035],
  ['/careers', 'Careers', 0.02],
  ['/security', 'Security', 0.015],
] as const;

const COUNTRIES = [
  ['US', 'United States', 0.31],
  ['DE', 'Germany', 0.11],
  ['GB', 'United Kingdom', 0.1],
  ['IN', 'India', 0.08],
  ['FR', 'France', 0.06],
  ['CA', 'Canada', 0.055],
  ['BR', 'Brazil', 0.045],
  ['NL', 'Netherlands', 0.04],
  ['ES', 'Spain', 0.035],
  ['AU', 'Australia', 0.03],
] as const;

const EVENT_TYPES = [
  'page_view',
  'page_view',
  'page_view',
  'signup',
  'add_to_cart',
  'purchase',
  'trial_start',
] as const;
const DEVICES = ['desktop', 'mobile', 'tablet'] as const;

function realtime() {
  // Changes every 5 seconds so the page visibly updates on refetch.
  const tick = Math.floor(Date.now() / 5000);
  const rand = seeded(`analytics:realtime:${tick}`);
  const base = 380 + Math.round(Math.sin(tick / 8) * 60);
  const perMinute = Array.from({ length: 30 }, (_, i) => ({
    minute: i === 29 ? 'now' : `-${29 - i}m`,
    users: Math.round(base * (0.18 + rand() * 0.12)),
  }));
  const now = Date.now();
  let elapsed = 0;
  const events = Array.from({ length: 14 }, (_, i) => {
    const page = PAGES[Math.floor(rand() * PAGES.length)]!;
    const country = COUNTRIES[Math.floor(rand() * COUNTRIES.length)]!;
    elapsed += 1500 + rand() * 9000;
    return {
      id: `${tick}-${i}`,
      at: new Date(now - elapsed).toISOString(),
      type: EVENT_TYPES[Math.floor(rand() * EVENT_TYPES.length)]!,
      page: page[0],
      country: country[1],
      device: DEVICES[Math.floor(rand() * 3)]!,
    };
  });
  const active = base + Math.round(rand() * 40);
  return {
    activeUsers: active,
    perMinute,
    events,
    topPages: PAGES.slice(0, 6).map(([path], i) => ({
      path,
      users: Math.round(active * [0.28, 0.17, 0.12, 0.09, 0.07, 0.05][i]! * (0.85 + rand() * 0.3)),
    })),
    devices: [
      { key: 'desktop', value: Math.round(active * 0.58) },
      { key: 'mobile', value: Math.round(active * 0.36) },
      { key: 'tablet', value: Math.round(active * 0.06) },
    ],
  };
}

function audience(range: string) {
  const rand = seeded(`analytics:audience:${range}`);
  const users = Math.round(78_250 * RANGE_FACTOR[range]!);
  const days = RANGE_DAYS[range]!;
  const points = Math.min(days, 30);
  const step = days / points;
  return {
    totals: {
      users,
      newUsers: Math.round(users * 0.62),
      returning: Math.round(users * 0.38),
      avgSessionSec: 192 + Math.round(rand() * 40),
      engagementRate: 61.4 + rand() * 6,
    },
    ages: ['18–24', '25–34', '35–44', '45–54', '55–64', '65+'].map((group, i) => ({
      group,
      users: Math.round(users * [0.14, 0.34, 0.26, 0.14, 0.08, 0.04][i]! * (0.9 + rand() * 0.2)),
    })),
    devices: [
      { key: 'desktop', label: 'Desktop', value: Math.round(users * 0.56) },
      { key: 'mobile', label: 'Mobile', value: Math.round(users * 0.38) },
      { key: 'tablet', label: 'Tablet', value: Math.round(users * 0.06) },
    ],
    countries: COUNTRIES.map(([code, country, share]) => ({
      code,
      country,
      users: Math.round(users * share),
      share: share * 100,
      sessions: Math.round(users * share * (1.4 + rand() * 0.4)),
      engagementRate: 52 + rand() * 20,
    })),
    newVsReturning: Array.from({ length: points }, (_, i) => {
      const d = new Date(Date.now() - (points - 1 - i) * step * 86_400_000);
      const wave = 1 + Math.sin(i / 2.4) * 0.12;
      return {
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        new: Math.round(((users * 0.62) / points) * wave * (0.9 + rand() * 0.2)),
        returning: Math.round(((users * 0.38) / points) * (0.92 + rand() * 0.16)),
      };
    }),
  };
}

const CHANNELS = [
  ['organic', 'Organic search', 0.38, 2.9],
  ['direct', 'Direct', 0.21, 3.6],
  ['paid', 'Paid search', 0.14, 4.1],
  ['referral', 'Referral', 0.1, 3.2],
  ['social', 'Organic social', 0.09, 1.4],
  ['email', 'Email', 0.08, 5.8],
] as const;

type UtmLink = {
  id: string;
  url: string;
  source: string;
  medium: string;
  campaign: string;
  createdAt: string;
  clicks: number;
};
const utmLinks: UtmLink[] = [
  {
    id: 'utm-1',
    url: 'https://orbitly.app/pricing?utm_source=newsletter&utm_medium=email&utm_campaign=nov_launch',
    source: 'newsletter',
    medium: 'email',
    campaign: 'nov_launch',
    createdAt: '2026-11-18T09:12:00Z',
    clicks: 1_284,
  },
  {
    id: 'utm-2',
    url: 'https://orbitly.app/?utm_source=linkedin&utm_medium=social&utm_campaign=q4_brand',
    source: 'linkedin',
    medium: 'social',
    campaign: 'q4_brand',
    createdAt: '2026-11-11T14:40:00Z',
    clicks: 642,
  },
  {
    id: 'utm-3',
    url: 'https://orbitly.app/product/dashboards?utm_source=google&utm_medium=cpc&utm_campaign=dashboards_exact',
    source: 'google',
    medium: 'cpc',
    campaign: 'dashboards_exact',
    createdAt: '2026-11-02T08:05:00Z',
    clicks: 3_918,
  },
];

const SOURCES = [
  ['google', 'organic', 0.3],
  ['(direct)', '(none)', 0.2],
  ['google', 'cpc', 0.12],
  ['newsletter', 'email', 0.07],
  ['linkedin', 'social', 0.06],
  ['news.ycombinator.com', 'referral', 0.05],
  ['bing', 'organic', 0.04],
  ['github.com', 'referral', 0.03],
] as const;

function acquisition(range: string) {
  const rand = seeded(`analytics:acquisition:${range}`);
  const users = Math.round(78_250 * RANGE_FACTOR[range]!);
  return {
    channels: CHANNELS.map(([key, label, share, conv]) => {
      const u = Math.round(users * share);
      return {
        key,
        label,
        users: u,
        sessions: Math.round(u * (1.3 + rand() * 0.3)),
        conversionRate: conv + rand() * 0.6,
        revenue: Math.round(u * conv * (0.8 + rand() * 0.4) * 1.9),
        delta: Math.round((rand() * 40 - 12) * 10) / 10,
        trend: Array.from({ length: 12 }, (_, i) =>
          Math.round((u / 12) * (0.75 + Math.sin(i / 2 + share * 9) * 0.2 + rand() * 0.15)),
        ),
      };
    }),
    sources: SOURCES.map(([source, medium, share]) => {
      const sessions = Math.round(users * share * 1.4);
      return {
        source,
        medium,
        sessions,
        bounceRate: 28 + rand() * 30,
        conversions: Math.round(sessions * (0.01 + rand() * 0.035)),
      };
    }),
    links: utmLinks,
  };
}

function pages(range: string) {
  const rand = seeded(`analytics:pages:${range}`);
  const views = Math.round(442_236 * RANGE_FACTOR[range]!);
  return PAGES.map(([path, title, share]) => {
    const v = Math.round(views * share * (0.9 + rand() * 0.2));
    return {
      path,
      title,
      views: v,
      users: Math.round(v * (0.55 + rand() * 0.2)),
      avgTimeSec: Math.round(35 + rand() * 210),
      bounceRate: 22 + rand() * 45,
      entrances: Math.round(v * (0.2 + rand() * 0.5)),
      exits: Math.round(v * (0.15 + rand() * 0.4)),
      scrollDepth: 35 + rand() * 55,
    };
  });
}

const FUNNEL_EVENTS = [
  ['landing', 'Visited landing page', 1],
  ['pricing', 'Viewed pricing', 0.42],
  ['signup', 'Created account', 0.19],
  ['source', 'Connected a data source', 0.12],
  ['dashboard', 'Built first dashboard', 0.085],
  ['invite', 'Invited a teammate', 0.05],
  ['subscribe', 'Started paid plan', 0.031],
] as const;

function funnel(steps: string[], range: string) {
  const rand = seeded(`analytics:funnel:${range}:${steps.join(',')}`);
  const top = Math.round(48_000 * RANGE_FACTOR[range]!);
  let previous = top;
  return steps.map((key, i) => {
    const event = FUNNEL_EVENTS.find((e) => e[0] === key) ?? FUNNEL_EVENTS[0];
    const ideal = Math.round(top * event[2] * (0.92 + rand() * 0.16));
    const users = i === 0 ? ideal : Math.min(previous, ideal);
    previous = users;
    return {
      key: event[0],
      label: event[1],
      users,
      medianTimeMin: i === 0 ? 0 : Math.round(3 + rand() * 120),
    };
  });
}

type ReportSchedule = {
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  format: 'pdf' | 'csv';
};
type Report = {
  id: string;
  name: string;
  type: 'traffic' | 'acquisition' | 'revenue' | 'funnel' | 'custom';
  owner: string;
  updatedAt: string;
  schedule: ReportSchedule | null;
};
let reports: Report[] = [
  {
    id: 'r-1',
    name: 'Weekly traffic digest',
    type: 'traffic',
    owner: 'Hannah Morgan',
    updatedAt: '2026-11-23T08:00:00Z',
    schedule: { frequency: 'weekly', recipients: ['growth@orbitly.app'], format: 'pdf' },
  },
  {
    id: 'r-2',
    name: 'Paid search efficiency',
    type: 'acquisition',
    owner: 'Megan Clark',
    updatedAt: '2026-11-21T16:30:00Z',
    schedule: null,
  },
  {
    id: 'r-3',
    name: 'Revenue by channel (board pack)',
    type: 'revenue',
    owner: 'Daniel Okafor',
    updatedAt: '2026-11-19T10:12:00Z',
    schedule: {
      frequency: 'monthly',
      recipients: ['board@orbitly.app', 'cfo@orbitly.app'],
      format: 'pdf',
    },
  },
  {
    id: 'r-4',
    name: 'Trial to paid funnel',
    type: 'funnel',
    owner: 'Priya Raman',
    updatedAt: '2026-11-18T13:45:00Z',
    schedule: null,
  },
  {
    id: 'r-5',
    name: 'Docs engagement',
    type: 'custom',
    owner: 'Lucas Meyer',
    updatedAt: '2026-11-12T09:20:00Z',
    schedule: { frequency: 'daily', recipients: ['docs@orbitly.app'], format: 'csv' },
  },
  {
    id: 'r-6',
    name: 'Country breakdown for EMEA',
    type: 'traffic',
    owner: 'Sofia Alvarez',
    updatedAt: '2026-11-04T11:05:00Z',
    schedule: null,
  },
];

type UtmBody = {
  url: string;
  source: string;
  medium: string;
  campaign: string;
  term?: string;
  content?: string;
};

const pageHandlers: HttpHandler[] = [
  http.get(`${env.API_URL}/analytics/realtime`, async ({ request }) => {
    const error = await authed(request);
    return error ?? HttpResponse.json(realtime());
  }),
  http.get(`${env.API_URL}/analytics/audience`, async ({ request }) => {
    const error = await authed(request);
    return error ?? HttpResponse.json(audience(readRange(request)));
  }),
  http.get(`${env.API_URL}/analytics/acquisition`, async ({ request }) => {
    const error = await authed(request);
    return error ?? HttpResponse.json(acquisition(readRange(request)));
  }),
  http.post<never, UtmBody>(`${env.API_URL}/analytics/utm-links`, async ({ request }) => {
    const error = await authed(request);
    if (error) return error;
    const body = await request.json();
    let url: URL;
    try {
      url = new URL(body.url);
    } catch {
      return HttpResponse.json(
        { message: 'Enter a full URL, including https://' },
        { status: 400 },
      );
    }
    const params = {
      utm_source: body.source,
      utm_medium: body.medium,
      utm_campaign: body.campaign,
      utm_term: body.term,
      utm_content: body.content,
    };
    for (const [key, value] of Object.entries(params)) if (value) url.searchParams.set(key, value);
    const link: UtmLink = {
      id: `utm-${Date.now()}`,
      url: url.toString(),
      source: body.source,
      medium: body.medium,
      campaign: body.campaign,
      createdAt: new Date().toISOString(),
      clicks: 0,
    };
    utmLinks.unshift(link);
    return HttpResponse.json(link, { status: 201 });
  }),
  http.get(`${env.API_URL}/analytics/pages`, async ({ request }) => {
    const error = await authed(request);
    return error ?? HttpResponse.json(pages(readRange(request)));
  }),
  http.get(`${env.API_URL}/analytics/funnel`, async ({ request }) => {
    const error = await authed(request);
    if (error) return error;
    const raw = new URL(request.url).searchParams.get('steps');
    const steps = (raw ? raw.split(',') : ['landing', 'pricing', 'signup', 'subscribe']).filter(
      Boolean,
    );
    return HttpResponse.json({
      events: FUNNEL_EVENTS.map(([key, label]) => ({ key, label })),
      steps: funnel(steps.length >= 2 ? steps : ['landing', 'signup'], readRange(request)),
    });
  }),
  http.get(`${env.API_URL}/analytics/reports`, async ({ request }) => {
    const error = await authed(request);
    return error ?? HttpResponse.json(reports);
  }),
  http.patch<{ id: string }, ReportSchedule | null>(
    `${env.API_URL}/analytics/reports/:id/schedule`,
    async ({ request, params }) => {
      const error = await authed(request);
      if (error) return error;
      const schedule = await request.json();
      const report = reports.find((r) => r.id === params.id);
      if (!report) return HttpResponse.json({ message: 'Report not found' }, { status: 404 });
      report.schedule = schedule;
      report.updatedAt = new Date().toISOString();
      return HttpResponse.json(report);
    },
  ),
  http.delete(`${env.API_URL}/analytics/reports/:id`, async ({ request, params }) => {
    const error = await authed(request);
    if (error) return error;
    reports = reports.filter((r) => r.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),
];

/* ---- Product analytics: retention, events, goals, experiments ---------------- */

/** Share of users that stick around, how fast the rest churns, and cohort size, per segment. */
const RETENTION_CURVES: Record<string, [floor: number, decay: number, size: number]> = {
  all: [0.2, 1.5, 2400],
  organic: [0.24, 1.7, 1100],
  paid: [0.12, 1.1, 800],
  referral: [0.29, 2.1, 500],
};

function retention(segment: string, count: number) {
  const [floor, decay, size] = RETENTION_CURVES[segment] ?? RETENTION_CURVES.all!;
  const rand = seeded(`analytics:retention:${segment}:${count}`);
  return {
    cohorts: Array.from({ length: count }, (_, i) => {
      const users = Math.round(size * (0.8 + rand() * 0.4));
      // Newer cohorts retain a little better: the product keeps improving.
      const f = floor + i * 0.004;
      return {
        week: isoDay((count - 1 - i) * 7 + 1),
        size: users,
        retained: Array.from({ length: count - i }, (_, w) =>
          w === 0
            ? users
            : Math.round(users * (f + (1 - f) * Math.exp(-w / decay)) * (0.94 + rand() * 0.1)),
        ),
      };
    }),
  };
}

const PRODUCT_EVENTS = [
  ['page_view', 'Page viewed', 'engagement', 1],
  ['session_start', 'Session started', 'engagement', 0.42],
  ['scroll_depth', 'Scrolled 75%', 'engagement', 0.31],
  ['cta_click', 'CTA clicked', 'engagement', 0.12],
  ['site_search', 'Site search', 'engagement', 0.06],
  ['video_play', 'Video played', 'engagement', 0.04],
  ['add_to_cart', 'Added to cart', 'conversion', 0.022],
  ['signup', 'Signed up', 'conversion', 0.018],
  ['trial_start', 'Trial started', 'conversion', 0.011],
  ['purchase', 'Purchase completed', 'conversion', 0.007],
  ['subscribe', 'Subscribed', 'conversion', 0.005],
  ['demo_request', 'Demo requested', 'conversion', 0.003],
  ['client_error', 'Client error', 'system', 0.009],
  ['api_timeout', 'API timeout', 'system', 0.002],
] as const;

const EVENT_PROPERTIES: Record<string, readonly string[]> = {
  device: DEVICES,
  country: COUNTRIES.slice(0, 6).map(([, name]) => name),
  browser: ['Chrome', 'Safari', 'Edge', 'Firefox', 'Other'],
  source: ['google', 'direct', 'newsletter', 'linkedin', 'producthunt'],
};
const PLAN_EVENTS = new Set<string>(['trial_start', 'purchase', 'subscribe']);

function eventRow([key, label, category, share]: (typeof PRODUCT_EVENTS)[number], range: string) {
  const rand = seeded(`analytics:event:${key}:${range}`);
  const count = Math.round(442_236 * RANGE_FACTOR[range]! * share * (0.9 + rand() * 0.2));
  const row = {
    key,
    label,
    category,
    count,
    users: Math.round(count * (category === 'engagement' ? 0.18 : 0.85) * (0.8 + rand() * 0.2)),
    delta: Math.round((rand() * 40 - 14) * 10) / 10,
    trend: Array.from({ length: 14 }, (_, i) =>
      Math.round((count / 14) * (0.9 + Math.sin(i / 2) * 0.08 + rand() * 0.2)),
    ),
  };
  return { row, rand };
}

function eventDetail(key: string, range: string) {
  const def = PRODUCT_EVENTS.find(([k]) => k === key);
  if (!def) return null;
  const { row, rand } = eventRow(def, range);
  const days = RANGE_DAYS[range]!;
  const props = PLAN_EVENTS.has(key)
    ? { ...EVENT_PROPERTIES, plan: ['Pro', 'Starter', 'Business'] }
    : EVENT_PROPERTIES;
  return {
    ...row,
    daily: Array.from({ length: days }, (_, i) => ({
      date: isoDay(days - 1 - i),
      // Weekends are quieter.
      count: Math.round((row.count / days) * (0.75 + rand() * 0.5) * (i % 7 >= 5 ? 0.7 : 1)),
    })),
    properties: Object.entries(props).map(([prop, labels]) => ({
      key: prop,
      values: split(row.count, labels, rand),
    })),
  };
}

type GoalBody = { name: string; event: string; target: number; value: number };
type GoalDef = GoalBody & { id: string };

/** Typical conversion rate (% of visitors) of each goal event. */
const GOAL_BASE_RATE: Record<string, number> = {
  signup: 4.2,
  trial_start: 2.6,
  demo_request: 0.8,
  add_to_cart: 6.5,
  purchase: 1.9,
  subscribe: 1.1,
};

let goals: GoalDef[] = [
  { id: 'goal-1', name: 'Newsletter signups', event: 'signup', target: 4, value: 2 },
  { id: 'goal-2', name: 'Trial starts', event: 'trial_start', target: 3, value: 45 },
  { id: 'goal-3', name: 'Demo requests', event: 'demo_request', target: 1, value: 180 },
  { id: 'goal-4', name: 'Checkout completed', event: 'purchase', target: 2.2, value: 89 },
  { id: 'goal-5', name: 'Annual subscriptions', event: 'subscribe', target: 1.5, value: 240 },
];

function goalStats(goal: GoalDef, range: string) {
  const rand = seeded(`analytics:goal:${goal.id}:${range}`);
  const rate = GOAL_BASE_RATE[goal.event]! * (0.8 + rand() * 0.4);
  const round2 = (n: number) => Math.round(n * 100) / 100;
  return {
    ...goal,
    conversionRate: round2(rate),
    conversions: Math.round((78_250 * RANGE_FACTOR[range]! * rate) / 100),
    trend: Array.from({ length: 12 }, (_, i) => round2(rate * (0.85 + i * 0.012 + rand() * 0.1))),
  };
}

type ExperimentDef = {
  id: string;
  name: string;
  hypothesis: string;
  status: 'running' | 'completed' | 'paused' | 'draft';
  goal: string;
  /** [started, ended] in days ago; null while still a draft. */
  days: [number, number] | null;
  /** Variant names with their true conversion rate (%); the first one is the control. */
  variants: [string, number][];
};

const EXPERIMENTS: ExperimentDef[] = [
  {
    id: 'pricing-annual-default',
    name: 'Annual plan preselected on pricing',
    hypothesis: 'Defaulting the pricing toggle to annual billing will lift paid subscriptions.',
    status: 'running',
    goal: 'subscribe',
    days: [18, 0],
    variants: [
      ['Monthly default', 1.1],
      ['Annual default', 1.34],
    ],
  },
  {
    id: 'hero-headline',
    name: 'Outcome-focused hero headline',
    hypothesis: 'Leading with the outcome instead of features will increase signups.',
    status: 'completed',
    goal: 'signup',
    days: [45, 17],
    variants: [
      ['Feature headline', 4.1],
      ['Outcome headline', 4.62],
      ['Social proof headline', 4.28],
    ],
  },
  {
    id: 'one-page-checkout',
    name: 'One-page checkout',
    hypothesis: 'Collapsing checkout into a single page will reduce abandonment.',
    status: 'running',
    goal: 'purchase',
    days: [9, 0],
    variants: [
      ['Three-step checkout', 1.9],
      ['Single page', 2.02],
    ],
  },
  {
    id: 'free-shipping-banner',
    name: 'Free shipping banner',
    hypothesis: 'Showing the free shipping threshold in the cart will raise the add-to-cart rate.',
    status: 'completed',
    goal: 'add_to_cart',
    days: [60, 32],
    variants: [
      ['No banner', 6.5],
      ['Banner', 7.35],
    ],
  },
  {
    id: 'onboarding-checklist',
    name: 'Onboarding checklist',
    hypothesis: 'A five-step checklist after signup will lead more people to start a trial.',
    status: 'paused',
    goal: 'trial_start',
    days: [26, 12],
    variants: [
      ['No checklist', 2.6],
      ['Checklist', 2.45],
    ],
  },
  {
    id: 'sticky-demo-cta',
    name: 'Sticky “Book a demo” button',
    hypothesis: 'A persistent demo button on docs pages will increase demo requests.',
    status: 'draft',
    goal: 'demo_request',
    days: null,
    variants: [
      ['Inline link', 0.8],
      ['Sticky button', 0.8],
    ],
  },
];

function experiment({ days, variants, ...def }: ExperimentDef) {
  const rand = seeded(`analytics:experiment:${def.id}`);
  const span = days ? days[0] - days[1] : 0;
  const perVariant = (1_400 * span) / variants.length;
  return {
    ...def,
    startedAt: days && isoDay(days[0]),
    endedAt: days?.[1] ? isoDay(days[1]) : null,
    variants: variants.map(([name, rate], v) => {
      const visitors = Math.round(perVariant * (0.97 + rand() * 0.06));
      return {
        key: `v${v}`,
        name,
        control: v === 0,
        visitors,
        conversions: Math.round((visitors * rate * (0.97 + rand() * 0.06)) / 100),
      };
    }),
    // Cumulative daily rate: noisy at first, settling on the true rate as samples grow.
    daily: Array.from({ length: span }, (_, d) => ({
      date: isoDay(days![0] - d - 1),
      ...Object.fromEntries(
        variants.map(([, rate], v) => [
          `v${v}`,
          Math.round(rate * (1 + (rand() - 0.5) / Math.sqrt(d + 1)) * 100) / 100,
        ]),
      ),
    })),
  };
}

const productHandlers: HttpHandler[] = [
  http.get(`${env.API_URL}/analytics/retention`, async ({ request }) => {
    const error = await authed(request);
    if (error) return error;
    const params = new URL(request.url).searchParams;
    return HttpResponse.json(
      retention(params.get('segment') ?? 'all', params.get('cohorts') === '12' ? 12 : 8),
    );
  }),
  http.get(`${env.API_URL}/analytics/events`, async ({ request }) => {
    const error = await authed(request);
    const range = readRange(request);
    return error ?? HttpResponse.json(PRODUCT_EVENTS.map((def) => eventRow(def, range).row));
  }),
  http.get(`${env.API_URL}/analytics/events/:key`, async ({ request, params }) => {
    const error = await authed(request);
    if (error) return error;
    const detail = eventDetail(String(params.key), readRange(request));
    return detail ? HttpResponse.json(detail) : notFound('Event');
  }),
  http.get(`${env.API_URL}/analytics/goals`, async ({ request }) => {
    const error = await authed(request);
    const range = readRange(request);
    return error ?? HttpResponse.json(goals.map((goal) => goalStats(goal, range)));
  }),
  http.post<never, GoalBody>(`${env.API_URL}/analytics/goals`, async ({ request }) => {
    const error = await authed(request);
    if (error) return error;
    const goal = { ...(await request.json()), id: `goal-${Date.now()}` };
    goals.push(goal);
    return HttpResponse.json(goalStats(goal, '28d'), { status: 201 });
  }),
  http.patch<{ id: string }, GoalBody>(
    `${env.API_URL}/analytics/goals/:id`,
    async ({ request, params }) => {
      const error = await authed(request);
      if (error) return error;
      const goal = goals.find((g) => g.id === params.id);
      if (!goal) return notFound('Goal');
      Object.assign(goal, await request.json());
      return HttpResponse.json(goalStats(goal, '28d'));
    },
  ),
  http.delete(`${env.API_URL}/analytics/goals/:id`, async ({ request, params }) => {
    const error = await authed(request);
    if (error) return error;
    goals = goals.filter((g) => g.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),
  http.get(`${env.API_URL}/analytics/experiments`, async ({ request }) => {
    const error = await authed(request);
    return (
      error ??
      HttpResponse.json(EXPERIMENTS.map((def) => ({ ...experiment(def), daily: undefined })))
    );
  }),
  http.get(`${env.API_URL}/analytics/experiments/:id`, async ({ request, params }) => {
    const error = await authed(request);
    if (error) return error;
    const def = EXPERIMENTS.find((e) => e.id === params.id);
    return def ? HttpResponse.json(experiment(def)) : notFound('Experiment');
  }),
];

/** Mock API for the "analytics" workspace. */
export const analyticsHandlers: HttpHandler[] = [
  ...homeHandlers,
  ...campaignHandlers,
  ...pageHandlers,
  ...productHandlers,
  ...analyticsInsightsHandlers,
];
