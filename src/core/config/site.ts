import { env } from './env';

/** App-wide settings. The name, logos and favicon live in `core/brand/config.ts`. */
export const siteConfig = {
  /**
   * Demo accounts offered on the sign-in page (prefilled + one-click buttons).
   * Only shown while the mock API is enabled, so a real deployment never
   * advertises credentials. They match the seeded users in `src/mocks/db.ts`.
   */
  demo: {
    enabled: env.ENABLE_API_MOCKING,
    accounts: {
      admin: { email: 'demo@example.com', password: 'password' },
      member: { email: 'member@example.com', password: 'password' },
    },
  },
  links: {
    repository: 'https://github.com/',
    docs: 'https://ui.shadcn.com',
  },
} as const;
