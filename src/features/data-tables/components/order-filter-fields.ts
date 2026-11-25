import { useMemo } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import type { FilterField } from '@/shared/components/data-table/filter-tree';

import { ORDER_CHANNELS, ORDER_COUNTRIES, ORDER_STATUSES } from '../model/order';

/** Fields offered by the advanced filter builder (ids match the API's field names). */
export function useOrderFilterFields(): FilterField[] {
  const { t } = useTranslation('data-tables');
  return useMemo(
    () => [
      { id: 'number', label: t('columns.number'), type: 'text' },
      { id: 'customerName', label: t('columns.customer'), type: 'text' },
      { id: 'customerEmail', label: t('columns.email'), type: 'text' },
      {
        id: 'status',
        label: t('columns.status'),
        type: 'enum',
        options: ORDER_STATUSES.map((s) => ({ value: s, label: t(`status.${s}`) })),
      },
      {
        id: 'channel',
        label: t('columns.channel'),
        type: 'enum',
        options: ORDER_CHANNELS.map((c) => ({ value: c, label: t(`channel.${c}`) })),
      },
      {
        id: 'country',
        label: t('columns.country'),
        type: 'enum',
        options: ORDER_COUNTRIES.map((c) => ({ value: c, label: c })),
      },
      { id: 'total', label: t('columns.total'), type: 'number' },
      { id: 'items', label: t('columns.items'), type: 'number' },
      { id: 'createdAt', label: t('columns.createdAt'), type: 'date' },
      { id: 'assignee', label: t('columns.assignee'), type: 'text' },
    ],
    [t],
  );
}
