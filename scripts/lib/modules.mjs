/**
 * Reads the feature registry and removes modules from a project tree.
 * Shared by `keep-template.mjs` (in place) and `release.mjs` (on a copy).
 */
import fs from 'node:fs';
import path from 'node:path';

/** Component showcases and page templates (not part of any dashboard). */
export const SHOWCASES = ['ui-forms', 'ui-elements', 'data-tables', 'pages'];
/** The app does not boot without these. */
export const REQUIRED = ['auth', 'landing', 'settings'];

/** Every feature with its manifest facts: { id, isWorkspace, basePath, preview }. */
export function readFeatures(root) {
  const dir = path.join(root, 'src/features');
  return fs
    .readdirSync(dir)
    .filter((id) => fs.existsSync(path.join(dir, id, 'index.ts')))
    .map((id) => {
      const source = fs.readFileSync(path.join(dir, id, 'index.ts'), 'utf8');
      return {
        id,
        isWorkspace: /\bworkspace:\s*\{/.test(source),
        basePath: source.match(/basePath:\s*'([^']+)'/)?.[1] ?? null,
        preview: source.match(/preview:\s*'([^']+)'/)?.[1] ?? null,
      };
    });
}

const camel = (s) => s.replace(/-(\w)/g, (_, c) => c.toUpperCase());
const dropLines = (content, predicate) =>
  content
    .split('\n')
    .filter((line) => !predicate(line))
    .join('\n');

/**
 * Deletes the given modules (folder, mock handlers, preview image) and their
 * lines in the registries. `home` makes a workspace the page after sign-in.
 */
export function removeModules(root, ids, { home, dryRun = false, log = console.log } = {}) {
  const features = readFeatures(root);
  const file = (rel) => path.join(root, rel);
  const read = (rel) => fs.readFileSync(file(rel), 'utf8').replace(/\r\n/g, '\n');
  const files = {
    'src/app/modules.ts': read('src/app/modules.ts'),
    'src/app/i18n-resources.d.ts': read('src/app/i18n-resources.d.ts'),
    'src/mocks/handlers/index.ts': read('src/mocks/handlers/index.ts'),
    'src/core/config/routes.ts': read('src/core/config/routes.ts'),
  };
  const remove = (rel) => {
    if (!fs.existsSync(file(rel))) return;
    if (dryRun) log(`  delete ${rel}`);
    else fs.rmSync(file(rel), { recursive: true, force: true });
  };

  for (const id of new Set(ids)) {
    const ident = camel(id);
    log(`- removing ${id}`);
    files['src/app/modules.ts'] = dropLines(
      files['src/app/modules.ts'],
      (l) => l.includes(`'@/features/${id}'`) || l.trim() === `${ident},`,
    );
    files['src/app/i18n-resources.d.ts'] = dropLines(
      files['src/app/i18n-resources.d.ts'],
      (l) =>
        l.includes(`/features/${id}/`) ||
        l.trim().startsWith(`'${id}':`) ||
        l.trim().startsWith(`${ident}:`),
    );
    files['src/mocks/handlers/index.ts'] = dropLines(
      files['src/mocks/handlers/index.ts'],
      (l) => /from '\.\/([\w-]+)'/.exec(l)?.[1] === id || l.trim() === `...${ident}Handlers,`,
    );

    remove(`src/features/${id}`);
    const handlers = fs.readdirSync(file('src/mocks/handlers'));
    handlers
      .filter((f) => f === `${id}.ts` || f.startsWith(`${id}-`))
      .forEach((f) => remove(`src/mocks/handlers/${f}`));
    const preview = features.find((f) => f.id === id)?.preview;
    if (preview) remove(`public${preview}`);
  }

  const homeBase = features.find((f) => f.id === home)?.basePath;
  if (homeBase) {
    files['src/core/config/routes.ts'] = files['src/core/config/routes.ts'].replace(
      /export const HOME_AFTER_LOGIN = [^;]+;/,
      `export const HOME_AFTER_LOGIN = defineRoute('${homeBase}');`,
    );
  }

  for (const [rel, content] of Object.entries(files)) {
    if (dryRun) log(`  edit   ${rel}`);
    else fs.writeFileSync(file(rel), content);
  }
}
