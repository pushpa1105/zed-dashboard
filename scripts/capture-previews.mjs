#!/usr/bin/env node
/**
 * Captures a 1440×900 screenshot of every dashboard workspace into
 * `public/previews/<featureId>.png`. The landing page and the /templates
 * gallery show these images (and fall back to a layout drawing without them).
 *
 * Requires the dev server with the mock API: `npm run dev` in another terminal.
 *
 *   node scripts/capture-previews.mjs                 # every workspace
 *   node scripts/capture-previews.mjs crm erp         # only these
 *   node scripts/capture-previews.mjs --dark          # dark mode
 *   BASE_URL=http://localhost:4173 node scripts/capture-previews.mjs
 *
 * Workspaces are discovered by reading `src/features/<id>/index.ts` for a
 * `basePath: '...'` entry, so nothing from `src` is imported.
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const require = createRequire(path.join(root, 'package.json'));
const { chromium } = require('@playwright/test');

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const args = process.argv.slice(2);
const dark = args.includes('--dark');
const only = args.filter((a) => !a.startsWith('--'));
const outDir = path.join(root, 'public', 'previews');

const featuresDir = path.join(root, 'src', 'features');
const workspaces = fs
  .readdirSync(featuresDir)
  .map((id) => {
    const manifest = path.join(featuresDir, id, 'index.ts');
    if (!fs.existsSync(manifest)) return null;
    const match = fs.readFileSync(manifest, 'utf8').match(/basePath:\s*'([^']+)'/);
    return match ? { id, basePath: match[1] } : null;
  })
  .filter(Boolean)
  .filter((ws) => !only.length || only.includes(ws.id));

if (!workspaces.length) {
  console.error(only.length ? `No workspace named ${only.join(', ')}` : 'No workspaces found');
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  colorScheme: dark ? 'dark' : 'light',
});
const page = await context.newPage();

try {
  // `?demo=admin` signs in with the demo account (mock API only).
  await page.goto(`${BASE}/login?demo=admin&redirectTo=/app`);
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 60_000 });

  // Force the theme mode so screenshots are consistent regardless of OS settings.
  await page.evaluate(
    (mode) => {
      const key = 'zed-dashboard:theme';
      const stored = JSON.parse(localStorage.getItem(key) ?? '{"state":{},"version":1}');
      stored.state = { ...stored.state, mode, layout: 'auto' };
      localStorage.setItem(key, JSON.stringify(stored));
    },
    dark ? 'dark' : 'light',
  );

  // Warm-up: the first page after sign-in can paint before its styles settle.
  await page.goto(`${BASE}/app`);
  await page.waitForTimeout(1500);

  for (const { id, basePath } of workspaces) {
    await page.goto(`${BASE}${basePath}`);
    await page.waitForLoadState('networkidle').catch(() => {});
    // Wait for real content (the page title), not just the loading spinner.
    await page
      .locator('main h1, h1')
      .first()
      .waitFor({ timeout: 20_000 })
      .catch(() => {});
    // Dev-only floating buttons (React Query devtools) don't belong in previews.
    await page.addStyleTag({ content: '[class*="tsqd"]{display:none!important}' });
    await page.waitForTimeout(1500);
    const file = path.join(outDir, `${id}${dark ? '-dark' : ''}.png`);
    await page.screenshot({ path: file });
    console.log(`✓ ${basePath} → ${path.relative(root, file)}`);
  }
} finally {
  await browser.close();
}
