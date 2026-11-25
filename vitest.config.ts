import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config.ts';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/testing/setup-tests.ts'],
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      css: false,
      // Tests run against the mock API whatever the local .env says.
      env: { VITE_APP_ENABLE_API_MOCKING: 'true' },
      // Full-app render tests load lazy page chunks; leave room on busy machines.
      testTimeout: 20_000,
      // Every file cold-loads its dashboard; half the cores avoids starving the first render.
      maxWorkers: '50%',
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/shared/ui/**',
          'src/testing/**',
          'src/mocks/**',
          'src/**/*.d.ts',
          'src/main.tsx',
        ],
      },
    },
  }),
);
