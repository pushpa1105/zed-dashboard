import { CalendarDays } from 'lucide-react';

import { defineFeature } from '@/core/feature/define-feature';

import en from './i18n/en.json';
import { appCalendarRoutes as r } from './routes';

export default defineFeature({
  id: 'app-calendar',
  routes: [{ path: r.index.path, access: 'protected', page: () => import('./pages/index-page') }],
  nav: [
    {
      to: r.index.href(),
      icon: CalendarDays,
      label: (t) => t('app-calendar:nav'),
      order: 23,
      group: 'apps',
    },
  ],
  i18n: { en },
});
