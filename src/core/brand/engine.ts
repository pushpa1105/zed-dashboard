import { setTranslationVariables } from '@/core/i18n/i18n';
import { useThemeStore } from '@/core/theme/store';

import { markSvg } from './config';
import { getBrand, useBrandStore } from './store';

export const SPLASH_STORAGE_KEY = 'zed-dashboard:splash';

const svgUrl = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`;

/** Favicon, i18n's {{brand}} and the loader snapshot follow the brand and the theme. */
function applyBrand() {
  const brand = getBrand();
  const styles = getComputedStyle(document.documentElement);
  const token = (name: string) => styles.getPropertyValue(name).trim();
  const mark = brand.mark ?? svgUrl(markSvg(token('--primary'), token('--primary-foreground')));

  document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.setAttribute('href', mark);
  // The loader in index.html runs before any CSS or JS; it reads this snapshot.
  localStorage.setItem(
    SPLASH_STORAGE_KEY,
    JSON.stringify({
      mark,
      name: brand.name,
      bg: token('--background'),
      fg: token('--foreground'),
    }),
  );

  setTranslationVariables({ brand: brand.name });
}

/** Call once at startup, after initTheme(). */
export function initBrand() {
  applyBrand();
  useBrandStore.subscribe(applyBrand);
  useThemeStore.subscribe(applyBrand);
}

/** Hides the index.html loader once the app has painted. */
export function hideSplash() {
  const splash = document.getElementById('splash');
  if (!splash) return;
  splash.dataset.hidden = '';
  splash.addEventListener('transitionend', () => splash.remove(), { once: true });
}
