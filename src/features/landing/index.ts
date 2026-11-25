import { PanelsTopLeft } from 'lucide-react';

import { routes } from '@/core/config/routes';
import { defineFeature } from '@/core/feature/define-feature';

import en from './i18n/en.json';
import { landingRoutes } from './routes';

export default defineFeature({
  id: 'landing',
  routes: [
    { path: routes.home.path, access: 'public', page: () => import('./pages/saas-landing-page') },
    {
      path: routes.landingStartup.path,
      access: 'public',
      page: () => import('./pages/startup-landing-page'),
    },
    {
      path: routes.landingProduct.path,
      access: 'public',
      page: () => import('./pages/product-landing-page'),
    },
    {
      path: landingRoutes.agency.path,
      access: 'public',
      page: () => import('./pages/agency-landing-page'),
    },
    {
      path: landingRoutes.ai.path,
      access: 'public',
      page: () => import('./pages/ai-landing-page'),
    },
    {
      path: landingRoutes.templates.path,
      access: 'public',
      page: () => import('./pages/templates-page'),
    },
  ],
  nav: [
    {
      to: routes.home.href(),
      icon: PanelsTopLeft,
      label: (t) => t('landing:nav'),
      order: 60,
      group: 'pages',
    },
  ],
  i18n: { en },
});
