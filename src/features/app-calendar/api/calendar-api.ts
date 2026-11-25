import { queryOptions, useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/core/api/client';
import { useTranslation } from '@/core/i18n/use-translation';
import type { MutationOptions } from '@/core/query/query-client';

import { eventSchema, type CalendarEvent, type EventInput } from '../model/calendar';

export const calendarApi = {
  events: () => api.get('/calendar/events', z.array(eventSchema)),
  create: (input: EventInput) => api.post('/calendar/events', input, eventSchema),
  update: ({ id, input }: { id: string; input: Partial<EventInput> }) =>
    api.patch(`/calendar/events/${id}`, input, eventSchema),
  remove: (id: string) => api.delete(`/calendar/events/${id}`),
};

export const calendarKeys = {
  all: ['app-calendar'] as const,
  events: () => [...calendarKeys.all, 'events'] as const,
};

export const eventsQuery = () =>
  queryOptions({ queryKey: calendarKeys.events(), queryFn: calendarApi.events });

export const useEvents = () => useQuery(eventsQuery());

export function useCreateEvent(options?: MutationOptions<CalendarEvent, EventInput>) {
  const { t } = useTranslation('app-calendar');
  return useMutation({
    mutationFn: calendarApi.create,
    ...options,
    meta: {
      invalidates: [calendarKeys.events()],
      successMessage: t('toast.created'),
      ...options?.meta,
    },
  });
}

export function useUpdateEvent(
  options?: MutationOptions<CalendarEvent, { id: string; input: Partial<EventInput> }>,
) {
  const { t } = useTranslation('app-calendar');
  return useMutation({
    mutationFn: calendarApi.update,
    ...options,
    meta: {
      invalidates: [calendarKeys.events()],
      successMessage: t('toast.updated'),
      ...options?.meta,
    },
  });
}

export function useDeleteEvent(options?: MutationOptions<unknown, string>) {
  const { t } = useTranslation('app-calendar');
  return useMutation({
    mutationFn: calendarApi.remove,
    ...options,
    meta: {
      invalidates: [calendarKeys.events()],
      successMessage: t('toast.deleted'),
      ...options?.meta,
    },
  });
}
