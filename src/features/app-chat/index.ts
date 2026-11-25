import { MessagesSquare } from 'lucide-react';

import { defineFeature } from '@/core/feature/define-feature';

import en from './i18n/en.json';
import { appChatRoutes as r } from './routes';

export default defineFeature({
  id: 'app-chat',
  routes: [{ path: r.index.path, access: 'protected', page: () => import('./pages/index-page') }],
  nav: [
    {
      to: r.index.href(),
      icon: MessagesSquare,
      label: (t) => t('app-chat:nav'),
      order: 21,
      group: 'apps',
    },
  ],
  i18n: { en },
});
