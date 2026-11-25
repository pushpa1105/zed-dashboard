#!/usr/bin/env node
/**
 * Builds the downloadable products into release/:
 *
 *   <name>-<dashboard>-v<version>.zip   one dashboard + the starter modules ($10 tier)
 *   <name>-complete-v<version>.zip      everything ($50 tier)
 *
 *   npm run release                    # all products
 *   npm run release -- crm hr          # only these dashboards
 *   npm run release -- complete        # only the bundle
 *   npm run release -- crm --verify    # typecheck + test each package before zipping
 *
 * Seller-only files never ship (see EXCLUDE). See docs/selling.md.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { readFeatures, removeModules } from './lib/modules.mjs';
import { zipDirectory } from './lib/zip.mjs';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'release');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const BUNDLE = 'complete';

/** Modules shipped with every single dashboard (the starter kit around it). */
const STARTER = ['auth', 'dashboard', 'landing', 'settings', 'tasks', 'users'];

/** Never shipped: build output, local state and the selling tools. */
const EXCLUDE = new Set([
  '.env',
  '.env.local',
  '.git',
  'coverage',
  'dist',
  'node_modules',
  'playwright-report',
  'release',
  'test-results',
  'docs/selling.md',
  'scripts/release.mjs',
  'scripts/lib/zip.mjs',
]);

const args = process.argv.slice(2);
const verify = args.includes('--verify');
const features = readFeatures(root);
const workspaces = features.filter((f) => f.isWorkspace).map((f) => f.id);
const requested = args.filter((a) => !a.startsWith('--'));
const products = requested.length ? requested : [...workspaces, BUNDLE];

const unknown = products.filter((p) => p !== BUNDLE && !workspaces.includes(p));
if (unknown.length) {
  console.error(
    `Unknown product(s): ${unknown.join(', ')}. Available: ${[...workspaces, BUNDLE].join(', ')}`,
  );
  process.exit(1);
}

function copyProject(dest) {
  fs.cpSync(root, dest, {
    recursive: true,
    filter: (src) => !EXCLUDE.has(path.relative(root, src).split(path.sep).join('/')),
  });
}

const workspaceName = (dir, id) =>
  JSON.parse(fs.readFileSync(path.join(dir, `src/features/${id}/i18n/en.json`), 'utf8')).workspace
    ?.name ?? id;

function writePackageNotes(dir, product, included) {
  const dashboards = included
    .map(
      (id) =>
        `- **${workspaceName(dir, id)}**: [src/features/${id}/README.md](src/features/${id}/README.md)`,
    )
    .join('\n');
  const title = product === BUNDLE ? 'Complete bundle' : workspaceName(dir, product);
  const modules = readFeatures(dir)
    .filter((f) => !f.isWorkspace)
    .map((f) => `\`${f.id}\``)
    .join(', ');

  fs.writeFileSync(
    path.join(dir, 'PACKAGE.md'),
    `# ${pkg.name} · ${title}\n\nVersion ${pkg.version}. Commercial license: use is governed by [LICENSE.md](LICENSE.md). ` +
      `You may build unlimited apps with it, but may not resell, redistribute, share or publish the source code.\n\n` +
      `## Dashboards in this package\n\n${dashboards}\n\n## Other modules\n\n${modules}\n\n` +
      `## Start\n\n\`\`\`bash\nnpm install\ncp .env.example .env\nnpm run dev\n\`\`\`\n\n` +
      `Then read [docs/getting-started.md](docs/getting-started.md) and [docs/architecture.md](docs/architecture.md).\n`,
  );
}

/** Header stamped on every shipped source file, so each copy carries the license notice. */
const HEADER =
  `/*!\n * ${pkg.name} v${pkg.version}\n * Copyright (c) ${pkg.author ?? 'the author'}. All rights reserved.\n` +
  ` * Commercial license: do not resell, redistribute or publish. See LICENSE.md.\n */\n`;
const STAMPED = /\.(ts|tsx|css)$/;

function stampHeaders(dir) {
  for (const sub of ['src', 'e2e']) {
    const base = path.join(dir, sub);
    if (!fs.existsSync(base)) continue;
    for (const rel of fs.readdirSync(base, { recursive: true })) {
      const file = path.join(base, rel);
      if (!STAMPED.test(file) || file.endsWith('.d.ts') || !fs.statSync(file).isFile()) continue;
      const code = fs.readFileSync(file, 'utf8');
      if (code.startsWith('/*!')) continue;
      // Keep directives such as 'use client' on the first line.
      const directive = code.match(/^(['"]use [a-z]+['"];?\r?\n)/)?.[1] ?? '';
      fs.writeFileSync(file, directive + HEADER + code.slice(directive.length));
    }
  }
}

function stripReleaseScript(dir) {
  const file = path.join(dir, 'package.json');
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  delete json.scripts.release;
  fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`);
}

function run(dir, command) {
  const result = spawnSync(command, { cwd: dir, shell: true, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`"${command}" failed in ${path.relative(root, dir)}`);
}

function verifyPackage(dir) {
  const modules = path.join(dir, 'node_modules');
  fs.symlinkSync(path.join(root, 'node_modules'), modules, 'junction');
  try {
    run(dir, 'npx tsc -p tsconfig.app.json --noEmit');
    run(dir, 'npx vitest run');
  } finally {
    fs.rmSync(modules, { recursive: true, force: true });
  }
}

fs.mkdirSync(out, { recursive: true });

for (const product of products) {
  const name = `${pkg.name}-${product}-v${pkg.version}`;
  const stage = path.join(os.tmpdir(), `${name}-stage`);
  console.log(`\n▸ ${name}`);

  fs.rmSync(stage, { recursive: true, force: true });
  copyProject(stage);

  const included = product === BUNDLE ? workspaces : [product];
  if (product !== BUNDLE) {
    const others = features
      .filter((f) => (f.isWorkspace ? f.id !== product : !STARTER.includes(f.id)))
      .map((f) => f.id);
    removeModules(stage, others, { home: product, log: () => {} });
  }
  stripReleaseScript(stage);
  stampHeaders(stage);
  writePackageNotes(stage, product, included);

  if (verify) verifyPackage(stage);

  const zip = path.join(out, `${name}.zip`);
  zipDirectory(stage, zip, name);
  fs.rmSync(stage, { recursive: true, force: true });
  console.log(`  ✓ ${path.relative(root, zip)} (${(fs.statSync(zip).size / 1e6).toFixed(1)} MB)`);
}
