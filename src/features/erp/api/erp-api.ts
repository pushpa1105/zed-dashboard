import { keepPreviousData, queryOptions, useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/core/api/client';
import { useTranslation } from '@/core/i18n/use-translation';

import {
  accountNodeSchema,
  accountOptionSchema,
  budgetsSchema,
  invoiceDetailSchema,
  invoicesResponseSchema,
  journalEntrySchema,
  payableSchema,
  statementSchema,
  vendorSchema,
  type InvoiceFilters,
  type JournalEntryInput,
  type PayableAction,
  type StatementKind,
} from '../model/erp';

/** Plain request functions (no React): reusable in loaders and tests. */
export const erpApi = {
  accounts: () => api.get('/erp/accounts', z.array(accountNodeSchema)),
  accountOptions: () => api.get('/erp/accounts/leaves', z.array(accountOptionSchema)),
  journal: (status?: 'posted' | 'draft') =>
    api.get('/erp/journal', z.array(journalEntrySchema), { params: { status } }),
  createEntry: (input: JournalEntryInput) => api.post('/erp/journal', input, journalEntrySchema),
  budgets: (quarter: number) => api.get('/erp/budgets', budgetsSchema, { params: { quarter } }),
  statement: (kind: StatementKind) => api.get(`/erp/reports/${kind}`, statementSchema),
  invoices: (filters: InvoiceFilters) =>
    api.get('/erp/invoices', invoicesResponseSchema, { params: filters }),
  invoice: (id: string) => api.get(`/erp/invoices/${id}`, invoiceDetailSchema),
  invoiceAction: ({
    id,
    action,
    amount,
  }: {
    id: string;
    action: 'remind' | 'payment';
    amount?: number;
  }) => api.post(`/erp/invoices/${id}/actions`, { action, amount }, invoiceDetailSchema),
  payables: () => api.get('/erp/payables', z.array(payableSchema)),
  payableAction: ({ id, action, note }: { id: string; action: PayableAction; note?: string }) =>
    api.patch(`/erp/payables/${id}`, { action, note }, payableSchema),
  vendors: () => api.get('/erp/vendors', z.array(vendorSchema)),
};

export const erpKeys = {
  all: ['erp'] as const,
  accounts: () => [...erpKeys.all, 'accounts'] as const,
  accountOptions: () => [...erpKeys.all, 'account-options'] as const,
  journal: (status?: string) => [...erpKeys.all, 'journal', status ?? 'all'] as const,
  budgets: (quarter: number) => [...erpKeys.all, 'budgets', quarter] as const,
  statement: (kind: StatementKind) => [...erpKeys.all, 'statement', kind] as const,
  invoices: (filters?: InvoiceFilters) =>
    filters
      ? ([...erpKeys.all, 'invoices', filters] as const)
      : ([...erpKeys.all, 'invoices'] as const),
  invoice: (id: string) => [...erpKeys.all, 'invoice', id] as const,
  payables: () => [...erpKeys.all, 'payables'] as const,
  vendors: () => [...erpKeys.all, 'vendors'] as const,
};

export const accountsQuery = () =>
  queryOptions({ queryKey: erpKeys.accounts(), queryFn: erpApi.accounts });
export const accountOptionsQuery = () =>
  queryOptions({
    queryKey: erpKeys.accountOptions(),
    queryFn: erpApi.accountOptions,
    staleTime: Infinity,
  });
export const journalQuery = (status?: 'posted' | 'draft') =>
  queryOptions({
    queryKey: erpKeys.journal(status),
    queryFn: () => erpApi.journal(status),
    placeholderData: keepPreviousData,
  });
export const budgetsQuery = (quarter: number) =>
  queryOptions({
    queryKey: erpKeys.budgets(quarter),
    queryFn: () => erpApi.budgets(quarter),
    placeholderData: keepPreviousData,
  });
export const statementQuery = (kind: StatementKind) =>
  queryOptions({ queryKey: erpKeys.statement(kind), queryFn: () => erpApi.statement(kind) });
export const invoicesQuery = (filters: InvoiceFilters) =>
  queryOptions({
    queryKey: erpKeys.invoices(filters),
    queryFn: () => erpApi.invoices(filters),
    placeholderData: keepPreviousData,
  });
export const invoiceQuery = (id: string) =>
  queryOptions({ queryKey: erpKeys.invoice(id), queryFn: () => erpApi.invoice(id) });
export const payablesQuery = () =>
  queryOptions({ queryKey: erpKeys.payables(), queryFn: erpApi.payables });
export const vendorsQuery = () =>
  queryOptions({ queryKey: erpKeys.vendors(), queryFn: erpApi.vendors });

export const useAccounts = () => useQuery(accountsQuery());
export const useAccountOptions = () => useQuery(accountOptionsQuery());
export const useJournal = (status?: 'posted' | 'draft') => useQuery(journalQuery(status));
export const useBudgets = (quarter: number) => useQuery(budgetsQuery(quarter));
export const useStatement = (kind: StatementKind) => useQuery(statementQuery(kind));
export const useInvoices = (filters: InvoiceFilters) => useQuery(invoicesQuery(filters));
export const useInvoice = (id: string) => useQuery(invoiceQuery(id));
export const usePayables = () => useQuery(payablesQuery());
export const useVendors = () => useQuery(vendorsQuery());

export function useCreateJournalEntry() {
  const { t } = useTranslation('erp');
  return useMutation({
    mutationFn: erpApi.createEntry,
    meta: {
      invalidates: [[...erpKeys.all, 'journal']],
      successMessage: t('journal.form.saved'),
      errorMessage: t('journal.form.saveFailed'),
    },
  });
}

export function useInvoiceAction() {
  const { t } = useTranslation('erp');
  return useMutation({
    mutationFn: erpApi.invoiceAction,
    meta: { invalidates: [erpKeys.invoices()], errorMessage: t('invoices.actionFailed') },
  });
}

export function usePayableAction() {
  const { t } = useTranslation('erp');
  return useMutation({
    mutationFn: erpApi.payableAction,
    meta: {
      invalidates: [erpKeys.payables(), erpKeys.vendors()],
      errorMessage: t('payables.actionFailed'),
    },
  });
}
