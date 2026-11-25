import { commonTranslations } from '@/core/i18n/i18n';
import { LANGUAGES } from '@/core/i18n/languages';

import { modules } from '../modules';
import { validateModules } from '../registry';

/** Flattens a translation tree into dotted keys: { a: { b: 'x' } } → ['a.b']. */
function keysOf(tree: object, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'object' && value !== null
      ? keysOf(value as object, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

describe('module registry', () => {
  it('has no duplicate ids, clashing paths or dead links', () => {
    expect(validateModules(modules)).toEqual([]);
  });

  it('catches mistakes in a broken registry', () => {
    const broken = [
      { id: 'a', nav: [{ to: '/nowhere', icon: () => null, label: () => '' }] },
      { id: 'a' },
    ] as unknown as Parameters<typeof validateModules>[0];

    expect(validateModules(broken)).toEqual([
      'Duplicate module id "a"',
      'Link "/nowhere" does not match any route',
    ]);
  });
});

/** Every feature translation file on disk, by namespace and language. */
const featureFiles = import.meta.glob<object>('../../features/*/i18n/*.json', {
  eager: true,
  import: 'default',
});

describe('translations', () => {
  const namespaces: Record<string, Partial<Record<string, object>>> = {
    common: commonTranslations,
  };
  for (const [file, bundle] of Object.entries(featureFiles)) {
    const [, namespace, language] = /features\/([\w-]+)\/i18n\/(\w+)\.json$/.exec(file)!;
    (namespaces[namespace!] ??= {})[language!] = bundle;
  }

  for (const [namespace, bundles] of Object.entries(namespaces)) {
    const reference = keysOf(bundles.en!).sort();

    for (const { code } of LANGUAGES.filter((l) => l.code !== 'en')) {
      it(`"${namespace}" has the same keys in "${code}" as in "en"`, () => {
        expect(bundles[code], `missing ${code} translations`).toBeDefined();
        expect(keysOf(bundles[code]!).sort()).toEqual(reference);
      });
    }
  }
});
