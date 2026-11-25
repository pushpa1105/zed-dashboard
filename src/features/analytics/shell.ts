import {
  BellPlus,
  BellRing,
  FileBarChart,
  FilePlus2,
  Filter,
  FlaskConical,
  Megaphone,
  Target,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react';

import type { FeatureWorkspace } from '@/core/feature/define-feature';

import { analyticsRoutes as r } from './routes';

/**
 * Header extras of the Analytics workspace: the notification feed (sample data:
 * replace `items` with a query against your notifications endpoint), the
 * "Create" menu and the account menu links.
 */
export const shell = {
  notifications: {
    categories: [
      { id: 'alerts', label: (t) => t('analytics:shell.categories.alerts') },
      { id: 'goals', label: (t) => t('analytics:shell.categories.goals') },
      { id: 'reports', label: (t) => t('analytics:shell.categories.reports') },
    ],
    items: [
      {
        id: 'spike',
        category: 'alerts',
        icon: TrendingUp,
        tone: 'warning',
        title: (t) => t('analytics:shell.notifications.spike.title'),
        body: (t) => t('analytics:shell.notifications.spike.body'),
        minutesAgo: 4,
        to: r.realtime.href(),
        unread: true,
      },
      {
        id: 'bounce',
        category: 'alerts',
        icon: TriangleAlert,
        tone: 'danger',
        title: (t) => t('analytics:shell.notifications.bounce.title'),
        body: (t) => t('analytics:shell.notifications.bounce.body'),
        minutesAgo: 45,
        to: r.alerts.href(),
        unread: true,
      },
      {
        id: 'goal',
        category: 'goals',
        icon: Target,
        tone: 'success',
        title: (t) => t('analytics:shell.notifications.goal.title'),
        body: (t) => t('analytics:shell.notifications.goal.body'),
        minutesAgo: 120,
        to: r.goals.href(),
        unread: true,
      },
      {
        id: 'experiment',
        category: 'goals',
        icon: FlaskConical,
        tone: 'primary',
        title: (t) => t('analytics:shell.notifications.experiment.title'),
        body: (t) => t('analytics:shell.notifications.experiment.body'),
        minutesAgo: 420,
        to: r.experiments.href(),
      },
      {
        id: 'report',
        category: 'reports',
        icon: FileBarChart,
        title: (t) => t('analytics:shell.notifications.report.title'),
        body: (t) => t('analytics:shell.notifications.report.body'),
        minutesAgo: 1680,
        to: r.reports.href(),
      },
      {
        id: 'campaign',
        category: 'reports',
        icon: Megaphone,
        title: (t) => t('analytics:shell.notifications.campaign.title'),
        body: (t) => t('analytics:shell.notifications.campaign.body'),
        minutesAgo: 2880,
        to: r.campaigns.href(),
      },
    ],
    viewAllTo: r.alerts.href(),
    settingsTo: r.alerts.href(),
  },
  quickActions: [
    {
      id: 'report',
      to: r.reports.href(),
      icon: FilePlus2,
      label: (t) => t('analytics:shell.create.report.label'),
      description: (t) => t('analytics:shell.create.report.description'),
    },
    {
      id: 'goal',
      to: r.goals.href(),
      icon: Target,
      label: (t) => t('analytics:shell.create.goal.label'),
      description: (t) => t('analytics:shell.create.goal.description'),
    },
    {
      id: 'funnel',
      to: r.funnels.href(),
      icon: Filter,
      label: (t) => t('analytics:shell.create.funnel.label'),
      description: (t) => t('analytics:shell.create.funnel.description'),
    },
    {
      id: 'alert',
      to: r.alerts.href(),
      icon: BellPlus,
      label: (t) => t('analytics:shell.create.alert.label'),
      description: (t) => t('analytics:shell.create.alert.description'),
    },
  ],
  accountLinks: [
    {
      id: 'reports',
      to: r.reports.href(),
      icon: FileBarChart,
      label: (t) => t('analytics:shell.account.reports'),
    },
    {
      id: 'alerts',
      to: r.alerts.href(),
      icon: BellRing,
      label: (t) => t('analytics:shell.account.alerts'),
    },
  ],
} satisfies Pick<FeatureWorkspace, 'notifications' | 'quickActions' | 'accountLinks'>;
