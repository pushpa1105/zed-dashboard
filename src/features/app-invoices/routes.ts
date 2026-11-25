import { defineRoute } from '@/core/config/routes';

export const appInvoicesRoutes = {
  index: defineRoute('/app/invoices'),
  create: defineRoute('/app/invoices/new'),
  detail: defineRoute('/app/invoices/:invoiceId'),
} as const;
