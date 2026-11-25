import {
  Activity,
  BookOpen,
  Building2,
  CalendarCheck,
  ChartPie,
  Columns3,
  Contact,
  FileText,
  Handshake,
  Inbox,
  LayoutDashboard,
  LineChart,
  Mails,
  ListChecks,
  ListFilter,
  Package,
  PhoneCall,
  Plug,
  Settings2,
  SlidersHorizontal,
  Table2,
  TrendingUp,
  Users,
} from 'lucide-react';

import { defineFeature } from '@/core/feature/define-feature';

import en from './i18n/en.json';
import { crmRoutes as r } from './routes';
import { shell } from './shell';

/**
 * CRM workspace. Uses the `dual` shell: each nav section becomes an icon in
 * the left rail and its pages fill the panel next to it.
 */
export default defineFeature({
  id: 'crm',
  i18n: { en },
  workspace: {
    basePath: '/crm',
    name: (t) => t('crm:workspace.name'),
    description: (t) => t('crm:workspace.description'),
    category: (t) => t('crm:workspace.category'),
    icon: Handshake,
    layout: 'dual',
    ...shell,
    order: 30,
    preview: '/previews/crm.png',
    nav: [
      {
        id: 'sales',
        icon: TrendingUp,
        label: (t) => t('crm:nav.sections.sales'),
        items: [
          { to: r.overview.href(), icon: LayoutDashboard, label: (t) => t('crm:nav.overview') },
          {
            to: r.pipeline.href(),
            icon: Columns3,
            label: (t) => t('crm:nav.pipeline'),
            badge: { label: 42, tone: 'primary' },
          },
          { to: r.deals.href(), icon: Table2, label: (t) => t('crm:nav.deals') },
          {
            icon: FileText,
            label: (t) => t('crm:nav.quotes'),
            children: [
              { to: r.quotes.href(), label: (t) => t('crm:nav.allQuotes') },
              { to: `${r.quotes.href()}?status=sent`, label: (t) => t('crm:nav.awaitingReply') },
            ],
          },
          { to: r.products.href(), icon: Package, label: (t) => t('crm:nav.products') },
        ],
      },
      {
        id: 'contacts',
        icon: Contact,
        label: (t) => t('crm:nav.sections.contacts'),
        items: [
          { to: r.people.href(), icon: Users, label: (t) => t('crm:nav.people') },
          { to: r.companies.href(), icon: Building2, label: (t) => t('crm:nav.companies') },
          {
            to: r.leads.href(),
            icon: Inbox,
            label: (t) => t('crm:nav.leads'),
            badge: { label: 18, tone: 'primary' },
          },
          {
            icon: ListFilter,
            label: (t) => t('crm:nav.segments'),
            disabled: true,
            badge: { label: 'Soon', tone: 'default' },
          },
        ],
      },
      {
        id: 'activities',
        icon: CalendarCheck,
        label: (t) => t('crm:nav.sections.activities'),
        items: [
          { to: r.activity.href(), icon: Activity, label: (t) => t('crm:nav.activity') },
          {
            to: r.tasks.href(),
            icon: ListChecks,
            label: (t) => t('crm:nav.tasks'),
            badge: { label: 5, tone: 'danger' },
          },
          { to: r.meetings.href(), icon: PhoneCall, label: (t) => t('crm:nav.meetings') },
          { to: r.sequences.href(), icon: Mails, label: (t) => t('crm:nav.sequences') },
        ],
      },
      {
        id: 'reports',
        icon: ChartPie,
        label: (t) => t('crm:nav.sections.reports'),
        items: [
          {
            icon: LineChart,
            label: (t) => t('crm:nav.sections.reports'),
            children: [
              { to: r.reports.href(), label: (t) => t('crm:nav.reports') },
              { to: r.forecast.href(), label: (t) => t('crm:nav.forecasts') },
            ],
          },
        ],
      },
      {
        id: 'settings',
        icon: Settings2,
        label: (t) => t('crm:nav.sections.settings'),
        items: [
          { to: r.settings.href(), icon: SlidersHorizontal, label: (t) => t('crm:nav.settings') },
          { icon: Plug, label: (t) => t('crm:nav.integrations'), disabled: true },
          {
            to: 'https://ui.shadcn.com/docs',
            icon: BookOpen,
            label: (t) => t('crm:nav.help'),
            external: true,
          },
        ],
      },
    ],
    routes: [
      { path: r.overview.path, page: () => import('./pages/overview-page') },
      { path: r.pipeline.path, page: () => import('./pages/pipeline-page') },
      { path: r.deals.path, page: () => import('./pages/deals-page') },
      { path: r.deal.path, page: () => import('./pages/deal-page') },
      { path: r.quotes.path, page: () => import('./pages/quotes-page') },
      { path: r.quote.path, page: () => import('./pages/quote-page') },
      { path: r.products.path, page: () => import('./pages/products-page') },
      { path: r.people.path, page: () => import('./pages/people-page') },
      { path: r.companies.path, page: () => import('./pages/companies-page') },
      { path: r.company.path, page: () => import('./pages/company-page') },
      { path: r.leads.path, page: () => import('./pages/leads-page') },
      { path: r.contact.path, page: () => import('./pages/contact-page') },
      { path: r.activity.path, page: () => import('./pages/activity-page') },
      { path: r.tasks.path, page: () => import('./pages/tasks-page') },
      { path: r.meetings.path, page: () => import('./pages/meetings-page') },
      { path: r.sequences.path, page: () => import('./pages/sequences-page') },
      { path: r.reports.path, page: () => import('./pages/reports-page') },
      { path: r.forecast.path, page: () => import('./pages/forecast-page') },
      { path: r.settings.path, page: () => import('./pages/settings-page') },
    ],
  },
});
