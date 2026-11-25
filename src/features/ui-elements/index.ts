import {
  BellRing,
  ChartPie,
  Compass,
  GitBranch,
  History,
  LayoutTemplate,
  LayoutGrid,
  Menu,
  Shapes,
} from 'lucide-react';

import { routes } from '@/core/config/routes';
import { defineFeature } from '@/core/feature/define-feature';

import en from './i18n/en.json';
import { uiElementsRoutes as r } from './routes';

export default defineFeature({
  id: 'ui-elements',
  routes: [
    {
      path: routes.uiDataDisplay.path,
      access: 'protected',
      page: () => import('./pages/data-display-page'),
    },
    { path: routes.uiCharts.path, access: 'protected', page: () => import('./pages/charts-page') },
    {
      path: routes.uiFeedback.path,
      access: 'protected',
      page: () => import('./pages/feedback-page'),
    },
    {
      path: routes.uiNavigation.path,
      access: 'protected',
      page: () => import('./pages/navigation-page'),
    },
    { path: r.trees.path, access: 'protected', page: () => import('./pages/trees-page') },
    { path: r.timelines.path, access: 'protected', page: () => import('./pages/timelines-page') },
    { path: r.menus.path, access: 'protected', page: () => import('./pages/menus-page') },
    { path: r.widgets.path, access: 'protected', page: () => import('./pages/widgets-page') },
    { path: r.layouts.path, access: 'protected', page: () => import('./pages/layouts-page') },
  ],
  nav: [
    {
      to: routes.uiDataDisplay.href(),
      icon: Shapes,
      label: (t) => t('ui-elements:nav'),
      order: 45,
      group: 'components',
    },
    {
      to: r.widgets.href(),
      icon: LayoutGrid,
      label: (t) => t('ui-elements:pages.widgets.title'),
      order: 46,
      group: 'components',
    },
    {
      to: r.layouts.href(),
      icon: LayoutTemplate,
      label: (t) => t('ui-elements:pages.layouts.title'),
      order: 47,
      group: 'components',
    },
  ],
  commands: [
    {
      id: 'ui-elements.charts',
      to: routes.uiCharts.href(),
      icon: ChartPie,
      label: (t) => t('ui-elements:pages.charts.title'),
      keywords: ['chart', 'graph'],
    },
    {
      id: 'ui-elements.feedback',
      to: routes.uiFeedback.href(),
      icon: BellRing,
      label: (t) => t('ui-elements:pages.feedback.title'),
      keywords: ['toast', 'alert', 'skeleton'],
    },
    {
      id: 'ui-elements.navigation',
      to: routes.uiNavigation.href(),
      icon: Compass,
      label: (t) => t('ui-elements:pages.navigation.title'),
      keywords: ['tabs', 'pagination'],
    },
    {
      id: 'ui-elements.trees',
      to: r.trees.href(),
      icon: GitBranch,
      label: (t) => t('ui-elements:pages.trees.title'),
      keywords: ['tree', 'org chart', 'hierarchy', 'file'],
    },
    {
      id: 'ui-elements.timelines',
      to: r.timelines.href(),
      icon: History,
      label: (t) => t('ui-elements:pages.timelines.title'),
      keywords: ['timeline', 'roadmap', 'changelog', 'tracking'],
    },
    {
      id: 'ui-elements.menus',
      to: r.menus.href(),
      icon: Menu,
      label: (t) => t('ui-elements:pages.menus.title'),
      keywords: ['menu', 'nested', 'mega menu', 'dropdown', 'context'],
    },
  ],
  i18n: { en },
});
