import i18n, { type Resource } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import { BRAND } from '@/core/brand/config';
import { env } from '@/core/config/env';

import { DEFAULT_NAMESPACE, LANGUAGES, type Language } from './languages';
import commonEn from './locales/en.json';
import commonEs from './locales/es.json';

/**
 * i18n is split into namespaces: `common` (owned by core, shared UI strings)
 * plus one namespace per feature, contributed by its manifest. `src/app`
 * calls `initI18n()` with every feature's translations.
 */
export const commonTranslations = { en: commonEn, es: commonEs };

type Bundles = Record<string, Partial<Record<Language, object>>>;

/** Loads one namespace in one language (used for languages not bundled up front). */
export type BundleLoader = (language: string, namespace: string) => Promise<object | undefined>;

export function initI18n(featureBundles: Bundles = {}, loadBundle?: BundleLoader) {
  const bundles: Bundles = { [DEFAULT_NAMESPACE]: commonTranslations, ...featureBundles };

  const resources: Resource = {};
  for (const { code } of LANGUAGES) {
    resources[code] = {};
    for (const [namespace, translations] of Object.entries(bundles)) {
      const bundle = translations[code];
      if (bundle) resources[code][namespace] = bundle as Resource[string][string];
    }
  }

  if (i18n.isInitialized) {
    for (const [lng, namespaces] of Object.entries(resources)) {
      for (const [ns, bundle] of Object.entries(namespaces)) {
        i18n.addResourceBundle(lng, ns, bundle, true, true);
      }
    }
    return i18n;
  }

  if (loadBundle) {
    i18n.use({
      type: 'backend',
      read: (language: string, namespace: string, done: (error: unknown, data: object) => void) =>
        loadBundle(language, namespace).then(
          (bundle) => done(null, bundle ?? {}),
          (error: unknown) => done(error, {}),
        ),
    });
  }

  void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      // Bundled resources cover English; the loader fetches the rest on demand.
      partialBundledLanguages: Boolean(loadBundle),
      ns: Object.keys(bundles),
      defaultNS: DEFAULT_NAMESPACE,
      fallbackNS: DEFAULT_NAMESPACE,
      fallbackLng: env.DEFAULT_LOCALE,
      supportedLngs: LANGUAGES.map((l) => l.code),
      // React already escapes. {{brand}} works in every string (see setTranslationVariables).
      interpolation: { escapeValue: false, defaultVariables: { brand: BRAND.name } },
      detection: {
        order: ['localStorage', 'navigator'],
        lookupLocalStorage: 'zed-dashboard:locale',
        caches: ['localStorage'],
      },
    });

  i18n.on('languageChanged', (lng) => {
    document.documentElement.lang = lng;
  });

  return i18n;
}

export { i18n };

/** Values every translation can use without passing them, e.g. "Welcome to {{brand}}". */
export function setTranslationVariables(variables: Record<string, string>) {
  const current = i18n.options.interpolation?.defaultVariables ?? {};
  if (Object.entries(variables).every(([key, value]) => current[key] === value)) return;
  i18n.options.interpolation = {
    ...i18n.options.interpolation,
    defaultVariables: { ...current, ...variables },
  };
  // Re-renders every translated text.
  if (i18n.isInitialized) void i18n.changeLanguage(i18n.language);
}
