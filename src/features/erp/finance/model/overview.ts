import { z } from 'zod';

export const FINANCE_SECTIONS = ['dashboard', 'finance', 'accounts', 'payroll'] as const;
export type FinanceSection = (typeof FINANCE_SECTIONS)[number];

export const FINANCE_PERIODS = ['month', 'quarter', 'year'] as const;
export type FinancePeriod = (typeof FINANCE_PERIODS)[number];

export type FinanceFilters = { section: FinanceSection; period: FinancePeriod };

export const TRANSACTION_STATUSES = ['completed', 'pending', 'urgent', 'failed'] as const;

export const financeOverviewSchema = z.object({
  kpis: z.object({
    balance: z.number(),
    balanceDelta: z.number(),
    uncategorized: z.number(),
    employees: z.number(),
    weeklySpend: z.number(),
    spendDelta: z.number(),
  }),
  sales: z.object({
    cashIn: z.number(),
    cashOut: z.number(),
    cashInDelta: z.number(),
    cashOutDelta: z.number(),
    points: z.array(z.object({ label: z.string(), value: z.number() })),
    highlightIndex: z.number(),
  }),
  formation: z.object({
    progress: z.number(),
    businessDays: z.number(),
    step: z.number(),
    steps: z.number(),
  }),
  success: z.object({
    rate: z.number(),
    delta: z.number(),
    total: z.number(),
    processing: z.number(),
  }),
  transactions: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      subject: z.string(),
      category: z.string(),
      invited: z.number(),
      amount: z.number(),
      status: z.enum(TRANSACTION_STATUSES),
      date: z.number(),
    }),
  ),
});

export type FinanceOverview = z.infer<typeof financeOverviewSchema>;
export type FinanceTransaction = FinanceOverview['transactions'][number];
