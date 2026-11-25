import type { TreeRow } from '@/shared/components/data-table/tree-data';

import { pick, seeded } from './seed';

/* ------------------------------------------------------------- spreadsheet */

export const BUDGET_CATEGORIES = ['Hardware', 'Software', 'Services', 'Travel', 'Events'] as const;

export type BudgetLine = {
  id: string;
  item: string;
  category: string;
  owner: string;
  due: string;
  qty: number | null;
  unitCost: number | null;
  approved: boolean;
};

const BUDGET_ITEMS: Array<[string, (typeof BUDGET_CATEGORIES)[number], number, number]> = [
  ['MacBook Pro 14"', 'Hardware', 6, 2399],
  ['Studio Display', 'Hardware', 4, 1599],
  ['Figma Organization seats', 'Software', 18, 540],
  ['Linear Plus seats', 'Software', 42, 168],
  ['Datadog APM hosts', 'Software', 12, 372],
  ['SOC 2 audit', 'Services', 1, 24000],
  ['Pen test (annual)', 'Services', 1, 18500],
  ['Brand refresh agency', 'Services', 1, 32000],
  ['Offsite: Lisbon flights', 'Travel', 26, 410],
  ['Offsite: hotel nights', 'Travel', 78, 165],
  ['Customer visits (EMEA)', 'Travel', 9, 980],
  ['SaaStr booth', 'Events', 1, 14500],
  ['Meetup sponsorships', 'Events', 6, 1200],
  ['Conference tickets', 'Events', 12, 899],
  ['Standing desks', 'Hardware', 10, 649],
  ['Notion Enterprise', 'Software', 64, 192],
  ['Legal retainer', 'Services', 12, 3500],
  ['Recruiting platform', 'Software', 1, 15600],
  ['Headsets', 'Hardware', 30, 179],
  ['Team training budget', 'Services', 40, 750],
];
const OWNERS = ['Hannah Morgan', 'Ivan Serhin', 'Priya Raman', 'Lucas Meyer', 'Amara Okafor'];

export function seedBudget(): BudgetLine[] {
  const rand = seeded(7);
  return BUDGET_ITEMS.map(([item, category, qty, unitCost], i) => ({
    id: `b${i + 1}`,
    item,
    category,
    owner: pick(rand, OWNERS),
    due: `2027-${String(1 + Math.floor(rand() * 12)).padStart(2, '0')}-${String(1 + Math.floor(rand() * 27)).padStart(2, '0')}`,
    qty,
    unitCost,
    approved: rand() > 0.4,
  }));
}

/* ------------------------------------------------------------- tree (cost centers) */

export type CostCenter = {
  name: string;
  owner: string;
  headcount: number;
  budget: number;
  actual: number;
};

const leaf = (
  id: string,
  name: string,
  owner: string,
  headcount: number,
  budget: number,
  actual: number,
) => ({
  id,
  name,
  owner,
  headcount,
  budget,
  actual,
});
const group = (
  id: string,
  name: string,
  owner: string,
  children: TreeRow<CostCenter>[],
): TreeRow<CostCenter> => ({
  id,
  name,
  owner,
  headcount: 0,
  budget: 0,
  actual: 0,
  children,
});

export const COST_CENTERS: TreeRow<CostCenter>[] = [
  group('eng', 'Engineering', 'Ivan Serhin', [
    group('eng-product', 'Product engineering', 'Mia Chen', [
      leaf('eng-web', 'Web app', 'Mia Chen', 14, 2_180_000, 2_064_500),
      leaf('eng-mobile', 'Mobile', 'Raj Patel', 8, 1_240_000, 1_318_200),
      leaf('eng-growth', 'Growth', 'Lena Duarte', 5, 760_000, 702_900),
    ]),
    group('eng-platform', 'Platform', 'Tomás Reyes', [
      leaf('eng-infra', 'Infrastructure', 'Tomás Reyes', 7, 1_420_000, 1_506_300),
      leaf('eng-data', 'Data', 'Aiko Tanaka', 6, 980_000, 912_400),
      leaf('eng-sec', 'Security', 'Samuel Adeyemi', 4, 690_000, 655_000),
    ]),
  ]),
  group('gtm', 'Go-to-market', 'Hannah Morgan', [
    group('gtm-sales', 'Sales', 'Daniel Okafor', [
      leaf('gtm-ae', 'Account executives', 'Daniel Okafor', 12, 1_860_000, 1_944_100),
      leaf('gtm-sdr', 'Sales development', 'Chloe Martin', 9, 820_000, 774_600),
    ]),
    leaf('gtm-mkt', 'Marketing', 'Sofia Alvarez', 7, 1_150_000, 1_221_800),
    leaf('gtm-cs', 'Customer success', 'Priya Raman', 10, 1_020_000, 958_300),
  ]),
  group('ga', 'G&A', 'Lucas Meyer', [
    leaf('ga-fin', 'Finance', 'Lucas Meyer', 5, 640_000, 618_900),
    leaf('ga-people', 'People', 'Nora Lind', 4, 520_000, 547_200),
    leaf('ga-legal', 'Legal', 'Omar Haddad', 2, 410_000, 389_100),
  ]),
];

