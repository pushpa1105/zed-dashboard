import { Files } from 'lucide-react';

import { defineFeature, type FeatureRoute } from '@/core/feature/define-feature';

import en from './i18n/en.json';
import { pagesRoutes as r } from './routes';

/** Full-page public templates (auth, status, pricing). */
const publicPages: FeatureRoute[] = [
  { path: r.authSplit.path, access: 'public', page: () => import('./pages/auth-split-page') },
  {
    path: r.authIllustrated.path,
    access: 'public',
    page: () => import('./pages/auth-illustrated-page'),
  },
  { path: r.authMinimal.path, access: 'public', page: () => import('./pages/auth-minimal-page') },
  { path: r.authOtp.path, access: 'public', page: () => import('./pages/auth-otp-page') },
  { path: r.authForgot.path, access: 'public', page: () => import('./pages/auth-forgot-page') },
  { path: r.authLock.path, access: 'public', page: () => import('./pages/auth-lock-page') },
  { path: r.notFound.path, access: 'public', page: () => import('./pages/not-found-page') },
  { path: r.notFoundAlt.path, access: 'public', page: () => import('./pages/not-found-alt-page') },
  { path: r.serverError.path, access: 'public', page: () => import('./pages/server-error-page') },
  { path: r.maintenance.path, access: 'public', page: () => import('./pages/maintenance-page') },
  { path: r.comingSoon.path, access: 'public', page: () => import('./pages/coming-soon-page') },
  { path: r.pricing.path, access: 'public', page: () => import('./pages/pricing-page') },
];

/** Templates that render inside the app shell. */
const appPages: FeatureRoute[] = [
  { path: r.index.path, access: 'protected', page: () => import('./pages/index-page') },
  { path: r.profile.path, access: 'protected', page: () => import('./pages/profile-page') },
  { path: r.account.path, access: 'protected', page: () => import('./pages/account-page') },
  { path: r.help.path, access: 'protected', page: () => import('./pages/help-page') },
  { path: r.onboarding.path, access: 'protected', page: () => import('./pages/onboarding-page') },
];

export default defineFeature({
  id: 'pages',
  routes: [...appPages, ...publicPages],
  nav: [
    { to: r.index.href(), icon: Files, label: (t) => t('pages:nav'), order: 65, group: 'pages' },
  ],
  i18n: { en },
});
