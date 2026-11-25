import {
  ArrowLeftRight,
  BookOpenText,
  BriefcaseBusiness,
  Building2,
  ChartNoAxesCombined,
  Factory,
  FileSpreadsheet,
  FolderKanban,
  Landmark,
  LayoutDashboard,
  ReceiptText,
  Scale,
  ShoppingCart,
  Target,
  WalletCards,
} from 'lucide-react';

import { defineFeature } from '@/core/feature/define-feature';

import en from './i18n/en.json';
import { erpRoutes as r } from './routes';
import { shell } from './shell';

export default defineFeature({
  id: 'erp',
  i18n: { en },
  workspace: {
    basePath: '/erp',
    name: (t) => t('erp:workspace.name'),
    description: (t) => t('erp:workspace.description'),
    category: (t) => t('erp:workspace.category'),
    icon: Building2,
    layout: 'boxed',
    ...shell,
    order: 40,
    preview: '/previews/erp.png',
    nav: [
      {
        id: 'finance',
        label: (t) => t('erp:nav.sections.finance'),
        icon: Landmark,
        items: [
          { to: r.overview.href(), icon: LayoutDashboard, label: (t) => t('erp:nav.overview') },
          {
            icon: BookOpenText,
            label: (t) => t('erp:nav.accounting'),
            children: [
              { to: r.accounts.href(), label: (t) => t('erp:nav.accounts') },
              {
                to: r.journal.href(),
                label: (t) => t('erp:nav.journal'),
                badge: { label: 2, tone: 'default' },
              },
              { to: r.journalNew.href(), label: (t) => t('erp:nav.journalNew') },
            ],
          },
          {
            to: r.reconciliation.href(),
            icon: Scale,
            label: (t) => t('erp:nav.reconciliation'),
          },
          { to: r.fixedAssets.href(), icon: Factory, label: (t) => t('erp:nav.fixedAssets') },
          { to: r.reports.href(), icon: FileSpreadsheet, label: (t) => t('erp:nav.reports') },
        ],
      },
      {
        id: 'trade',
        label: (t) => t('erp:nav.sections.trade'),
        icon: ArrowLeftRight,
        items: [
          {
            to: r.invoices.href(),
            icon: ReceiptText,
            label: (t) => t('erp:nav.invoices'),
            badge: { label: 23, tone: 'warning' },
          },
          {
            icon: BriefcaseBusiness,
            label: (t) => t('erp:nav.sales'),
            children: [
              { to: r.receivables.href(), label: (t) => t('erp:nav.receivables') },
              {
                to: `${r.receivables.href()}?view=overdue`,
                label: (t) => t('erp:nav.overdueCustomers'),
              },
              { to: r.salesOrders.href(), label: (t) => t('erp:nav.salesOrders') },
              {
                to: `${r.salesOrders.href()}?status=quote`,
                label: (t) => t('erp:nav.quotes'),
                badge: { label: 7, tone: 'primary' },
              },
            ],
          },
          {
            icon: ShoppingCart,
            label: (t) => t('erp:nav.purchasing'),
            children: [
              {
                to: r.payables.href(),
                label: (t) => t('erp:nav.payables'),
                badge: { label: 10, tone: 'primary' },
              },
              {
                to: r.purchaseOrders.href(),
                label: (t) => t('erp:nav.purchaseOrders'),
                badge: { label: 4, tone: 'warning' },
              },
              {
                to: r.expenseClaims.href(),
                label: (t) => t('erp:nav.expenseClaims'),
                badge: { label: 9, tone: 'primary' },
              },
              { to: r.vendors.href(), label: (t) => t('erp:nav.vendors') },
            ],
          },
        ],
      },
      {
        id: 'planning',
        label: (t) => t('erp:nav.sections.planning'),
        icon: Target,
        items: [
          { to: r.budgets.href(), icon: Target, label: (t) => t('erp:nav.budgets') },
          {
            to: r.cashForecast.href(),
            icon: ChartNoAxesCombined,
            label: (t) => t('erp:nav.cashForecast'),
          },
          { to: r.projects.href(), icon: FolderKanban, label: (t) => t('erp:nav.projects') },
          {
            to: '/erp/planning/payroll',
            icon: WalletCards,
            label: (t) => t('erp:nav.payroll'),
            disabled: true,
          },
          {
            to: 'https://www.irs.gov/businesses/small-businesses-self-employed',
            icon: Landmark,
            label: (t) => t('erp:nav.taxGuide'),
            external: true,
          },
        ],
      },
    ],
    routes: [
      { path: r.overview.path, page: () => import('./pages/overview-page') },
      { path: r.accounts.path, page: () => import('./pages/accounts-page') },
      { path: r.journal.path, page: () => import('./pages/journal-page') },
      { path: r.journalNew.path, page: () => import('./pages/journal-new-page') },
      { path: r.reports.path, page: () => import('./pages/reports-page') },
      { path: r.invoices.path, page: () => import('./pages/invoices-page') },
      { path: r.invoice.path, page: () => import('./pages/invoice-page') },
      { path: r.payables.path, page: () => import('./pages/payables-page') },
      { path: r.vendors.path, page: () => import('./pages/vendors-page') },
      { path: r.budgets.path, page: () => import('./pages/budgets-page') },
      { path: r.projects.path, page: () => import('./pages/projects-page') },
      { path: r.reconciliation.path, page: () => import('./pages/reconciliation-page') },
      { path: r.fixedAssets.path, page: () => import('./pages/fixed-assets-page') },
      { path: r.purchaseOrders.path, page: () => import('./pages/purchase-orders-page') },
      { path: r.purchaseOrder.path, page: () => import('./pages/purchase-order-page') },
      { path: r.expenseClaims.path, page: () => import('./pages/expense-claims-page') },
      { path: r.receivables.path, page: () => import('./pages/receivables-page') },
      { path: r.salesOrders.path, page: () => import('./pages/sales-orders-page') },
      { path: r.cashForecast.path, page: () => import('./pages/cash-forecast-page') },
    ],
  },
});
