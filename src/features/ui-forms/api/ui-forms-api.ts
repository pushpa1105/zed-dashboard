import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/core/api/client';
import type { MutationOptions } from '@/core/query/query-client';

const userResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
  team: z.string(),
});

const countryResultSchema = z.object({
  code: z.string(),
  name: z.string(),
  region: z.string(),
});

export type UserResult = z.infer<typeof userResultSchema>;
export type CountryResult = z.infer<typeof countryResultSchema>;

/** Plain request functions. Each accepts an AbortSignal so stale searches are cancelled. */
export const uiFormsApi = {
  searchUsers: (q: string, signal?: AbortSignal) =>
    api.get('/ui/search/users', z.array(userResultSchema), { params: { q }, signal }),

  searchCountries: (q: string, signal?: AbortSignal) =>
    api.get('/ui/search/countries', z.array(countryResultSchema), { params: { q }, signal }),

  createCompany: (input: Record<string, unknown>) =>
    api.post('/ui/forms/company', input, z.object({ id: z.string() }).loose()),
};

export function useCreateCompany(
  options?: MutationOptions<{ id: string }, Record<string, unknown>>,
) {
  return useMutation({ mutationFn: uiFormsApi.createCompany, ...options });
}

const treeNodeSchema = z.object({
  value: z.string(),
  label: z.string(),
  hasChildren: z.boolean().optional(),
});

/** Demo endpoints for the form-layout, auth and input pages. */
export const demoFormsApi = {
  submit: (input: Record<string, unknown>) =>
    api.post('/ui/forms/submit', input, z.object({ id: z.string() }).loose()),
  auth: (action: string, input: Record<string, unknown>) =>
    api.post(`/ui/auth/${action}`, input, z.object({ ok: z.boolean() })),
  treeChildren: (parent: string) =>
    api.get('/ui/tree/children', z.array(treeNodeSchema), { params: { parent } }),
};

/** Submits any demo form; the caller shows its own toast. */
export function useDemoSubmit(options?: MutationOptions<{ id: string }, Record<string, unknown>>) {
  return useMutation({ mutationFn: demoFormsApi.submit, ...options });
}
