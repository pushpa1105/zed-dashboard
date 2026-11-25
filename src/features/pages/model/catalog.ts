import type { PageTemplateKey } from '../routes';

/** Gallery groups and the templates in each (order = display order). */
export const PAGE_GROUPS: Array<{
  key: 'auth' | 'account' | 'marketing' | 'status';
  items: PageTemplateKey[];
}> = [
  {
    key: 'auth',
    items: ['authSplit', 'authIllustrated', 'authMinimal', 'authOtp', 'authForgot', 'authLock'],
  },
  { key: 'account', items: ['profile', 'account', 'onboarding', 'help'] },
  { key: 'marketing', items: ['pricing', 'comingSoon'] },
  { key: 'status', items: ['notFound', 'notFoundAlt', 'serverError', 'maintenance'] },
];

/** Templates that render inside the app shell (the others open full-page). */
export const IN_APP: PageTemplateKey[] = ['profile', 'account', 'help', 'onboarding'];
