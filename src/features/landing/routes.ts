import { defineRoute } from '@/core/config/routes';

/**
 * Landing routes owned by this feature. ("/", "/landing/startup" and
 * "/landing/product" live in the shared route table because other code links
 * to them.)
 */
export const landingRoutes = {
  templates: defineRoute('/templates'),
  agency: defineRoute('/landing/agency'),
  ai: defineRoute('/landing/ai'),
} as const;
