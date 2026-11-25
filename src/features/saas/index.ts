import {
  Activity,
  Blocks,
  BookOpen,
  Building2,
  ChartColumnStacked,
  Cloud,
  Flag,
  CreditCard,
  Gauge,
  LayoutDashboard,
  LifeBuoy,
  ScrollText,
  Settings,
  ShieldCheck,
  SquareTerminal,
  UsersRound,
} from 'lucide-react';

import { defineFeature } from '@/core/feature/define-feature';

import en from './i18n/en.json';
import { saasRoutes as r } from './routes';
import { shell } from './shell';

export default defineFeature({
  id: 'saas',
  i18n: { en },
  workspace: {
    basePath: '/saas',
    name: (t) => t('saas:workspace.name'),
    description: (t) => t('saas:workspace.description'),
    category: (t) => t('saas:workspace.category'),
    icon: Cloud,
    layout: 'inset',
    ...shell,
    order: 90,
    preview: '/previews/saas.png',
    nav: [
      {
        id: 'platform',
        label: (t) => t('saas:nav.sections.platform'),
        icon: LayoutDashboard,
        items: [
          { to: r.overview.href(), icon: LayoutDashboard, label: (t) => t('saas:nav.overview') },
          { to: r.usage.href(), icon: ChartColumnStacked, label: (t) => t('saas:nav.usage') },
          { to: r.customers.href(), icon: Building2, label: (t) => t('saas:nav.customers') },
          {
            icon: LifeBuoy,
            label: (t) => t('saas:nav.support'),
            children: [
              { to: r.support.href(), label: (t) => t('saas:nav.supportAll') },
              {
                to: r.support.href({ status: 'open' }),
                label: (t) => t('saas:nav.supportOpen'),
                badge: { label: 'SLA', tone: 'danger' },
              },
              {
                to: r.support.href({ status: 'pending' }),
                label: (t) => t('saas:nav.supportPending'),
              },
            ],
          },
          {
            to: r.status.href(),
            icon: Activity,
            label: (t) => t('saas:nav.status'),
            badge: { label: 1, tone: 'warning' },
          },
        ],
      },
      {
        id: 'developers',
        label: (t) => t('saas:nav.sections.developers'),
        icon: SquareTerminal,
        items: [
          {
            icon: SquareTerminal,
            label: (t) => t('saas:nav.devtools'),
            children: [
              { to: r.keys.href(), label: (t) => t('saas:nav.keys') },
              { to: r.webhooks.href(), label: (t) => t('saas:nav.webhooks') },
              {
                to: r.logs.href(),
                label: (t) => t('saas:nav.logs'),
                badge: { label: 3, tone: 'danger' },
              },
            ],
          },
          { to: r.flags.href(), icon: Flag, label: (t) => t('saas:nav.flags') },
          { to: r.integrations.href(), icon: Blocks, label: (t) => t('saas:nav.integrations') },
          {
            to: '/saas/edge-config',
            icon: Gauge,
            label: (t) => t('saas:nav.edge'),
            badge: 'Beta',
            disabled: true,
          },
          {
            to: 'https://example.com/docs/api',
            external: true,
            icon: BookOpen,
            label: (t) => t('saas:nav.docs'),
          },
        ],
      },
      {
        id: 'account',
        label: (t) => t('saas:nav.sections.account'),
        icon: Settings,
        items: [
          {
            to: r.billing.href(),
            icon: CreditCard,
            label: (t) => t('saas:nav.billing'),
            badge: { label: 'Due', tone: 'warning' },
          },
          { to: r.team.href(), icon: UsersRound, label: (t) => t('saas:nav.team'), badge: 2 },
          { to: r.roles.href(), icon: ShieldCheck, label: (t) => t('saas:nav.roles') },
          { to: r.audit.href(), icon: ScrollText, label: (t) => t('saas:nav.audit') },
          { to: r.settings.href(), icon: Settings, label: (t) => t('saas:nav.settings') },
        ],
      },
    ],
    routes: [
      { path: r.overview.path, page: () => import('./pages/overview-page') },
      { path: r.usage.path, page: () => import('./pages/usage-page') },
      { path: r.keys.path, page: () => import('./pages/keys-page') },
      { path: r.logs.path, page: () => import('./pages/logs-page') },
      { path: r.webhooks.path, page: () => import('./pages/webhooks-page') },
      { path: r.billing.path, page: () => import('./pages/billing-page') },
      { path: r.team.path, page: () => import('./pages/team-page') },
      { path: r.settings.path, page: () => import('./pages/settings-page') },
      { path: r.customers.path, page: () => import('./pages/customers-page') },
      { path: r.customer.path, page: () => import('./pages/customer-page') },
      { path: r.flags.path, page: () => import('./pages/flags-page') },
      { path: r.audit.path, page: () => import('./pages/audit-page') },
      { path: r.status.path, page: () => import('./pages/status-page') },
      { path: r.integrations.path, page: () => import('./pages/integrations-page') },
      { path: r.roles.path, page: () => import('./pages/roles-page') },
      { path: r.support.path, page: () => import('./pages/support-page') },
    ],
  },
});
