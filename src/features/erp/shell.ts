import {
  BookPlus,
  CircleAlert,
  FilePlus2,
  FileSignature,
  Landmark,
  PiggyBank,
  Receipt,
  Scale,
  ShoppingCart,
} from 'lucide-react';

import type { FeatureWorkspace } from '@/core/feature/define-feature';

import { erpRoutes as r } from './routes';

/**
 * Header extras of the ERP workspace: the notification feed (sample data:
 * replace `items` with a query against your notifications endpoint), the
 * "Create" menu and the account menu links.
 */
export const shell = {
  notifications: {
    categories: [
      { id: 'approvals', label: (t) => t('erp:shell.categories.approvals') },
      { id: 'finance', label: (t) => t('erp:shell.categories.finance') },
      { id: 'purchasing', label: (t) => t('erp:shell.categories.purchasing') },
    ],
    items: [
      {
        id: 'po',
        category: 'approvals',
        icon: FileSignature,
        tone: 'warning',
        actor: 'Daniel Kim',
        title: (t) => t('erp:shell.notifications.po.title'),
        body: (t) => t('erp:shell.notifications.po.body'),
        minutesAgo: 15,
        to: r.purchaseOrders.href(),
        unread: true,
      },
      {
        id: 'expense',
        category: 'approvals',
        icon: Receipt,
        tone: 'primary',
        title: (t) => t('erp:shell.notifications.expense.title'),
        body: (t) => t('erp:shell.notifications.expense.body'),
        minutesAgo: 50,
        to: r.expenseClaims.href(),
        unread: true,
      },
      {
        id: 'overdue',
        category: 'finance',
        icon: CircleAlert,
        tone: 'danger',
        title: (t) => t('erp:shell.notifications.overdue.title'),
        body: (t) => t('erp:shell.notifications.overdue.body'),
        minutesAgo: 120,
        to: r.receivables.href(),
        unread: true,
      },
      {
        id: 'recon',
        category: 'finance',
        icon: Scale,
        tone: 'success',
        title: (t) => t('erp:shell.notifications.recon.title'),
        body: (t) => t('erp:shell.notifications.recon.body'),
        minutesAgo: 360,
        to: r.reconciliation.href(),
      },
      {
        id: 'budget',
        category: 'finance',
        icon: PiggyBank,
        tone: 'warning',
        title: (t) => t('erp:shell.notifications.budget.title'),
        body: (t) => t('erp:shell.notifications.budget.body'),
        minutesAgo: 1740,
        to: r.budgets.href(),
      },
      {
        id: 'payment',
        category: 'purchasing',
        icon: Landmark,
        title: (t) => t('erp:shell.notifications.payment.title'),
        body: (t) => t('erp:shell.notifications.payment.body'),
        minutesAgo: 2880,
        to: r.payables.href(),
      },
    ],
    viewAllTo: r.overview.href(),
  },
  quickActions: [
    {
      id: 'invoice',
      to: r.invoices.href(),
      icon: FilePlus2,
      label: (t) => t('erp:shell.create.invoice.label'),
      description: (t) => t('erp:shell.create.invoice.description'),
    },
    {
      id: 'journal',
      to: r.journalNew.href(),
      icon: BookPlus,
      label: (t) => t('erp:shell.create.journal.label'),
      description: (t) => t('erp:shell.create.journal.description'),
    },
    {
      id: 'po',
      to: r.purchaseOrders.href(),
      icon: ShoppingCart,
      label: (t) => t('erp:shell.create.po.label'),
      description: (t) => t('erp:shell.create.po.description'),
    },
    {
      id: 'expense',
      to: r.expenseClaims.href(),
      icon: Receipt,
      label: (t) => t('erp:shell.create.expense.label'),
      description: (t) => t('erp:shell.create.expense.description'),
    },
  ],
  accountLinks: [
    {
      id: 'approvals',
      to: r.purchaseOrders.href(),
      icon: FileSignature,
      label: (t) => t('erp:shell.account.approvals'),
    },
    {
      id: 'expenses',
      to: r.expenseClaims.href(),
      icon: Receipt,
      label: (t) => t('erp:shell.account.expenses'),
    },
  ],
} satisfies Pick<FeatureWorkspace, 'notifications' | 'quickActions' | 'accountLinks'>;
