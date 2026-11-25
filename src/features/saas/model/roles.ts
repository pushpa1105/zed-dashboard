import { z } from 'zod';

export const PERMISSION_RESOURCES = [
  'projects',
  'api_keys',
  'webhooks',
  'logs',
  'members',
  'billing',
  'settings',
] as const;
export const PERMISSION_ACTIONS = ['read', 'create', 'update', 'delete'] as const;

export const permissionKey = (resource: string, action: string) => `${resource}:${action}`;

export const roleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  system: z.boolean(),
  members: z.number(),
  permissions: z.array(z.string()),
  updatedAt: z.number(),
});
export type Role = z.infer<typeof roleSchema>;

/** Template value for a role that starts with no permissions. */
export const BLANK_ROLE = 'blank';

export const roleFormSchema = z.object({
  name: z.string().trim().min(2).max(40),
  description: z.string().trim().max(160),
  from: z.string(),
});
export type RoleForm = z.infer<typeof roleFormSchema>;
