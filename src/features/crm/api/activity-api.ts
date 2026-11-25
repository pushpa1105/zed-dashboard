import { queryOptions, useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/core/api/client';
import { useTranslation } from '@/core/i18n/use-translation';

import { feedItemSchema, type LogActivityInput } from '../model/activity';

import { crmKeys } from './crm-api';

const activityKey = () => [...crmKeys.all, 'activity'] as const;

export const activityQuery = () =>
  queryOptions({
    queryKey: activityKey(),
    queryFn: () => api.get('/crm/activity', z.array(feedItemSchema)),
  });

export const useActivityFeed = () => useQuery(activityQuery());

export function useLogActivity() {
  const { t } = useTranslation('crm');
  return useMutation({
    mutationFn: (input: LogActivityInput) => api.post('/crm/activity', input, feedItemSchema),
    meta: { invalidates: [activityKey()], successMessage: t('activity.logged') },
  });
}
