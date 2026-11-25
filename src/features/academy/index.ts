import {
  Award,
  BookOpen,
  CalendarDays,
  ChartColumnIncreasing,
  Clapperboard,
  ClipboardCheck,
  Code2,
  Database,
  GraduationCap,
  Home,
  LibraryBig,
  MessageSquareText,
  MessagesSquare,
  Palette,
  Presentation,
  Radio,
  Route,
  UserRoundCheck,
  UsersRound,
} from 'lucide-react';

import { defineFeature } from '@/core/feature/define-feature';

import en from './i18n/en.json';
import { academyRoutes as r } from './routes';
import { shell } from './shell';

export default defineFeature({
  id: 'academy',
  i18n: { en },
  workspace: {
    basePath: '/academy',
    name: (t) => t('academy:workspace.name'),
    description: (t) => t('academy:workspace.description'),
    category: (t) => t('academy:workspace.category'),
    icon: GraduationCap,
    layout: 'topnav',
    ...shell,
    order: 70,
    preview: '/previews/academy.png',
    nav: [
      {
        id: 'main',
        label: (t) => t('academy:nav.sections.main'),
        icon: GraduationCap,
        items: [
          { to: r.home.href(), icon: Home, label: (t) => t('academy:nav.home') },
          {
            icon: LibraryBig,
            label: (t) => t('academy:nav.courses'),
            children: [
              {
                to: r.catalog.href(),
                icon: LibraryBig,
                label: (t) => t('academy:nav.catalog'),
                description: (t) => t('academy:nav.catalogHint'),
              },
              {
                to: r.catalog.href({ enrolled: 1 }),
                icon: BookOpen,
                label: (t) => t('academy:nav.myLearning'),
                description: (t) => t('academy:nav.myLearningHint'),
                badge: 4,
              },
              {
                to: r.catalog.href({ category: 'data' }),
                icon: Database,
                label: (t) => t('academy:categories.data'),
                description: (t) => t('academy:nav.dataHint'),
              },
              {
                to: r.catalog.href({ category: 'design' }),
                icon: Palette,
                label: (t) => t('academy:categories.design'),
                description: (t) => t('academy:nav.designHint'),
              },
              {
                to: r.catalog.href({ category: 'engineering' }),
                icon: Code2,
                label: (t) => t('academy:categories.engineering'),
                description: (t) => t('academy:nav.engineeringHint'),
              },
              {
                to: '/academy/paths',
                icon: Route,
                label: (t) => t('academy:nav.paths'),
                description: (t) => t('academy:nav.pathsHint'),
                disabled: true,
                badge: 'Soon',
              },
            ],
          },
          {
            icon: CalendarDays,
            label: (t) => t('academy:nav.live'),
            children: [
              {
                to: r.schedule.href(),
                icon: CalendarDays,
                label: (t) => t('academy:nav.schedule'),
                description: (t) => t('academy:nav.scheduleHint'),
              },
              {
                to: r.live.href(),
                icon: Radio,
                label: (t) => t('academy:nav.liveSessions'),
                description: (t) => t('academy:nav.liveSessionsHint'),
              },
              {
                to: r.live.href({ status: 'past' }),
                icon: Clapperboard,
                label: (t) => t('academy:nav.recordings'),
                description: (t) => t('academy:nav.recordingsHint'),
              },
            ],
          },
          {
            to: r.discussions.href(),
            icon: MessageSquareText,
            label: (t) => t('academy:nav.discussions'),
            badge: 4,
          },
          {
            icon: Presentation,
            label: (t) => t('academy:nav.teaching'),
            children: [
              {
                to: r.students.href(),
                icon: UserRoundCheck,
                label: (t) => t('academy:nav.students'),
              },
              {
                to: r.assignments.href(),
                icon: ClipboardCheck,
                label: (t) => t('academy:nav.assignments'),
                badge: 5,
              },
              {
                to: r.instructors.href(),
                icon: UsersRound,
                label: (t) => t('academy:nav.instructors'),
              },
              {
                to: r.reports.href(),
                icon: ChartColumnIncreasing,
                label: (t) => t('academy:nav.reports'),
              },
            ],
          },
          {
            to: r.certificates.href(),
            icon: Award,
            label: (t) => t('academy:nav.certificates'),
            badge: 3,
          },
          {
            to: 'https://github.com/',
            icon: MessagesSquare,
            label: (t) => t('academy:nav.community'),
            external: true,
          },
        ],
      },
    ],
    routes: [
      { path: r.home.path, page: () => import('./pages/home-page') },
      { path: r.catalog.path, page: () => import('./pages/catalog-page') },
      { path: r.course.path, page: () => import('./pages/course-page') },
      { path: r.lesson.path, page: () => import('./pages/lesson-page') },
      { path: r.quiz.path, page: () => import('./pages/quiz-page') },
      { path: r.builder.path, page: () => import('./pages/builder-page') },
      { path: r.schedule.path, page: () => import('./pages/schedule-page') },
      { path: r.live.path, page: () => import('./pages/live-page') },
      { path: r.students.path, page: () => import('./pages/students-page') },
      { path: r.student.path, page: () => import('./pages/student-page') },
      { path: r.assignments.path, page: () => import('./pages/assignments-page') },
      { path: r.assignment.path, page: () => import('./pages/assignment-page') },
      { path: r.discussions.path, page: () => import('./pages/discussions-page') },
      { path: r.thread.path, page: () => import('./pages/thread-page') },
      { path: r.instructors.path, page: () => import('./pages/instructors-page') },
      { path: r.certificates.path, page: () => import('./pages/certificates-page') },
      { path: r.reports.path, page: () => import('./pages/reports-page') },
    ],
  },
});
