import { useMemo } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import type { FilterBuilderLabels } from '@/shared/components/data-table/advanced-filter-builder';
import type { ColumnHeaderLabels } from '@/shared/components/data-table/data-table-column-header';
import type { PaginationLabels } from '@/shared/components/data-table/data-table-pagination';
import type { SavedViewsLabels } from '@/shared/components/data-table/data-table-saved-views';
import type { Density } from '@/shared/components/data-table/density';

/**
 * Translated labels for the (language-agnostic) data-table kit, so every
 * table in this feature speaks the current language.
 */
export function useTableLabels() {
  const { t, i18n } = useTranslation('data-tables');

  return useMemo(() => {
    const n = (value: number) => value.toLocaleString(i18n.language);
    const header: ColumnHeaderLabels = {
      asc: t('header.asc'),
      desc: t('header.desc'),
      clearSort: t('header.clearSort'),
      pinStart: t('header.pinStart'),
      pinEnd: t('header.pinEnd'),
      unpin: t('header.unpin'),
      hide: t('header.hide'),
      group: t('header.group'),
      ungroup: t('header.ungroup'),
    };
    const pagination: PaginationLabels = {
      rowsPerPage: t('pagination.rowsPerPage'),
      range: (from, to, total) =>
        t('pagination.range', { from: n(from), to: n(to), total: n(total) }),
      selected: (count, total) => t('pagination.selected', { selected: n(count), total: n(total) }),
      first: t('pagination.first'),
      previous: t('pagination.previous'),
      next: t('pagination.next'),
      last: t('pagination.last'),
    };
    const filterBuilder: FilterBuilderLabels = {
      trigger: t('filterBuilder.trigger'),
      where: t('filterBuilder.where'),
      and: t('filterBuilder.and'),
      or: t('filterBuilder.or'),
      addRule: t('filterBuilder.addRule'),
      addGroup: t('filterBuilder.addGroup'),
      clear: t('filterBuilder.clear'),
      empty: t('filterBuilder.empty'),
      value: t('filterBuilder.value'),
      min: t('filterBuilder.min'),
      max: t('filterBuilder.max'),
      choose: t('filterBuilder.choose'),
    };
    const views: SavedViewsLabels = {
      trigger: t('views.trigger'),
      empty: t('views.empty'),
      namePlaceholder: t('views.namePlaceholder'),
      save: t('views.save'),
      remove: t('views.remove'),
    };
    const density: Record<Density, string> = {
      compact: t('density.compact'),
      default: t('density.default'),
      comfortable: t('density.comfortable'),
    };
    const range = {
      min: t('range.min'),
      max: t('range.max'),
      apply: t('range.apply'),
      clear: t('range.clear'),
    };
    const presets = [
      { label: t('presets.d7'), days: 7 },
      { label: t('presets.d30'), days: 30 },
      { label: t('presets.d90'), days: 90 },
      { label: t('presets.d365'), days: 365 },
    ];
    return { header, pagination, filterBuilder, views, density, range, presets };
  }, [t, i18n.language]);
}
