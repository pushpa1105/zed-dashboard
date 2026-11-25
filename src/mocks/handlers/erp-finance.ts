import { http, HttpResponse, type HttpHandler } from 'msw';

import { env } from '@/core/config/env';

import { networkDelay, requireAuth } from '../utils';

/** Deterministic PRNG so the same filters always return the same numbers. */
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

const SECTIONS = ['dashboard', 'finance', 'accounts', 'payroll'] as const;
const PERIODS = ['month', 'quarter', 'year'] as const;
type Section = (typeof SECTIONS)[number];
type Period = (typeof PERIODS)[number];

const SECTION_SCALE: Record<Section, number> = {
  dashboard: 1,
  finance: 1.18,
  accounts: 0.74,
  payroll: 0.52,
};

const LABELS: Record<Period, string[]> = {
  month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
  quarter: ["Q1 '24", "Q2 '24", "Q3 '24", "Q4 '24", "Q1 '25", "Q2 '25", "Q3 '25", "Q4 '25"],
  year: ['2019', '2020', '2021', '2022', '2023', '2024', '2025'],
};

const PEOPLE = [
  ['Hannah Morgan', 'Meeting scheduled', 'Operations'],
  ['Megan Clark', 'Update on marketing campaign', 'Marketing'],
  ['Daniel Okafor', 'Q4 vendor invoice — Northwind', 'Accounts payable'],
  ['Priya Raman', 'Payroll run approved', 'Payroll'],
  ['Lucas Meyer', 'Reimbursement: client dinner', 'Expenses'],
  ['Sofia Alvarez', 'Stripe payout reconciled', 'Revenue'],
  ['Tom Becker', 'AWS bill exceeds budget', 'Infrastructure'],
] as const;

const STATUSES = ['completed', 'pending', 'urgent', 'failed'] as const;

export const erpFinanceHandlers: HttpHandler[] = [
  http.get(`${env.API_URL}/erp/finance/overview`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;

    const url = new URL(request.url);
    const section = (SECTIONS as readonly string[]).includes(url.searchParams.get('section') ?? '')
      ? (url.searchParams.get('section') as Section)
      : 'dashboard';
    const period = (PERIODS as readonly string[]).includes(url.searchParams.get('period') ?? '')
      ? (url.searchParams.get('period') as Period)
      : 'month';

    const rand = seeded(`${section}:${period}`);
    const scale = SECTION_SCALE[section];
    const periodScale = period === 'month' ? 1 : period === 'quarter' ? 3 : 12;
    const labels = LABELS[period];

    const points = labels.map((label, i) => ({
      label,
      value: Math.round((8_000 + rand() * 9_000 + i * 450) * scale * periodScale),
    }));
    const highlightIndex = Math.max(0, labels.length - 3);
    const cashIn = Math.round((12_201 + rand() * 1_500) * scale * periodScale);
    const cashOut = Math.round((100_799 + rand() * 9_000) * scale * periodScale * 0.62);

    const transactions = PEOPLE.map(([name, subject, category], i) => ({
      id: `TX-${4120 + i}`,
      name,
      subject,
      category,
      invited: 2 + Math.floor(rand() * 6),
      amount: Math.round((180 + rand() * 4_800) * scale * 100) / 100,
      status: STATUSES[Math.floor(rand() * STATUSES.length)]!,
      date: Date.UTC(2025, 10, 24 - i, 9 + i, Math.floor(rand() * 59)),
    }));

    return HttpResponse.json({
      kpis: {
        balance: Math.round(143_624 * scale),
        balanceDelta: Math.round((rand() * 14 - 3) * 10) / 10,
        uncategorized: Math.round(12 * scale + rand() * 6),
        employees: Math.round(7 + rand() * 4),
        weeklySpend: Math.round(3_287.49 * scale * 100) / 100,
        spendDelta: Math.round((rand() * 18 - 6) * 10) / 10,
      },
      sales: {
        cashIn,
        cashOut,
        cashInDelta: -Math.round(rand() * 120) / 10,
        cashOutDelta: Math.round(rand() * 160) / 10,
        points,
        highlightIndex,
      },
      formation: {
        progress: Math.round(55 + rand() * 30),
        businessDays: 5 + Math.floor(rand() * 4),
        step: 3,
        steps: 5,
      },
      success: {
        rate: Math.round((48 + rand() * 20) * 10) / 10,
        delta: Math.round(rand() * 80) / 10,
        total: Math.round(15_110 * scale),
        processing: Math.round(10_110 * scale),
      },
      transactions,
    });
  }),
];
