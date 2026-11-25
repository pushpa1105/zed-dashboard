import {
  BookOpen,
  Clock,
  FileCheck2,
  Gauge,
  GraduationCap,
  HeartHandshake,
  LayoutDashboard,
  Settings2,
  Smile,
  UserPlus,
  UsersRound,
  Wallet,
} from 'lucide-react';

import { defineFeature } from '@/core/feature/define-feature';

import en from './i18n/en.json';
import { hrRoutes as r } from './routes';
import { shell } from './shell';

/**
 * HR workspace. Uses the `rail` shell: top-level entries become icons, and
 * entries with children (People, Recruitment, Time, Payroll) open flyout menus.
 */
export default defineFeature({
  id: 'hr',
  i18n: { en },
  workspace: {
    basePath: '/hr',
    name: (t) => t('hr:workspace.name'),
    description: (t) => t('hr:workspace.description'),
    category: (t) => t('hr:workspace.category'),
    icon: UsersRound,
    layout: 'rail',
    ...shell,
    order: 60,
    preview: '/previews/hr.png',
    nav: [
      {
        id: 'main',
        items: [
          { to: r.overview.href(), icon: LayoutDashboard, label: (t) => t('hr:nav.overview') },
          {
            icon: UsersRound,
            label: (t) => t('hr:nav.people'),
            children: [
              { to: r.directory.href(), label: (t) => t('hr:nav.directory') },
              { to: r.org.href(), label: (t) => t('hr:nav.orgChart') },
              { to: r.onboarding.href(), label: (t) => t('hr:nav.onboarding'), badge: 6 },
            ],
          },
          {
            icon: UserPlus,
            label: (t) => t('hr:nav.recruitment'),
            badge: { label: 4, tone: 'primary' },
            children: [
              { to: r.recruitment.href(), label: (t) => t('hr:nav.openRoles'), badge: 4 },
              {
                to: 'https://example.com/careers',
                label: (t) => t('hr:nav.careersSite'),
                external: true,
              },
              { label: (t) => t('hr:nav.referrals'), disabled: true },
            ],
          },
          {
            icon: Clock,
            label: (t) => t('hr:nav.time'),
            badge: { label: 7, tone: 'warning' },
            children: [
              { to: r.timeOff.href(), label: (t) => t('hr:nav.timeOff'), badge: 7 },
              { to: r.attendance.href(), label: (t) => t('hr:nav.attendance') },
            ],
          },
          {
            icon: Wallet,
            label: (t) => t('hr:nav.payroll'),
            children: [
              { to: r.payroll.href(), label: (t) => t('hr:nav.payRuns') },
              { to: r.benefits.href(), label: (t) => t('hr:nav.benefits'), icon: HeartHandshake },
            ],
          },
          { to: r.performance.href(), icon: Gauge, label: (t) => t('hr:nav.performance') },
          {
            icon: GraduationCap,
            label: (t) => t('hr:nav.learning'),
            children: [
              { to: r.training.href(), label: (t) => t('hr:nav.training') },
              {
                to: r.training.href({ status: 'overdue' }),
                label: (t) => t('hr:nav.overdueTraining'),
              },
            ],
          },
          { to: r.engagement.href(), icon: Smile, label: (t) => t('hr:nav.engagement') },
          {
            icon: FileCheck2,
            label: (t) => t('hr:nav.documents'),
            children: [
              { to: r.documents.href(), label: (t) => t('hr:nav.allDocuments') },
              {
                to: r.documents.href({ status: 'pending' }),
                label: (t) => t('hr:nav.awaitingSignature'),
              },
            ],
          },
        ],
      },
      {
        id: 'admin',
        items: [
          { to: r.settings.href(), icon: Settings2, label: (t) => t('hr:nav.settings') },
          {
            to: 'https://example.com/handbook',
            icon: BookOpen,
            label: (t) => t('hr:nav.help'),
            external: true,
          },
        ],
      },
    ],
    routes: [
      { path: r.overview.path, page: () => import('./pages/overview-page') },
      { path: r.directory.path, page: () => import('./pages/directory-page') },
      { path: r.person.path, page: () => import('./pages/person-page') },
      { path: r.org.path, page: () => import('./pages/org-chart-page') },
      { path: r.recruitment.path, page: () => import('./pages/recruitment-page') },
      { path: r.job.path, page: () => import('./pages/job-page') },
      { path: r.candidate.path, page: () => import('./pages/candidate-page') },
      { path: r.onboarding.path, page: () => import('./pages/onboarding-page') },
      { path: r.attendance.path, page: () => import('./pages/attendance-page') },
      { path: r.timeOff.path, page: () => import('./pages/time-off-page') },
      { path: r.payroll.path, page: () => import('./pages/payroll-page') },
      { path: r.payRun.path, page: () => import('./pages/pay-run-page') },
      { path: r.benefits.path, page: () => import('./pages/benefits-page') },
      { path: r.performance.path, page: () => import('./pages/performance-page') },
      { path: r.training.path, page: () => import('./pages/training-page') },
      { path: r.engagement.path, page: () => import('./pages/engagement-page') },
      { path: r.documents.path, page: () => import('./pages/documents-page') },
      { path: r.settings.path, page: () => import('./pages/settings-page') },
    ],
  },
});
