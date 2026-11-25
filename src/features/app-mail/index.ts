import { Mail } from 'lucide-react';

import { defineFeature } from '@/core/feature/define-feature';

import en from './i18n/en.json';
import { appMailRoutes as r } from './routes';

export default defineFeature({
  id: 'app-mail',
  routes: [{ path: r.index.path, access: 'protected', page: () => import('./pages/index-page') }],
  nav: [
    { to: r.index.href(), icon: Mail, label: (t) => t('app-mail:nav'), order: 22, group: 'apps' },
  ],
  i18n: { en },
});
