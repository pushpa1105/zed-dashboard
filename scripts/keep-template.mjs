#!/usr/bin/env node
/**
 * Keep only the dashboard workspaces you want and remove the rest, in place.
 *
 *   npm run template:keep -- --list                    # list workspaces and modules
 *   npm run template:keep -- crm                       # keep the CRM workspace only
 *   npm run template:keep -- crm erp --home            # keep two; land on the first after sign-in
 *   npm run template:keep -- crm --strip-showcases     # also drop the component showcases
 *   npm run template:keep -- crm --remove app-chat,app-mail   # also drop listed modules
 *   npm run template:keep -- crm --dry-run             # preview
 *
 * Commit first so the change is easy to review, then run `npm run check`.
 */
import path from 'node:path';

import { readFeatures, removeModules, REQUIRED, SHOWCASES } from './lib/modules.mjs';

const root = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const removeIndex = args.findIndex((a) => a.startsWith('--remove'));
const removeValue =
  removeIndex < 0
    ? ''
    : args[removeIndex].includes('=')
      ? args[removeIndex].split('=')[1]
      : args[removeIndex + 1];
const extraRemovals = removeValue
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const wanted = args.filter(
  (a, i) => !a.startsWith('--') && !(removeIndex >= 0 && i === removeIndex + 1),
);

const features = readFeatures(root);
const workspaces = features.filter((f) => f.isWorkspace);

if (flag('--list') || wanted.length === 0) {
  console.log('Workspaces:');
  for (const ws of workspaces) console.log(`  ${ws.id.padEnd(14)} ${ws.basePath}`);
  console.log('\nOther modules (removable with --remove a,b):');
  console.log(
    `  ${features
      .filter((f) => !f.isWorkspace)
      .map((f) => f.id)
      .join(', ')}`,
  );
  if (!flag('--list')) {
    console.log('\nUsage: npm run template:keep -- <workspace> [more] [--home] [--dry-run]');
    process.exitCode = 1;
  }
  process.exit();
}

const unknown = wanted.filter((w) => !workspaces.some((ws) => ws.id === w));
if (unknown.length) {
  console.error(
    `Unknown workspace(s): ${unknown.join(', ')}. Available: ${workspaces.map((w) => w.id).join(', ')}`,
  );
  process.exit(1);
}
const invalid = extraRemovals.filter(
  (id) => REQUIRED.includes(id) || !features.some((f) => f.id === id),
);
if (invalid.length) {
  console.error(`Cannot remove: ${invalid.join(', ')} (unknown or required).`);
  process.exit(1);
}

const dryRun = flag('--dry-run');
removeModules(
  root,
  [
    ...workspaces.filter((ws) => !wanted.includes(ws.id)).map((ws) => ws.id),
    ...(flag('--strip-showcases')
      ? SHOWCASES.filter((id) => features.some((f) => f.id === id))
      : []),
    ...extraRemovals,
  ],
  { dryRun, home: flag('--home') ? wanted[0] : undefined },
);

console.log(`\n${dryRun ? '[dry run] ' : ''}Kept: ${wanted.join(', ')}.\nNext: npm run check`);
