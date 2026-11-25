import {
  AlarmClock,
  AtSign,
  Building2,
  CalendarClock,
  Columns3,
  FileCheck2,
  FilePlus2,
  Handshake,
  ListChecks,
  TrendingUp,
  Trophy,
  UserPlus,
} from 'lucide-react';

import type { FeatureWorkspace } from '@/core/feature/define-feature';

import { crmRoutes as r } from './routes';

/**
 * Header extras of the CRM workspace: the notification feed (sample data:
 * replace `items` with a query against your notifications endpoint), the
 * "Create" menu and the account menu links.
 */
export const shell = {
  notifications: {
    categories: [
      { id: 'deals', label: (t) => t('crm:shell.categories.deals') },
      { id: 'mentions', label: (t) => t('crm:shell.categories.mentions') },
      { id: 'tasks', label: (t) => t('crm:shell.categories.tasks') },
    ],
    items: [
      {
        id: 'won',
        category: 'deals',
        icon: Trophy,
        tone: 'success',
        title: (t) => t('crm:shell.notifications.won.title'),
        body: (t) => t('crm:shell.notifications.won.body'),
        minutesAgo: 8,
        to: r.deals.href(),
        unread: true,
      },
      {
        id: 'mention',
        category: 'mentions',
        icon: AtSign,
        tone: 'primary',
        actor: 'Liam Johnson',
        title: (t) => t('crm:shell.notifications.mention.title'),
        body: (t) => t('crm:shell.notifications.mention.body'),
        minutesAgo: 35,
        to: r.activity.href(),
        unread: true,
      },
      {
        id: 'overdue',
        category: 'tasks',
        icon: AlarmClock,
        tone: 'danger',
        title: (t) => t('crm:shell.notifications.overdue.title'),
        body: (t) => t('crm:shell.notifications.overdue.body'),
        minutesAgo: 70,
        to: r.tasks.href(),
        unread: true,
      },
      {
        id: 'quote',
        category: 'deals',
        icon: FileCheck2,
        tone: 'primary',
        title: (t) => t('crm:shell.notifications.quote.title'),
        body: (t) => t('crm:shell.notifications.quote.body'),
        minutesAgo: 180,
        to: r.quotes.href(),
      },
      {
        id: 'lead',
        category: 'deals',
        icon: UserPlus,
        title: (t) => t('crm:shell.notifications.lead.title'),
        body: (t) => t('crm:shell.notifications.lead.body'),
        minutesAgo: 360,
        to: r.leads.href(),
      },
      {
        id: 'meeting',
        category: 'tasks',
        icon: CalendarClock,
        tone: 'warning',
        title: (t) => t('crm:shell.notifications.meeting.title'),
        body: (t) => t('crm:shell.notifications.meeting.body'),
        minutesAgo: 1560,
        to: r.meetings.href(),
      },
    ],
    viewAllTo: r.activity.href(),
    settingsTo: r.settings.href(),
  },
  quickActions: [
    {
      id: 'deal',
      to: r.pipeline.href(),
      icon: Handshake,
      label: (t) => t('crm:shell.create.deal.label'),
      description: (t) => t('crm:shell.create.deal.description'),
    },
    {
      id: 'contact',
      to: r.people.href(),
      icon: UserPlus,
      label: (t) => t('crm:shell.create.contact.label'),
      description: (t) => t('crm:shell.create.contact.description'),
    },
    {
      id: 'company',
      to: r.companies.href(),
      icon: Building2,
      label: (t) => t('crm:shell.create.company.label'),
      description: (t) => t('crm:shell.create.company.description'),
    },
    {
      id: 'quote',
      to: r.quotes.href(),
      icon: FilePlus2,
      label: (t) => t('crm:shell.create.quote.label'),
      description: (t) => t('crm:shell.create.quote.description'),
    },
  ],
  accountLinks: [
    {
      id: 'pipeline',
      to: r.pipeline.href(),
      icon: Columns3,
      label: (t) => t('crm:shell.account.pipeline'),
    },
    {
      id: 'tasks',
      to: r.tasks.href(),
      icon: ListChecks,
      label: (t) => t('crm:shell.account.tasks'),
    },
    {
      id: 'forecast',
      to: r.forecast.href(),
      icon: TrendingUp,
      label: (t) => t('crm:shell.account.forecast'),
    },
  ],
} satisfies Pick<FeatureWorkspace, 'notifications' | 'quickActions' | 'accountLinks'>;
