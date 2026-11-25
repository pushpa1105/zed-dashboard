import { http, HttpResponse, type HttpHandler } from 'msw';

import { env } from '@/core/config/env';

import { errorResponse, networkDelay, requireAuth } from '../utils';

/* -------------------------------------------------------------------------- */
/*  Chart of accounts                                                          */
/* -------------------------------------------------------------------------- */

type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
type Leaf = [code: string, name: string, debit: number, credit: number];
type Group = { code: string; name: string; type: AccountType; children: Array<Group | Leaf> };

/** Period activity (debit, credit) per leaf account, FY2026 to date. */
const CHART: Group[] = [
  {
    code: '1000',
    name: 'Assets',
    type: 'asset',
    children: [
      {
        code: '1100',
        name: 'Current assets',
        type: 'asset',
        children: [
          ['1110', 'Cash — Operating (Chase ••4821)', 2_418_330, 2_101_644],
          ['1120', 'Cash — Payroll (Chase ••9930)', 902_000, 868_412],
          ['1130', 'Accounts receivable', 1_384_920, 1_092_115],
          ['1140', 'Inventory — finished goods', 642_810, 511_207],
          ['1150', 'Prepaid expenses', 96_400, 58_250],
        ],
      },
      {
        code: '1500',
        name: 'Fixed assets',
        type: 'asset',
        children: [
          ['1510', 'Warehouse equipment', 312_000, 0],
          ['1520', 'Delivery vehicles', 186_500, 0],
          ['1590', 'Accumulated depreciation', 0, 74_320],
        ],
      },
    ],
  },
  {
    code: '2000',
    name: 'Liabilities',
    type: 'liability',
    children: [
      {
        code: '2100',
        name: 'Current liabilities',
        type: 'liability',
        children: [
          ['2110', 'Accounts payable', 734_200, 918_655],
          ['2120', 'Accrued payroll', 412_000, 455_870],
          ['2130', 'Sales tax payable', 88_140, 112_906],
          ['2140', 'Corporate card — Amex', 61_530, 79_018],
        ],
      },
      {
        code: '2500',
        name: 'Long-term liabilities',
        type: 'liability',
        children: [['2510', 'Term loan — SVB', 120_000, 600_000]],
      },
    ],
  },
  {
    code: '3000',
    name: 'Equity',
    type: 'equity',
    children: [
      ['3100', 'Common stock', 0, 250_000],
      ['3200', 'Retained earnings', 0, 9_554],
    ],
  },
  {
    code: '4000',
    name: 'Revenue',
    type: 'revenue',
    children: [
      ['4100', 'Product sales', 18_220, 2_046_310],
      ['4200', 'Implementation services', 0, 318_450],
      ['4300', 'Subscriptions', 4_100, 612_880],
    ],
  },
  {
    code: '5000',
    name: 'Cost of goods sold',
    type: 'expense',
    children: [
      ['5100', 'Materials & components', 884_620, 12_400],
      ['5200', 'Freight in', 96_310, 0],
    ],
  },
  {
    code: '6000',
    name: 'Operating expenses',
    type: 'expense',
    children: [
      ['6100', 'Salaries & benefits', 1_102_440, 0],
      ['6200', 'Rent — Reno DC & HQ', 216_000, 0],
      ['6300', 'Software & cloud', 128_906, 3_200],
      ['6400', 'Marketing', 174_215, 0],
      ['6500', 'Travel & meals', 41_870, 1_150],
      ['6600', 'Depreciation', 74_320, 0],
      ['6700', 'Insurance', 26_510, 0],
    ],
  },
];

type AccountNode = {
  code: string;
  name: string;
  type: AccountType;
  debit: number;
  credit: number;
  balance: number;
  children?: AccountNode[];
};

/** Normal balance: debit-positive for assets/expenses, credit-positive otherwise. */
const normal = (type: AccountType, debit: number, credit: number) =>
  type === 'asset' || type === 'expense' ? debit - credit : credit - debit;

function build(group: Group, type: AccountType = group.type): AccountNode {
  const children = group.children.map((child) => {
    if (Array.isArray(child)) {
      const [code, name, debit, credit] = child;
      return { code, name, type, debit, credit, balance: normal(type, debit, credit) };
    }
    return build(child, child.type);
  });
  const debit = children.reduce((s, c) => s + c.debit, 0);
  const credit = children.reduce((s, c) => s + c.credit, 0);
  return {
    code: group.code,
    name: group.name,
    type,
    debit,
    credit,
    balance: normal(type, debit, credit),
    children,
  };
}