/* ------------------------------------------------------------- master–detail */

export type AccountInvoice = {
  number: string;
  issued: string;
  due: string;
  amount: number;
  status: 'paid' | 'open' | 'overdue';
};
export type AccountContact = { name: string; role: string; email: string };
export type Account = {
  id: string;
  name: string;
  plan: 'Starter' | 'Growth' | 'Scale';
  seats: number;
  mrr: number;
  health: number;
  renewal: string;
  invoices: AccountInvoice[];
  contacts: AccountContact[];
};

const COMPANIES = [
  'Northwind Labs',
  'Parcelpoint',
  'Lumen Health',
  'Kestrel & Co',
  'Fieldwork',
  'Copperleaf',
  'Brightline',
  'Haldane & Co',
  'Kumo Logistics',
  'Tidewater',
  'Mosaic Labs',
  'Fernway',
];
const ROLES = ['CFO', 'Head of Ops', 'Finance lead', 'VP Engineering', 'Procurement'];
const PEOPLE = [
  'Jenny Wilson',
  'Marcus Reed',
  'Aiko Tanaka',
  'Rafael Ortiz',
  'Ines Duarte',
  'Kofi Mensah',
  'Elena Rossi',
  'Arjun Nair',
];

export function seedAccounts(): Account[] {
  const rand = seeded(21);
  return COMPANIES.map((name, i) => {
    const plan = pick(rand, ['Starter', 'Growth', 'Scale'] as const);
    const seats =
      plan === 'Scale'
        ? 60 + Math.floor(rand() * 140)
        : plan === 'Growth'
          ? 15 + Math.floor(rand() * 40)
          : 3 + Math.floor(rand() * 9);
    const price = plan === 'Scale' ? 42 : plan === 'Growth' ? 24 : 12;
    const domain = name.toLowerCase().replace(/[^a-z]+/g, '');
    return {
      id: `acc-${i + 1}`,
      name,
      plan,
      seats,
      mrr: seats * price,
      health: Math.round(45 + rand() * 55),
      renewal: `2027-${String(1 + Math.floor(rand() * 12)).padStart(2, '0')}-01`,
      invoices: Array.from({ length: 3 + Math.floor(rand() * 3) }, (_, k) => {
        const month = 10 - k;
        const roll = rand();
        return {
          number: `INV-${2400 + i * 7 + k}`,
          issued: `2026-${String(month).padStart(2, '0')}-01`,
          due: `2026-${String(month).padStart(2, '0')}-15`,
          amount: seats * price,
          status: k === 0 && roll < 0.35 ? 'open' : k <= 1 && roll < 0.15 ? 'overdue' : 'paid',
        };
      }),
      contacts: Array.from({ length: 2 + Math.floor(rand() * 2) }, () => {
        const person = pick(rand, PEOPLE);
        return {
          name: person,
          role: pick(rand, ROLES),
          email: `${person.split(' ')[0]!.toLowerCase()}@${domain}.com`,
        };
      }),
    };
  });
}

/* ------------------------------------------------------------- views (project tasks) */

export const TASK_STATUSES = ['backlog', 'todo', 'in_progress', 'review', 'done'] as const;
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type ProjectTask = {
  id: string;
  key: string;
  title: string;
  project: string;
  assignee: string;
  status: (typeof TASK_STATUSES)[number];
  priority: (typeof TASK_PRIORITIES)[number];
  due: string;
  estimate: number;
  progress: number;
};

