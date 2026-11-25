import { useSearchParams } from '@/core/router/router';

import {
  FINANCE_PERIODS,
  FINANCE_SECTIONS,
  type FinanceFilters,
  type FinancePeriod,
  type FinanceSection,
} from '../model/overview';

/** Reads `?section=&period=` (falls back to defaults on bad values). */
export function parseFinanceFilters(params: URLSearchParams): FinanceFilters {
  const section = params.get('section');
  const period = params.get('period');
  return {
    section: (FINANCE_SECTIONS as readonly string[]).includes(section ?? '')
      ? (section as FinanceSection)
      : 'dashboard',
    period: (FINANCE_PERIODS as readonly string[]).includes(period ?? '')
      ? (period as FinancePeriod)
      : 'month',
  };
}

/** Filters live in the URL so a filtered view can be shared or bookmarked. */
export function useFinanceFilters() {
  const [params, setParams] = useSearchParams();
  const filters = parseFinanceFilters(params);
  const update = (patch: Partial<FinanceFilters>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(patch)) next.set(key, value);
        return next;
      },
      { replace: true },
    );
  return [filters, update] as const;
}