const ACCOUNTS = CHART.map((g) => build(g));
const LEAVES: Array<{ code: string; name: string }> = [];
const collect = (nodes: AccountNode[]) =>
  nodes.forEach((n) => (n.children ? collect(n.children) : LEAVES.push(n)));
collect(ACCOUNTS);
const accountName = (code: string) => LEAVES.find((a) => a.code === code)?.name ?? code;

/* -------------------------------------------------------------------------- */
/*  Journal                                                                    */
/* -------------------------------------------------------------------------- */

type JournalLine = { account: string; accountName: string; debit: number; credit: number };
type JournalEntry = {
  id: string;
  date: string;
  memo: string;
  reference: string;
  status: 'posted' | 'draft';
  author: string;
  lines: JournalLine[];
};

const line = (account: string, debit: number, credit: number): JournalLine => ({
  account,
  accountName: accountName(account),
  debit,
  credit,
});

const journal: JournalEntry[] = [
  [
    '2026-11-24',
    'November payroll — salaried staff',
    'PR-11B',
    'posted',
    'Priya Raman',
    [line('6100', 186_420, 0), line('1120', 0, 186_420)],
  ],
  [
    '2026-11-22',
    'Stripe payout reconciliation',
    'STR-0412',
    'posted',
    'Sofia Alvarez',
    [line('1110', 48_212.4, 0), line('1130', 0, 48_212.4)],
  ],
  [
    '2026-11-21',
    'Northwind components — PO 5304 receipt',
    'BILL-8807',
    'posted',
    'Daniel Okafor',
    [line('1140', 32_480, 0), line('5200', 1_240, 0), line('2110', 0, 33_720)],
  ],
  [
    '2026-11-20',
    'Monthly depreciation — equipment & vehicles',
    'DEP-11',
    'posted',
    'Daniel Okafor',
    [line('6600', 6_850, 0), line('1590', 0, 6_850)],
  ],
  [
    '2026-11-18',
    'AWS invoice November',
    'AWS-1125',
    'draft',
    'Tom Becker',
    [line('6300', 14_906.22, 0), line('2140', 0, 14_906.22)],
  ],
  [
    '2026-11-15',
    'Q4 rent — Reno DC',
    'RENT-Q4',
    'posted',
    'Lucas Meyer',
    [line('6200', 54_000, 0), line('1110', 0, 54_000)],
  ],
  [
    '2026-11-12',
    'Sales tax remittance — Nevada',
    'TAX-NV-10',
    'posted',
    'Priya Raman',
    [line('2130', 21_388.6, 0), line('1110', 0, 21_388.6)],
  ],
  [
    '2026-11-08',
    'Prepaid insurance amortization',
    'INS-11',
    'posted',
    'Lucas Meyer',
    [line('6700', 2_410, 0), line('1150', 0, 2_410)],
  ],
  [
    '2026-11-05',
    'Term loan repayment',
    'SVB-0011',
    'posted',
    'Sofia Alvarez',
    [line('2510', 10_000, 0), line('1110', 0, 10_000)],
  ],
  [
    '2026-11-02',
    'Accrued bonus — Q4 estimate',
    'ACC-Q4',
    'draft',
    'Priya Raman',
    [line('6100', 42_000, 0), line('2120', 0, 42_000)],
  ],
].map(([date, memo, reference, status, author, lines], i) => ({
  id: `JE-${1050 - i}`,
  date: date as string,
  memo: memo as string,
  reference: reference as string,
  status: status as JournalEntry['status'],
  author: author as string,
  lines: lines as JournalLine[],
}));

/* -------------------------------------------------------------------------- */
/*  Budgets                                                                    */
/* -------------------------------------------------------------------------- */

const DEPARTMENTS: Array<[string, string, number, number[]]> = [
  // department, owner, annual budget, actual by quarter
  ['Engineering', 'Ivan Serhin', 1_840_000, [438_200, 451_900, 472_310, 301_440]],
  ['Sales', 'Megan Clark', 920_000, [214_800, 236_150, 251_920, 198_630]],
  ['Marketing', 'Hannah Morgan', 640_000, [131_400, 176_920, 182_240, 160_115]],
  ['Operations', 'Lucas Meyer', 780_000, [188_950, 192_300, 201_480, 142_020]],
  ['Customer success', 'Amara Okafor', 410_000, [96_200, 101_850, 99_410, 71_330]],
  ['Finance & legal', 'Priya Raman', 360_000, [84_900, 91_200, 88_040, 79_610]],
  ['People', 'Aiko Tanaka', 290_000, [61_100, 74_380, 70_820, 58_960]],
];

