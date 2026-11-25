import { initI18n } from '@/core/i18n/i18n';

import { modules } from './modules';
import { getTranslations } from './registry';

/** Translations other than English: one small chunk each, fetched when that language is used. */
const lazyBundles = import.meta.glob<{ default: object }>([
  '../features/*/i18n/*.json',
  '!../features/*/i18n/en.json',
]);

/** Registers `common` plus every feature's namespace. Imported once by main.tsx and tests. */
export const i18n = initI18n(
  getTranslations(modules),
  async (language, namespace) =>
    (await lazyBundles[`../features/${namespace}/i18n/${language}.json`]?.())?.default,
);
