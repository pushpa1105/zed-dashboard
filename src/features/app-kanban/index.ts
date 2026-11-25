import { SquareKanban } from 'lucide-react';

import { defineFeature } from '@/core/feature/define-feature';

import en from './i18n/en.json';
import { appKanbanRoutes as r } from './routes';

export default defineFeature({
  id: 'app-kanban',
  routes: [{ path: r.index.path, access: 'protected', page: () => import('./pages/index-page') }],
  nav: [
    {
      to: r.index.href(),
      icon: SquareKanban,
      label: (t) => t('app-kanban:nav'),
      order: 24,
      group: 'apps',
    },
  ],
  i18n: { en },
});
