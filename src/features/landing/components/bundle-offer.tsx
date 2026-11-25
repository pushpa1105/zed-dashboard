import { PackageCheck } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Button } from '@/shared/ui/button';

import { BUNDLE_ID, checkoutUrl, PRICE } from '../lib/store';

/** "Everything for one price" banner. Renders nothing when the storefront is off. */
export function BundleOffer({ count }: { count: number }) {
  const { t } = useTranslation('landing');
  const url = checkoutUrl(BUNDLE_ID);
  if (!url) return null;

  const saving = count * PRICE.dashboard - PRICE.bundle;

  return (
    <div className="mt-8 flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-xs sm:flex-row sm:items-center">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <PackageCheck className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 font-semibold">
          {t('templates.store.bundleTitle', { count })}
          {saving > 0 && (
            <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
              {t('templates.store.save', { amount: saving })}
            </span>
          )}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{t('templates.store.bundleBody')}</p>
      </div>
      <Button asChild>
        <a href={url}>{t('templates.store.bundleCta', { price: PRICE.bundle })}</a>
      </Button>
    </div>
  );
}
