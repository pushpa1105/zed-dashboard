import { queryOptions, useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/core/api/client';
import { useTranslation } from '@/core/i18n/use-translation';

import { roleSchema, type RoleForm } from '../model/roles';

const rolesApi = {
  list: () => api.get('/saas/roles', z.array(roleSchema)),
  create: (input: RoleForm) => api.post('/saas/roles', input, roleSchema),
  savePermissions: ({ id, permissions }: { id: string; permissions: string[] }) =>
    api.put(`/saas/roles/${id}/permissions`, { permissions }, roleSchema),
};

const roleKeys = { all: ['saas', 'roles'] as const };

export const rolesQuery = () => queryOptions({ queryKey: roleKeys.all, queryFn: rolesApi.list });
export const useRoles = () => useQuery(rolesQuery());

export function useCreateRole() {
  const { t } = useTranslation('saas');
  return useMutation({
    mutationFn: rolesApi.create,
    meta: { invalidates: [roleKeys.all], successMessage: t('roles.toast.created') },
  });
}
export function useSavePermissions() {
  const { t } = useTranslation('saas');
  return useMutation({
    mutationFn: rolesApi.savePermissions,
    meta: { invalidates: [roleKeys.all], successMessage: t('roles.toast.saved') },
  });
}