/* -------------------------------------------------------------------------- */
/*  Statements                                                                 */
/* -------------------------------------------------------------------------- */

type StatementLine = { label: string; values: number[] };
type StatementSection = { id: string; label: string; lines: StatementLine[]; total: StatementLine };

const QUARTERS = ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026 (QTD)'];
const q = (a: number, b: number, c: number, d: number) => [a, b, c, d];
const sum = (...rows: number[][]) => rows[0]!.map((_, i) => rows.reduce((s, r) => s + r[i]!, 0));
const neg = (row: number[]) => row.map((v) => -v);

function profitAndLoss() {
  const revenue = [
    { label: 'Product sales', values: q(468_220, 512_940, 566_380, 480_550) },
    { label: 'Implementation services', values: q(71_400, 82_150, 88_900, 76_000) },
    { label: 'Subscriptions', values: q(138_200, 148_640, 159_910, 161_930) },
  ];
  const cogs = [
    { label: 'Materials & components', values: q(201_330, 219_610, 238_440, 212_840) },
    { label: 'Freight in', values: q(22_910, 24_100, 26_770, 22_530) },
  ];
  const opex = [
    { label: 'Salaries & benefits', values: q(262_400, 271_880, 288_100, 280_060) },
    { label: 'Rent', values: q(54_000, 54_000, 54_000, 54_000) },
    { label: 'Software & cloud', values: q(29_840, 31_220, 33_906, 30_740) },
    { label: 'Marketing', values: q(36_500, 48_115, 51_400, 38_200) },
    { label: 'Travel & meals', values: q(8_910, 11_420, 12_060, 8_330) },
  ];
  const revenueTotal = sum(...revenue.map((l) => l.values));
  const cogsTotal = sum(...cogs.map((l) => l.values));
  const gross = sum(revenueTotal, neg(cogsTotal));
  const opexTotal = sum(...opex.map((l) => l.values));
  const operating = sum(gross, neg(opexTotal));
  const other = [
    { label: 'Interest expense', values: q(-6_120, -5_980, -5_840, -3_870) },
    { label: 'FX gain / (loss)', values: q(1_240, -2_310, 860, 410) },
  ];
  const otherTotal = sum(...other.map((l) => l.values));
  const net = sum(operating, otherTotal);
  const sections: StatementSection[] = [
    {
      id: 'revenue',
      label: 'Revenue',
      lines: revenue,
      total: { label: 'Total revenue', values: revenueTotal },
    },
    {
      id: 'cogs',
      label: 'Cost of goods sold',
      lines: cogs,
      total: { label: 'Total cost of goods sold', values: cogsTotal },
    },
    {
      id: 'gross',
      label: 'Gross profit',
      lines: [],
      total: { label: 'Gross profit', values: gross },
    },
    {
      id: 'opex',
      label: 'Operating expenses',
      lines: opex,
      total: { label: 'Total operating expenses', values: opexTotal },
    },
    {
      id: 'operating',
      label: 'Operating income',
      lines: [],
      total: { label: 'Operating income', values: operating },
    },
    {
      id: 'other',
      label: 'Other income & expense',
      lines: other,
      total: { label: 'Total other', values: otherTotal },
    },
    { id: 'net', label: 'Net income', lines: [], total: { label: 'Net income', values: net } },
  ];
  return { columns: QUARTERS, sections };
}