const TASK_TITLES = [
  'Migrate billing to usage-based plans',
  'Audit SSO session handling',
  'Redesign onboarding checklist',
  'Add CSV export to reports',
  'Fix flaky checkout test',
  'Write Q4 pricing FAQ',
  'Instrument funnel events',
  'Cache dashboard queries',
  'Localize emails to Spanish',
  'Archive stale workspaces',
  'Ship scheduled reports',
  'Refactor permissions model',
  'Improve table virtualization',
  'Draft incident runbook',
  'Interview senior designer',
  'Prepare board metrics deck',
  'Upgrade Postgres to 17',
  'Review vendor contracts',
  'Polish dark mode charts',
  'Set up status page',
  'Clean up feature flags',
  'Accessibility audit: forms',
  'Rotate API keys',
  'Customer advisory call',
];
const PROJECTS = ['Atlas', 'Billing v2', 'Growth', 'Platform', 'Ops'];
const ASSIGNEES = [
  'Hannah Morgan',
  'Ivan Serhin',
  'Mia Chen',
  'Raj Patel',
  'Lena Duarte',
  'Tomás Reyes',
];

export function seedTasks(): ProjectTask[] {
  const rand = seeded(42);
  return TASK_TITLES.map((title, i) => {
    const status = pick(rand, TASK_STATUSES);
    return {
      id: `t${i + 1}`,
      key: `${pick(rand, ['ATL', 'BIL', 'GRO', 'PLT', 'OPS'])}-${100 + i * 3}`,
      title,
      project: pick(rand, PROJECTS),
      assignee: pick(rand, ASSIGNEES),
      status,
      priority: pick(rand, TASK_PRIORITIES),
      due: `2026-${String(11 + Math.floor(rand() * 2)).padStart(2, '0')}-${String(1 + Math.floor(rand() * 28)).padStart(2, '0')}`,
      estimate: [1, 2, 3, 5, 8][Math.floor(rand() * 5)]!,
      progress: status === 'done' ? 100 : status === 'backlog' ? 0 : Math.round(10 + rand() * 80),
    };
  });
}

/* ------------------------------------------------------------- reorder (backlog) */

export type BacklogItem = {
  id: string;
  title: string;
  votes: number;
  effort: 'S' | 'M' | 'L';
  segment: string;
};

export const BACKLOG: BacklogItem[] = [
  {
    id: 'r1',
    title: 'Saved filters shared across a team',
    votes: 184,
    effort: 'M',
    segment: 'Enterprise',
  },
  { id: 'r2', title: 'Scheduled PDF reports', votes: 156, effort: 'L', segment: 'All' },
  { id: 'r3', title: 'SCIM user provisioning', votes: 131, effort: 'M', segment: 'Enterprise' },
  {
    id: 'r4',
    title: 'Slack alerts with chart previews',
    votes: 117,
    effort: 'S',
    segment: 'Growth',
  },
  { id: 'r5', title: 'Custom fiscal year', votes: 94, effort: 'S', segment: 'Finance' },
  { id: 'r6', title: 'Row-level permissions', votes: 88, effort: 'L', segment: 'Enterprise' },
  { id: 'r7', title: 'Embeddable dashboards', votes: 76, effort: 'L', segment: 'Growth' },
  { id: 'r8', title: 'Annotations on charts', votes: 61, effort: 'S', segment: 'All' },
];

/* ------------------------------------------------------------- financial (P&L) */

export const MONTHS = [
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
  'Dec',
] as const;

export type PnlLine = {
  id: string;
  line: string;
  section: 'revenue' | 'cogs' | 'opex';
  /** Monthly values in USD; costs are negative. */
  values: number[];
  budget: number;
};

export function seedPnl(): PnlLine[] {
  const rand = seeded(99);
  const series = (base: number, growth: number, noise: number) =>
    MONTHS.map((_, m) => Math.round(base * (1 + growth * m) * (1 + (rand() - 0.5) * noise)));
  const lines: Array<[string, string, PnlLine['section'], number, number, number]> = [
    ['subs', 'Subscriptions', 'revenue', 412_000, 0.035, 0.06],
    ['services', 'Professional services', 'revenue', 58_000, 0.01, 0.4],
    ['usage', 'Usage overages', 'revenue', 31_000, 0.05, 0.3],
    ['hosting', 'Hosting & infrastructure', 'cogs', -62_000, 0.02, 0.1],
    ['support', 'Support team', 'cogs', -41_000, 0.01, 0.05],
    ['rnd', 'Research & development', 'opex', -168_000, 0.015, 0.05],
    ['sm', 'Sales & marketing', 'opex', -142_000, 0.02, 0.15],
    ['ga', 'General & administrative', 'opex', -73_000, 0.005, 0.08],
  ];
  return lines.map(([id, line, section, base, growth, noise]) => {
    const values = series(base, growth, noise);
    const total = values.reduce((a, b) => a + b, 0);
    return { id, line, section, values, budget: Math.round(total * (0.93 + rand() * 0.12)) };
  });
}
