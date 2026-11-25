import path from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

/**
 * Windows drive letters are case-insensitive, but module ids are compared as
 * strings. When the shell's cwd is `d:\project` while some paths resolve to
 * `D:\project`, the same file becomes two modules: two React Query contexts
 * ("No QueryClient set") and two theme stores. Pinning one spelling for the
 * root and the alias keeps every module id consistent.
 */
const normalizeDrive = (p: string) => p.replace(/^[a-z]:/, (drive) => drive.toUpperCase());
const root = normalizeDrive(import.meta.dirname);

/** Writes the app name (VITE_APP_NAME) into index.html: tab title and loader. */
function appName(): Plugin {
  let name = 'zed-dashboard';
  return {
    name: 'app-name',
    configResolved: (config) => {
      name = config.env.VITE_APP_NAME || name;
    },
    transformIndexHtml: (html) => html.replaceAll('%APP_NAME%', name),
  };
}

// https://vite.dev/config/
export default defineConfig({
  root,
  plugins: [react(), tailwindcss(), appName()],
  resolve: {
    alias: {
      '@': path.resolve(root, './src'),
    },
    // Guarantee a single React instance.
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    // Pages are lazy-loaded, so Vite would otherwise discover their
    // dependencies late and re-bundle mid-session (mixing React copies).
    // Crawling every source file up front avoids that.
    entries: [
      'index.html',
      'src/**/*.{ts,tsx}',
      '!src/**/*.test.{ts,tsx}',
      '!src/testing/**',
      '!src/**/__tests__/**',
    ],
  },
  server: {
    port: 3000,
  },
  preview: {
    port: 4173,
  },
  build: {
    // AG Grid (~1.2 MB) is deliberately its own chunk, loaded only on /app/tables/grid.
    chunkSizeWarningLimit: 1300,
    rollupOptions: {
      output: {
        // Long-term-cacheable vendor chunks.
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/.test(id))
            return 'react';
          if (/[\\/]@tanstack[\\/](react-query|query-core)[\\/]/.test(id)) return 'query';
          if (id.includes('radix-ui') || id.includes('@radix-ui')) return 'radix';
          // Heavy, page-specific libraries get their own chunks.
          if (/[\\/]node_modules[\\/](recharts|d3-[^\\/]+|victory-vendor)[\\/]/.test(id))
            return 'charts';
          if (id.includes('ag-grid')) return 'ag-grid';
          return undefined;
        },
      },
    },
  },
});
