import { queryOptions, useMutation, useQuery } from '@tanstack/react-query';

import { api } from '@/core/api/client';
import { useTranslation } from '@/core/i18n/use-translation';

import { storeSettingsSchema, type SettingsSection, type StoreSettings } from '../model/settings';

import { storeKeys } from './store-api';

const settingsKey = [...storeKeys.all, 'settings'] as const;

export const settingsQuery = () =>
  queryOptions({
    queryKey: settingsKey,
    queryFn: () => api.get('/ecommerce/settings', storeSettingsSchema),
  });

export const useStoreSettings = () => useQuery(settingsQuery());

export function useSaveSettings<S extends SettingsSection>(section: S) {
  const { t } = useTranslation('ecommerce');
  return useMutation({
    mutationFn: (values: StoreSettings[S]) =>
      api.put(`/ecommerce/settings/${section}`, values, storeSettingsSchema),
    meta: { invalidates: [settingsKey], successMessage: t('settings.toast.saved') },
  });
}
