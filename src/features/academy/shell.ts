import {
  Award,
  BookOpen,
  BookPlus,
  CalendarDays,
  ClipboardList,
  FileText,
  GraduationCap,
  MessageCircleQuestion,
  Radio,
  Star,
  Video,
} from 'lucide-react';

import type { FeatureWorkspace } from '@/core/feature/define-feature';

import { academyRoutes as r } from './routes';

/**
 * Header extras of the Academy workspace: the notification feed (sample data:
 * replace `items` with a query against your notifications endpoint), the
 * "Create" menu and the account menu links.
 */
export const shell = {
  notifications: {
    categories: [
      { id: 'courses', label: (t) => t('academy:shell.categories.courses') },
      { id: 'students', label: (t) => t('academy:shell.categories.students') },
      { id: 'discussions', label: (t) => t('academy:shell.categories.discussions') },
    ],
    items: [
      {
        id: 'submissions',
        category: 'students',
        icon: FileText,
        tone: 'primary',
        title: (t) => t('academy:shell.notifications.submissions.title'),
        body: (t) => t('academy:shell.notifications.submissions.body'),
        minutesAgo: 12,
        to: r.assignments.href(),
        unread: true,
      },
      {
        id: 'question',
        category: 'discussions',
        icon: MessageCircleQuestion,
        tone: 'primary',
        actor: 'Ava Thompson',
        title: (t) => t('academy:shell.notifications.question.title'),
        body: (t) => t('academy:shell.notifications.question.body'),
        minutesAgo: 40,
        to: r.discussions.href(),
        unread: true,
      },
      {
        id: 'live',
        category: 'courses',
        icon: Radio,
        tone: 'danger',
        title: (t) => t('academy:shell.notifications.live.title'),
        body: (t) => t('academy:shell.notifications.live.body'),
        minutesAgo: 55,
        to: r.live.href(),
        unread: true,
      },
      {
        id: 'enrolled',
        category: 'students',
        icon: GraduationCap,
        tone: 'success',
        title: (t) => t('academy:shell.notifications.enrolled.title'),
        body: (t) => t('academy:shell.notifications.enrolled.body'),
        minutesAgo: 240,
        to: r.students.href(),
      },
      {
        id: 'certificates',
        category: 'courses',
        icon: Award,
        tone: 'success',
        title: (t) => t('academy:shell.notifications.certificates.title'),
        body: (t) => t('academy:shell.notifications.certificates.body'),
        minutesAgo: 1500,
        to: r.certificates.href(),
      },
      {
        id: 'review',
        category: 'courses',
        icon: Star,
        tone: 'warning',
        title: (t) => t('academy:shell.notifications.review.title'),
        body: (t) => t('academy:shell.notifications.review.body'),
        minutesAgo: 4320,
        to: r.catalog.href(),
      },
    ],
    viewAllTo: r.discussions.href(),
  },
  quickActions: [
    {
      id: 'course',
      to: r.catalog.href(),
      icon: BookPlus,
      label: (t) => t('academy:shell.create.course.label'),
      description: (t) => t('academy:shell.create.course.description'),
    },
    {
      id: 'assignment',
      to: r.assignments.href(),
      icon: ClipboardList,
      label: (t) => t('academy:shell.create.assignment.label'),
      description: (t) => t('academy:shell.create.assignment.description'),
    },
    {
      id: 'live',
      to: r.live.href(),
      icon: Video,
      label: (t) => t('academy:shell.create.live.label'),
      description: (t) => t('academy:shell.create.live.description'),
    },
  ],
  accountLinks: [
    {
      id: 'teaching',
      to: r.catalog.href(),
      icon: BookOpen,
      label: (t) => t('academy:shell.account.teaching'),
    },
    {
      id: 'schedule',
      to: r.schedule.href(),
      icon: CalendarDays,
      label: (t) => t('academy:shell.account.schedule'),
    },
  ],
} satisfies Pick<FeatureWorkspace, 'notifications' | 'quickActions' | 'accountLinks'>;
