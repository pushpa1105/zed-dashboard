import { env } from '@/core/config/env';

/** USD. Keep in sync with your store products (docs/selling.md). */
export const PRICE = { dashboard: 10, bundle: 50 } as const;

/** Product id of the all-dashboards package (matches `npm run release`). */
export const BUNDLE_ID = 'complete';

/** Checkout link for a product, or null when the storefront is off. */
export const checkoutUrl = (product: string) =>
  env.STORE_URL ? env.STORE_URL.replace('{product}', product) : null;
