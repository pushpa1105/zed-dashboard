import { FileSpreadsheet, Table2, WalletCards } from 'lucide-react';

import { routes } from '@/core/config/routes';
import { defineFeature, type PageModule } from '@/core/feature/define-feature';

import en from './i18n/en.json';
import { tableRoutes } from './routes';

const page = (path: string, load: () => Promise<PageModule>) => ({
  path,
  access: 'protected' as const,
  page: load,
});

export default defineFeature({
  id: 'data-tables',
  routes: [
    {
      path: routes.tables.path,
      access: 'protected',
      page: () => import('./pages/server-table-page'),
    },
    {
      path: routes.tablesClient.path,
      access: 'protected',
      page: () => import('./pages/client-table-page'),
    },
    {
      path: routes.tablesGrid.path,
      access: 'protected',
      page: () => import('./pages/grid-table-page'),
    },
    page(tableRoutes.spreadsheet.path, () => import('./pages/spreadsheet-page')),
    page(tableRoutes.tree.path, () => import('./pages/tree-table-page')),
    page(tableRoutes.masterDetail.path, () => import('./pages/master-detail-page')),
    page(tableRoutes.infinite.path, () => import('./pages/infinite-table-page')),
    page(tableRoutes.views.path, () => import('./pages/views-table-page')),
    page(tableRoutes.reorder.path, () => import('./pages/reorder-table-page')),
    page(tableRoutes.financial.path, () => import('./pages/financial-table-page')),
  ],
  commands: [
    {
      id: 'data-tables.spreadsheet',
      to: tableRoutes.spreadsheet.href(),
      icon: FileSpreadsheet,
      label: (t) => t('data-tables:commands.spreadsheet'),
      keywords: ['excel', 'sheet', 'grid', 'edit', 'paste'],
    },
    {
      id: 'data-tables.financial',
      to: tableRoutes.financial.href(),
      icon: WalletCards,
      label: (t) => t('data-tables:commands.financial'),
      keywords: ['p&l', 'finance', 'statement', 'budget'],
    },
  ],
  nav: [
    {
      to: routes.tables.href(),
      icon: Table2,
      label: (t) => t('data-tables:nav'),
      order: 30,
      group: 'apps',
    },
  ],
  i18n: { en },
});
