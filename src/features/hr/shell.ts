import {
  Banknote,
  BriefcaseBusiness,
  ClipboardCheck,
  FolderOpen,
  GraduationCap,
  Palmtree,
  PartyPopper,
  UserCheck,
  UserPlus,
  UserSearch,
} from 'lucide-react';

import type { FeatureWorkspace } from '@/core/feature/define-feature';

import { hrRoutes as r } from './routes';

/**
 * Header extras of the HR workspace: the notification feed (sample data:
 * replace `items` with a query against your notifications endpoint), the
 * "Create" menu and the account menu links.
 */
export const shell = {
  notifications: {
    categories: [
      { id: 'requests', label: (t) => t('hr:shell.categories.requests') },
      { id: 'people', label: (t) => t('hr:shell.categories.people') },
      { id: 'payroll', label: (t) => t('hr:shell.categories.payroll') },
    ],
    items: [
      {
        id: 'leave',
        category: 'requests',
        icon: Palmtree,
        tone: 'warning',
        actor: 'Mia Rodriguez',
        title: (t) => t('hr:shell.notifications.leave.title'),
        body: (t) => t('hr:shell.notifications.leave.body'),
        minutesAgo: 10,
        to: r.timeOff.href(),
        unread: true,
      },
      {
        id: 'candidate',
        category: 'people',
        icon: UserSearch,
        tone: 'primary',
        title: (t) => t('hr:shell.notifications.candidate.title'),
        body: (t) => t('hr:shell.notifications.candidate.body'),
        minutesAgo: 45,
        to: r.recruitment.href(),
        unread: true,
      },
      {
        id: 'payroll',
        category: 'payroll',
        icon: Banknote,
        tone: 'danger',
        title: (t) => t('hr:shell.notifications.payroll.title'),
        body: (t) => t('hr:shell.notifications.payroll.body'),
        minutesAgo: 120,
        to: r.payroll.href(),
        unread: true,
      },
      {
        id: 'onboarding',
        category: 'people',
        icon: UserCheck,
        tone: 'success',
        title: (t) => t('hr:shell.notifications.onboarding.title'),
        body: (t) => t('hr:shell.notifications.onboarding.body'),
        minutesAgo: 300,
        to: r.onboarding.href(),
      },
      {
        id: 'review',
        category: 'requests',
        icon: ClipboardCheck,
        title: (t) => t('hr:shell.notifications.review.title'),
        body: (t) => t('hr:shell.notifications.review.body'),
        minutesAgo: 1620,
        to: r.performance.href(),
      },
      {
        id: 'anniversary',
        category: 'people',
        icon: PartyPopper,
        tone: 'primary',
        title: (t) => t('hr:shell.notifications.anniversary.title'),
        body: (t) => t('hr:shell.notifications.anniversary.body'),
        minutesAgo: 4320,
        to: r.directory.href(),
      },
    ],
    viewAllTo: r.overview.href(),
    settingsTo: r.settings.href(),
  },
  quickActions: [
    {
      id: 'employee',
      to: r.directory.href(),
      icon: UserPlus,
      label: (t) => t('hr:shell.create.employee.label'),
      description: (t) => t('hr:shell.create.employee.description'),
    },
    {
      id: 'job',
      to: r.recruitment.href(),
      icon: BriefcaseBusiness,
      label: (t) => t('hr:shell.create.job.label'),
      description: (t) => t('hr:shell.create.job.description'),
    },
    {
      id: 'leave',
      to: r.timeOff.href(),
      icon: Palmtree,
      label: (t) => t('hr:shell.create.leave.label'),
      description: (t) => t('hr:shell.create.leave.description'),
    },
    {
      id: 'payRun',
      to: r.payroll.href(),
      icon: Banknote,
      label: (t) => t('hr:shell.create.payRun.label'),
      description: (t) => t('hr:shell.create.payRun.description'),
    },
  ],
  accountLinks: [
    {
      id: 'timeOff',
      to: r.timeOff.href(),
      icon: Palmtree,
      label: (t) => t('hr:shell.account.timeOff'),
    },
    {
      id: 'documents',
      to: r.documents.href(),
      icon: FolderOpen,
      label: (t) => t('hr:shell.account.documents'),
    },
    {
      id: 'training',
      to: r.training.href(),
      icon: GraduationCap,
      label: (t) => t('hr:shell.account.training'),
    },
  ],
} satisfies Pick<FeatureWorkspace, 'notifications' | 'quickActions' | 'accountLinks'>;
