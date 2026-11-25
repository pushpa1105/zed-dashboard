/**
 * Code generators: `npm run generate`
 *
 * - workspace: a new dashboard product (own URL prefix, layout, menu, pages).
 * - feature:   a page inside the default app shell (/app/...).
 * - component: a component (+ test) in a feature or in shared/components.
 *
 * Both module generators create a registered, tested module that runs as is.
 *
 * @param {import('plop').NodePlopAPI} plop
 */
import fs from 'node:fs';

const kebab = (v) => (/^[a-z][a-z0-9-]*$/.test(v) ? true : 'Use kebab-case, e.g. "projects"');

/** Layout names, read from the theme registry so new layouts show up here. */
const LAYOUTS = [
  ...fs
    .readFileSync('src/core/theme/config.ts', 'utf8')
    .split('export const SHELL_LAYOUTS')[1]
    .split('] as const')[0]
    .matchAll(/value: '([\w-]+)'/g),
].map((m) => m[1]);

/** Files every module needs, from the feature templates. */
const dataFiles = (dir) => [
  {
    type: 'add',
    path: `${dir}/model/{{kebabCase name}}.ts`,
    templateFile: 'generators/feature/model.ts.hbs',
  },
  {
    type: 'add',
    path: `${dir}/api/{{kebabCase name}}.ts`,
    templateFile: 'generators/feature/api.ts.hbs',
  },
  {
    type: 'add',
    path: 'src/mocks/handlers/{{kebabCase name}}.ts',
    templateFile: 'generators/feature/handlers.ts.hbs',
  },
];

/** Registers module `{{name}}` in the module list, the i18n types and the mock API. */
const register = (namespace) => [
  {
    type: 'modify',
    path: 'src/app/modules.ts',
    pattern: /(\n\n\/\*\*)/,
    template: "\nimport {{camelCase name}} from '@/features/{{kebabCase name}}';$1",
  },
  {
    type: 'modify',
    path: 'src/app/modules.ts',
    pattern: /(\n\];)/,
    template: '\n  {{camelCase name}},$1',
  },
  {
    type: 'modify',
    path: 'src/app/i18n-resources.d.ts',
    pattern: /(\n\n\/\*\*)/,
    template:
      "\nimport type {{camelCase name}} from '@/features/{{kebabCase name}}/i18n/en.json';$1",
  },
  {
    type: 'modify',
    path: 'src/app/i18n-resources.d.ts',
    pattern: /(\n {4}};\n {2}}\n})/,
    template: `\n      '${namespace}': typeof {{camelCase name}};$1`,
  },
  {
    type: 'modify',
    path: 'src/mocks/handlers/index.ts',
    pattern: /(\n\nexport const handlers = \[)/,
    template: "\nimport { {{camelCase name}}Handlers } from './{{kebabCase name}}';$1",
  },
  {
    type: 'modify',
    path: 'src/mocks/handlers/index.ts',
    pattern: /(export const handlers = \[\n)/,
    template: '$1  ...{{camelCase name}}Handlers,\n',
  },
];

const done = (doc) => () =>
  `Done. Run "npm run format && npm run check", then open it. See ${doc}.`;

export default function (plop) {
  plop.setGenerator('workspace', {
    description: 'Create and register a new dashboard workspace',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Workspace name (kebab-case, e.g. "clinic"):',
        validate: kebab,
      },
      { type: 'list', name: 'layout', message: 'Default shell layout:', choices: LAYOUTS },
    ],
    actions: [
      ...[
        ['index.ts', 'index.ts'],
        ['routes.ts', 'routes.ts'],
        ['README.md', 'README.md'],
        ['i18n/en.json', 'en.json'],
        ['i18n/es.json', 'es.json'],
        ['pages/overview-page.tsx', 'overview-page.tsx'],
        ['pages/records-page.tsx', 'records-page.tsx'],
        ['__tests__/workspace.test.tsx', 'test.tsx'],
      ].map(([target, template]) => ({
        type: 'add',
        path: `src/features/{{kebabCase name}}/${target}`,
        templateFile: `generators/workspace/${template}.hbs`,
      })),
      ...dataFiles('src/features/{{kebabCase name}}'),
      ...register('{{kebabCase name}}'),
      done('docs/adding-a-dashboard.md'),
    ],
  });

  plop.setGenerator('feature', {
    description: 'Create and register a page module inside the app shell',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Feature name (plural, kebab-case, e.g. "projects"):',
        validate: kebab,
      },
    ],
    actions: [
      {
        type: 'add',
        path: 'src/features/{{kebabCase name}}/index.ts',
        templateFile: 'generators/feature/index.ts.hbs',
      },
      {
        type: 'add',
        path: 'src/features/{{kebabCase name}}/i18n/en.json',
        templateFile: 'generators/feature/en.json.hbs',
      },
      {
        type: 'add',
        path: 'src/features/{{kebabCase name}}/i18n/es.json',
        templateFile: 'generators/feature/es.json.hbs',
      },
      {
        type: 'add',
        path: 'src/features/{{kebabCase name}}/pages/{{kebabCase name}}-page.tsx',
        templateFile: 'generators/feature/page.tsx.hbs',
      },
      {
        type: 'add',
        path: 'src/features/{{kebabCase name}}/__tests__/{{kebabCase name}}.test.tsx',
        templateFile: 'generators/feature/test.tsx.hbs',
      },
      ...dataFiles('src/features/{{kebabCase name}}'),
      {
        type: 'modify',
        path: 'src/core/config/routes.ts',
        pattern: /(\n} as const;)/,
        template: "\n  {{camelCase name}}: defineRoute('/app/{{kebabCase name}}'),$1",
      },
      ...register('{{camelCase name}}'),
      done('docs/adding-a-feature.md'),
    ],
  });

  plop.setGenerator('component', {
    description: 'Create a component (+ test)',
    prompts: [
      { type: 'input', name: 'name', message: 'Component name (e.g. "user-card"):' },
      {
        type: 'input',
        name: 'folder',
        message: 'Feature name (e.g. "tasks"), or "shared" for src/shared/components:',
      },
    ],
    actions: (data) => {
      const base =
        data?.folder === 'shared'
          ? 'src/shared/components'
          : `src/features/${data?.folder}/components`;
      return [
        {
          type: 'add',
          path: `${base}/{{kebabCase name}}.tsx`,
          templateFile: 'generators/component/component.tsx.hbs',
        },
        {
          type: 'add',
          path: `${base}/__tests__/{{kebabCase name}}.test.tsx`,
          templateFile: 'generators/component/component.test.tsx.hbs',
        },
      ];
    },
  });
}
