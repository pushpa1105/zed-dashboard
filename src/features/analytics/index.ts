import {
  Activity,
  BellRing,
  BookOpen,
  ChartNoAxesCombined,
  FileBarChart,
  Filter,
  Flame,
  FlaskConical,
  Globe2,
  Goal,
  LayoutDashboard,
  Megaphone,
  MonitorSmartphone,
  MousePointerClick,
  Radio,
  Repeat,
  ScrollText,
  Share2,
  Target,
  Zap,
  Users,
} from 'lucide-react';

import { defineFeature } from '@/core/feature/define-feature';

import en from './i18n/en.json';
import { analyticsRoutes as r } from './routes';
import { shell } from './shell';

export default defineFeature({
  id: 'analytics',
  i18n: { en },
  workspace: {
    basePath: '/analytics',
    name: (t) => t('analytics:workspace.name'),
    description: (t) => t('analytics:workspace.description'),
    category: (t) => t('analytics:workspace.category'),
    icon: ChartNoAxesCombined,
    layout: 'topnav-tabs',
    ...shell,
    order: 20,
    preview: '/previews/analytics.png',
    nav: [
      {
        id: 'main',
        label: (t) => t('analytics:nav.sections.main'),
        icon: LayoutDashboard,
        items: [
          {
            to: r.overview.href(),
            icon: LayoutDashboard,
            label: (t) => t('analytics:nav.overview'),
          },
          {
            to: r.realtime.href(),
            icon: Radio,
            label: (t) => t('analytics:nav.realtime'),
            badge: { label: 'Live', tone: 'success' },
          },
          {
            icon: Users,
            label: (t) => t('analytics:nav.audience'),
            children: [
              {
                to: r.audience.href(),
                icon: Users,
                label: (t) => t('analytics:nav.demographics'),
                description: (t) => t('analytics:nav.demographicsHint'),
              },
              {
                to: r.geography.href(),
                icon: Globe2,
                label: (t) => t('analytics:nav.geography'),
                description: (t) => t('analytics:nav.geographyHint'),
              },
              {
                to: r.technology.href(),
                icon: MonitorSmartphone,
                label: (t) => t('analytics:nav.technology'),
                description: (t) => t('analytics:nav.technologyHint'),
              },
            ],
          },
          {
            icon: Share2,
            label: (t) => t('analytics:nav.acquisition'),
            children: [
              {
                to: r.acquisition.href(),
                icon: Share2,
                label: (t) => t('analytics:nav.channels'),
                description: (t) => t('analytics:nav.channelsHint'),
              },
              {
                to: r.campaigns.href(),
                icon: Megaphone,
                label: (t) => t('analytics:nav.campaigns'),
                description: (t) => t('analytics:nav.campaignsHint'),
              },
            ],
          },
          {
            icon: MousePointerClick,
            label: (t) => t('analytics:nav.behavior'),
            children: [
              { to: r.pages.href(), icon: ScrollText, label: (t) => t('analytics:nav.pages') },
              { to: r.funnels.href(), icon: Filter, label: (t) => t('analytics:nav.funnels') },
              { to: r.retention.href(), icon: Repeat, label: (t) => t('analytics:nav.retention') },
              { to: r.events.href(), icon: Zap, label: (t) => t('analytics:nav.events') },
              {
                to: '/analytics/heatmaps',
                icon: Flame,
                label: (t) => t('analytics:nav.heatmaps'),
                disabled: true,
                badge: 'Soon',
              },
              {
                to: '/analytics/sessions',
                icon: Activity,
                label: (t) => t('analytics:nav.sessions'),
                disabled: true,
              },
            ],
          },
          {
            icon: Target,
            label: (t) => t('analytics:nav.conversions'),
            children: [
              {
                to: r.goals.href(),
                icon: Goal,
                label: (t) => t('analytics:nav.goals'),
                description: (t) => t('analytics:nav.goalsHint'),
              },
              {
                to: r.experiments.href(),
                icon: FlaskConical,
                label: (t) => t('analytics:nav.experiments'),
                description: (t) => t('analytics:nav.experimentsHint'),
                badge: { label: (t) => t('analytics:nav.new'), tone: 'primary' },
              },
            ],
          },
          {
            to: r.reports.href(),
            icon: FileBarChart,
            label: (t) => t('analytics:nav.reports'),
            badge: 6,
          },
          { to: r.alerts.href(), icon: BellRing, label: (t) => t('analytics:nav.alerts') },
          {
            to: 'https://ui.shadcn.com/charts',
            icon: BookOpen,
            label: (t) => t('analytics:nav.docs'),
            external: true,
          },
        ],
      },
    ],
    routes: [
      { path: r.overview.path, page: () => import('./pages/home-page') },
      { path: r.realtime.path, page: () => import('./pages/realtime-page') },
      { path: r.audience.path, page: () => import('./pages/audience-page') },
      { path: r.geography.path, page: () => import('./pages/geography-page') },
      { path: r.technology.path, page: () => import('./pages/technology-page') },
      { path: r.acquisition.path, page: () => import('./pages/acquisition-page') },
      { path: r.campaigns.path, page: () => import('./pages/campaigns-page') },
      { path: r.pages.path, page: () => import('./pages/pages-page') },
      { path: r.funnels.path, page: () => import('./pages/funnels-page') },
      { path: r.retention.path, page: () => import('./pages/retention-page') },
      { path: r.events.path, page: () => import('./pages/events-page') },
      { path: r.goals.path, page: () => import('./pages/goals-page') },
      { path: r.experiments.path, page: () => import('./pages/experiments-page') },
      { path: r.experiment.path, page: () => import('./pages/experiment-page') },
      { path: r.reports.path, page: () => import('./pages/reports-page') },
      { path: r.alerts.path, page: () => import('./pages/alerts-page') },
    ],
  },
});
