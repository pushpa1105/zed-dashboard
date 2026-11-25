import { useMemo } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';

/** Localized country name for an ISO 3166-1 alpha-2 code. */
export function useCountryName() {
  const { i18n } = useTranslation();
  const names = useMemo(
    () => new Intl.DisplayNames([i18n.language], { type: 'region' }),
    [i18n.language],
  );
  return (code: string) => names.of(code) ?? code;
}
