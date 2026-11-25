import { http, HttpResponse, type HttpHandler } from 'msw';

import { env } from '@/core/config/env';

import { networkDelay, requireAuth } from '../utils';

import { DAY, invoices, iso, round2, seeded, TODAY } from './erp-trade';

type Kind = 'inflow' | 'outflow';
type Confidence = 'committed' | 'expected' | 'estimated';
type Scenario = 'base' | 'optimistic' | 'pessimistic';
type Item = {
  id: string;
  date: string;
  kind: Kind;
  category: string;
  counterparty: string;
  amount: number;
  confidence: Confidence;
};

const WEEKS = 13;
const HORIZON = TODAY + WEEKS * 7 * DAY;
const OPENING_BALANCE = 1_284_000;

/** Dates of a recurring flow inside the horizon, every `step` days or on a day of the month. */
function schedule(step: number | { dayOfMonth: number }) {
  const dates: number[] = [];
  if (typeof step === 'number') {
    for (let ms = TODAY + 2 * DAY; ms < HORIZON; ms += step * DAY) dates.push(ms);
  } else {
    const d = new Date(TODAY);
    for (let m = 0; m < 4; m++) {
      const ms = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + m, step.dayOfMonth);
      if (ms >= TODAY && ms < HORIZON) dates.push(ms);
    }
  }
  return dates;
}

const RECURRING: Array<
  [string, string, Kind, Confidence, number, number | { dayOfMonth: number }]
> = [
  ['payroll', 'Gusto payroll', 'outflow', 'committed', 148_000, 14],
  ['rent', 'Reno Industrial Park LLC', 'outflow', 'committed', 38_500, { dayOfMonth: 1 }],
  ['debt', 'First Harbor Bank — term loan', 'outflow', 'committed', 12_400, { dayOfMonth: 15 }],
  ['software', 'SaaS subscriptions', 'outflow', 'expected', 18_000, { dayOfMonth: 5 }],
  ['suppliers', 'Supplier payment run', 'outflow', 'estimated', 52_000, 7],
  ['bookings', 'New bookings (pipeline)', 'inflow', 'estimated', 64_000, 7],
];

/** Built per request so invoices raised from sales orders show up as receipts. */
const plannedItems = () =>
  (
    [
      ...invoices
        .filter((inv) => inv.status === 'open' || inv.status === 'overdue')
        .map((inv, i) => {
          const rand = seeded(`receipt:${inv.id}`);
          const due = Date.parse(inv.due);
          const ms = due > TODAY ? due + Math.floor(rand() * 6) * DAY : TODAY + (2 + i * 3) * DAY;
          return {
            id: `RCP-${inv.id.slice(4)}`,
            date: iso(ms),
            kind: 'inflow' as const,
            category: 'receipts',
            counterparty: `${inv.customer} · ${inv.id}`,
            amount: round2(inv.amount - inv.paid),
            confidence: due > TODAY ? ('expected' as const) : ('estimated' as const),
          };
        })
        .filter((item) => Date.parse(item.date) < HORIZON),
      ...RECURRING.flatMap(([category, counterparty, kind, confidence, amount, step]) =>
        schedule(step).map((ms, n) => {
          const rand = seeded(`${category}:${n}`);
          return {
            id: `${category.slice(0, 3).toUpperCase()}-${n + 1}`,
            date: iso(ms),
            kind,
            category,
            counterparty,
            amount: confidence === 'committed' ? amount : round2(amount * (0.7 + rand() * 0.6)),
            confidence,
          };
        }),
      ),
      {
        id: 'TAX-Q4',
        date: '2027-01-15',
        kind: 'outflow',
        category: 'tax',
        counterparty: 'IRS — estimated tax Q4',
        amount: 92_000,
        confidence: 'committed',
      },
    ] satisfies Item[]
  ).sort((a, b) => a.date.localeCompare(b.date));

/** Uncertain inflows swing more than outflows; committed amounts never move. */
function adjust(item: Item, scenario: Scenario) {
  if (item.confidence === 'committed' || scenario === 'base') return item.amount;
  const swing = (item.confidence === 'expected' ? 0.08 : 0.2) * (item.kind === 'inflow' ? 1 : 0.5);
  const direction = (scenario === 'optimistic' ? 1 : -1) * (item.kind === 'inflow' ? 1 : -1);
  return round2(item.amount * (1 + swing * direction));
}

function forecast(scenario: Scenario) {
  const rows = plannedItems().map((item) => ({
    ...item,
    amount: adjust(item, scenario),
    week: Math.floor((Date.parse(item.date) - TODAY) / (7 * DAY)) + 1,
  }));
  let balance = OPENING_BALANCE;
  const weeks = Array.from({ length: WEEKS }, (_, i) => {
    const sum = (kind: Kind) =>
      round2(
        rows.filter((r) => r.week === i + 1 && r.kind === kind).reduce((s, r) => s + r.amount, 0),
      );
    const opening = balance;
    const inflow = sum('inflow');
    const outflow = sum('outflow');
    balance = round2(opening + inflow - outflow);
    return {
      week: i + 1,
      start: iso(TODAY + i * 7 * DAY),
      inflow,
      outflow,
      opening,
      closing: balance,
    };
  });
  return { scenario, minimumCash: 400_000, weeks, items: rows };
}

export const erpForecastHandlers: HttpHandler[] = [
  http.get(`${env.API_URL}/erp/cash-forecast`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const scenario = new URL(request.url).searchParams.get('scenario');
    const valid = scenario === 'optimistic' || scenario === 'pessimistic';
    return HttpResponse.json(forecast(valid ? scenario : 'base'));
  }),
];
