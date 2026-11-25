import { defineRoute } from '@/core/config/routes';

/** Routes of the ERP workspace. Every path starts with the workspace prefix. */
export const erpRoutes = {
  overview: defineRoute('/erp'),
  accounts: defineRoute('/erp/accounting/accounts'),
  journal: defineRoute('/erp/accounting/journal'),
  journalNew: defineRoute('/erp/accounting/journal/new'),
  reconciliation: defineRoute('/erp/accounting/reconciliation'),
  fixedAssets: defineRoute('/erp/accounting/fixed-assets'),
  reports: defineRoute('/erp/accounting/reports'),
  invoices: defineRoute('/erp/sales/invoices'),
  invoice: defineRoute('/erp/sales/invoices/:invoiceId'),
  receivables: defineRoute('/erp/sales/receivables'),
  salesOrders: defineRoute('/erp/sales/orders'),
  payables: defineRoute('/erp/purchasing/payables'),
  vendors: defineRoute('/erp/purchasing/vendors'),
  purchaseOrders: defineRoute('/erp/purchase-orders'),
  purchaseOrder: defineRoute('/erp/purchase-orders/:poId'),
  expenseClaims: defineRoute('/erp/purchasing/expense-claims'),
  budgets: defineRoute('/erp/planning/budgets'),
  cashForecast: defineRoute('/erp/planning/cash-forecast'),
  projects: defineRoute('/erp/planning/projects'),
} as const;
