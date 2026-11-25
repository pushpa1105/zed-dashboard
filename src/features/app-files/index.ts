import { FolderOpen } from 'lucide-react';

import { defineFeature } from '@/core/feature/define-feature';

import en from './i18n/en.json';
import { appFilesRoutes as r } from './routes';

export default defineFeature({
  id: 'app-files',
  routes: [{ path: r.index.path, access: 'protected', page: () => import('./pages/index-page') }],
  nav: [
    {
      to: r.index.href(),
      icon: FolderOpen,
      label: (t) => t('app-files:nav'),
      order: 25,
      group: 'apps',
    },
  ],
  i18n: { en },
});
