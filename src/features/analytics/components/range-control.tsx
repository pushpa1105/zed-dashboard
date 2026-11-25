import { CalendarRange } from 'lucide-react';
import type { ReactNode } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

import { useRangeParams } from '../hooks/use-range';
import { COMPARES, RANGES, type Compare, type Range } from '../model/analytics';

/**
 * Date range + "compared to" selector for page headers. Both values live in
 * the URL, so a filtered view can be shared and survives a reload.
 */
export function RangeControl({ children }: { children?: ReactNode }) {
  const { t } = useTranslation('analytics');
  const { range, compare, setRange, setCompare } = useRangeParams();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={range} onValueChange={(value) => setRange(value as Range)}>
        <SelectTrigger className="w-40" aria-label={t('range.label')}>
          <CalendarRange className="text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {RANGES.map((value) => (
            <SelectItem key={value} value={value}>
              {t(`range.options.${value}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="hidden text-sm text-muted-foreground sm:inline">{t('range.vs')}</span>
      <Select value={compare} onValueChange={(value) => setCompare(value as Compare)}>
        <SelectTrigger className="w-44" aria-label={t('range.compare')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {COMPARES.map((value) => (
            <SelectItem key={value} value={value}>
              {t(`range.compareOptions.${value}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {children}
    </div>
  );
}
