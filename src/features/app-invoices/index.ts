import { FilePlus2, ReceiptText } from 'lucide-react';

import { defineFeature } from '@/core/feature/define-feature';

import en from './i18n/en.json';
import { appInvoicesRoutes as r } from './routes';

export default defineFeature({
  id: 'app-invoices',
  routes: [
    { path: r.index.path, access: 'protected', page: () => import('./pages/index-page') },
    { path: r.create.path, access: 'protected', page: () => import('./pages/new-invoice-page') },
    { path: r.detail.path, access: 'protected', page: () => import('./pages/invoice-page') },
  ],
  nav: [
    {
      to: r.index.href(),
      icon: ReceiptText,
      label: (t) => t('app-invoices:nav'),
      order: 26,
      group: 'apps',
    },
  ],
  commands: [
    {
      id: 'invoices.create',
      to: r.create.href(),
      icon: FilePlus2,
      label: (t) => t('app-invoices:commands.create'),
      keywords: ['invoice', 'bill', 'new'],
    },
  ],
  i18n: { en },
});
