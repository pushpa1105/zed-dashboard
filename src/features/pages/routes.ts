import { defineRoute } from '@/core/config/routes';

/**
 * Page templates. `/app/pages/*` render inside the app shell (signed in);
 * `/p/*` are full-page public templates (auth screens, status pages, pricing).
 */
export const pagesRoutes = {
  index: defineRoute('/app/pages'),
  profile: defineRoute('/app/pages/profile'),
  account: defineRoute('/app/pages/account'),
  help: defineRoute('/app/pages/help'),
  onboarding: defineRoute('/app/pages/onboarding'),

  authSplit: defineRoute('/p/auth/split'),
  authIllustrated: defineRoute('/p/auth/illustrated'),
  authMinimal: defineRoute('/p/auth/minimal'),
  authOtp: defineRoute('/p/auth/otp'),
  authForgot: defineRoute('/p/auth/forgot'),
  authLock: defineRoute('/p/auth/lock'),

  notFound: defineRoute('/p/404'),
  notFoundAlt: defineRoute('/p/404-alt'),
  serverError: defineRoute('/p/500'),
  maintenance: defineRoute('/p/maintenance'),
  comingSoon: defineRoute('/p/coming-soon'),
  pricing: defineRoute('/p/pricing'),
} as const;

export type PageTemplateKey = Exclude<keyof typeof pagesRoutes, 'index'>;