function balanceSheet() {
  const columns = ['Nov 30, 2026', 'Sep 30, 2026', 'Jun 30, 2026'];
  const v = (a: number, b: number, c: number) => [a, b, c];
  const current = [
    { label: 'Cash and equivalents', values: v(350_274, 312_880, 268_410) },
    { label: 'Accounts receivable', values: v(292_805, 318_420, 276_150) },
    { label: 'Inventory', values: v(131_603, 142_910, 128_330) },
    { label: 'Prepaid expenses', values: v(38_150, 41_200, 29_870) },
  ];
  const fixed = [
    { label: 'Equipment & vehicles', values: v(498_500, 498_500, 461_200) },
    { label: 'Accumulated depreciation', values: v(-74_320, -60_620, -47_100) },
  ];
  const liabilities = [
    { label: 'Accounts payable', values: v(184_455, 201_330, 176_900) },
    { label: 'Accrued payroll', values: v(43_870, 52_100, 38_420) },
    { label: 'Sales tax payable', values: v(24_766, 21_388, 19_940) },
    { label: 'Corporate card', values: v(17_488, 12_930, 15_210) },
    { label: 'Term loan', values: v(480_000, 500_000, 520_000) },
  ];
  const currentTotal = sum(...current.map((l) => l.values));
  const fixedTotal = sum(...fixed.map((l) => l.values));
  const assets = sum(currentTotal, fixedTotal);
  const liabilitiesTotal = sum(...liabilities.map((l) => l.values));
  const equityLines = [
    { label: 'Common stock', values: v(250_000, 250_000, 250_000) },
    {
      label: 'Retained earnings',
      values: sum(assets, neg(liabilitiesTotal), v(-250_000, -250_000, -250_000)),
    },
  ];
  const equity = sum(...equityLines.map((l) => l.values));
  const sections: StatementSection[] = [
    {
      id: 'current',
      label: 'Current assets',
      lines: current,
      total: { label: 'Total current assets', values: currentTotal },
    },
    {
      id: 'fixed',
      label: 'Fixed assets',
      lines: fixed,
      total: { label: 'Total fixed assets', values: fixedTotal },
    },
    {
      id: 'assets',
      label: 'Total assets',
      lines: [],
      total: { label: 'Total assets', values: assets },
    },
    {
      id: 'liabilities',
      label: 'Liabilities',
      lines: liabilities,
      total: { label: 'Total liabilities', values: liabilitiesTotal },
    },
    {
      id: 'equity',
      label: 'Equity',
      lines: equityLines,
      total: { label: 'Total equity', values: equity },
    },
    {
      id: 'le',
      label: 'Liabilities & equity',
      lines: [],
      total: { label: 'Total liabilities & equity', values: sum(liabilitiesTotal, equity) },
    },
  ];
  return { columns, sections };
}

/* -------------------------------------------------------------------------- */
/*  Handlers                                                                   */
/* -------------------------------------------------------------------------- */

const base = `${env.API_URL}/erp`;

export const erpLedgerHandlers: HttpHandler[] = [
  http.get(`${base}/accounts`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    return HttpResponse.json(ACCOUNTS);
  }),

  http.get(`${base}/accounts/leaves`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    return HttpResponse.json(LEAVES.map(({ code, name }) => ({ code, name })));
  }),

  http.get(`${base}/journal`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const status = new URL(request.url).searchParams.get('status');
    return HttpResponse.json(status ? journal.filter((e) => e.status === status) : journal);
  }),

  http.post<
    never,
    {
      date: string;
      memo: string;
      reference: string;
      post: boolean;
      lines: Array<{ account: string; debit: number; credit: number }>;
    }
  >(`${base}/journal`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const body = await request.json();
    const lines = body.lines.filter((l) => l.debit || l.credit);
    const debit = lines.reduce((s, l) => s + l.debit, 0);
    const credit = lines.reduce((s, l) => s + l.credit, 0);
    if (lines.length < 2 || Math.abs(debit - credit) > 0.005) {
      return errorResponse('Debits and credits must balance', 422);
    }
    const entry: JournalEntry = {
      id: `JE-${1051 + journal.length - 10}`,
      date: body.date,
      memo: body.memo,
      reference: body.reference,
      status: body.post ? 'posted' : 'draft',
      author: `${auth.user.firstName} ${auth.user.lastName}`,
      lines: lines.map((l) => line(l.account, l.debit, l.credit)),
    };
    journal.unshift(entry);
    return HttpResponse.json(entry, { status: 201 });
  }),

  http.get(`${base}/budgets`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const quarter = Number(new URL(request.url).searchParams.get('quarter') ?? 4);
    const qi = Math.min(Math.max(quarter, 1), 4) - 1;
    return HttpResponse.json({
      quarter: qi + 1,
      departments: DEPARTMENTS.map(([name, owner, annual, actuals]) => {
        const elapsed = 1;
        const budget = Math.round((annual / 4) * elapsed);
        const actual = actuals[qi]!;
        const ytdBudget = Math.round((annual / 4) * (qi + elapsed));
        const ytdActual = actuals.slice(0, qi + 1).reduce((s, v) => s + v, 0);
        return { name, owner, annual, budget, actual, ytdBudget, ytdActual };
      }),
    });
  }),

  http.get(`${base}/reports/:statement`, async ({ request, params }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    return HttpResponse.json(params.statement === 'balance' ? balanceSheet() : profitAndLoss());
  }),
];
