import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/core/api/client';
import { useTranslation } from '@/core/i18n/use-translation';

import { attendanceSchema, benefitsSchema, newHireSchema, type NewHire } from '../model/workforce';

import { hrPageKeys } from './hr-api';

export const workforceApi = {
  /** `week` is an offset from the current week: 0 = this week, -1 = last week. */
  attendance: (week: number) => api.get('/hr/attendance', attendanceSchema, { params: { week } }),
  approveTimesheets: (ids: string[]) => api.post('/hr/timesheets/approve', { ids }),
  onboarding: () => api.get('/hr/onboarding', z.array(newHireSchema)),
  toggleTask: ({ taskId, done }: { hireId: string; taskId: string; done: boolean }) =>
    api.patch(`/hr/onboarding/tasks/${taskId}`, { done }, newHireSchema),
  benefits: () => api.get('/hr/benefits', benefitsSchema),
};

export const workforceKeys = {
  attendances: () => [...hrPageKeys.all, 'attendance'] as const,
  attendance: (week: number) => [...workforceKeys.attendances(), week] as const,
  onboarding: () => [...hrPageKeys.all, 'onboarding'] as const,
  benefits: () => [...hrPageKeys.all, 'benefits'] as const,
};

export const attendanceQuery = (week: number) =>
  queryOptions({
    queryKey: workforceKeys.attendance(week),
    queryFn: () => workforceApi.attendance(week),
    placeholderData: keepPreviousData,
  });
export const onboardingQuery = () =>
  queryOptions({ queryKey: workforceKeys.onboarding(), queryFn: workforceApi.onboarding });
export const benefitsQuery = () =>
  queryOptions({ queryKey: workforceKeys.benefits(), queryFn: workforceApi.benefits });

export const useAttendance = (week: number) => useQuery(attendanceQuery(week));
export const useOnboarding = () => useQuery(onboardingQuery());
export const useBenefits = () => useQuery(benefitsQuery());

export function useApproveTimesheets() {
  const { t } = useTranslation('hr');
  return useMutation({
    mutationFn: workforceApi.approveTimesheets,
    meta: {
      invalidates: [workforceKeys.attendances()],
      successMessage: t('attendance.approved'),
    },
  });
}

/** Ticks a checklist item, optimistically so the progress bars move at once. */
export function useToggleOnboardingTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: workforceApi.toggleTask,
    onMutate: async ({ hireId, taskId, done }) => {
      await queryClient.cancelQueries({ queryKey: workforceKeys.onboarding() });
      queryClient.setQueryData<NewHire[]>(workforceKeys.onboarding(), (hires) =>
        hires?.map((h) =>
          h.id === hireId
            ? {
                ...h,
                tasks: h.tasks.map((task) => (task.id === taskId ? { ...task, done } : task)),
              }
            : h,
        ),
      );
    },
    // Settled, not success: a failed toggle must roll the optimistic tick back.
    onSettled: () => queryClient.invalidateQueries({ queryKey: workforceKeys.onboarding() }),
  });
}
