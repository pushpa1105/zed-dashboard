import { http, HttpResponse, type HttpHandler } from 'msw';

import { errorResponse } from '../utils';

import { DAY, guard, S } from './saas-admin';

const RESOURCES = ['projects', 'api_keys', 'webhooks', 'logs', 'members', 'billing', 'settings'];
const ACTIONS = ['read', 'create', 'update', 'delete'];

const grant = (resources: string[], actions: string[]) =>
  resources.flatMap((r) => actions.map((a) => `${r}:${a}`));

const ROLES: Array<[string, string, number, string[]]> = [
  ['Owner', 'Full access, including ownership transfer.', 1, grant(RESOURCES, ACTIONS)],
  [
    'Admin',
    'Manages members, keys, webhooks and settings.',
    3,
    grant(RESOURCES, ACTIONS).filter((p) => p !== 'billing:delete'),
  ],
  [
    'Developer',
    'Builds on the API: keys, webhooks, logs.',
    9,
    [
      ...grant(['projects', 'api_keys', 'webhooks'], ACTIONS),
      ...grant(['logs', 'members', 'settings'], ['read']),
    ],
  ],
  [
    'Support',
    'Reads logs and projects to help customers.',
    4,
    grant(['projects', 'logs'], ['read']),
  ],
  ['Viewer', 'Read-only access to dashboards.', 6, grant(RESOURCES, ['read'])],
];

function build() {
  return ROLES.map(([name, description, members, permissions], i) => ({
    id: `role-${name.toLowerCase()}`,
    name,
    description,
    system: i === 0,
    members,
    permissions,
    updatedAt: Date.now() - (i + 2) * 9 * DAY,
  }));
}

let state: ReturnType<typeof build> | null = null;
const roles = () => (state ??= build());

export const saasRoleHandlers: HttpHandler[] = [
  http.get(`${S}/roles`, async ({ request }) => {
    const denied = await guard(request);
    return denied ?? HttpResponse.json(roles());
  }),
  http.post<never, { name: string; description: string; from: string }>(
    `${S}/roles`,
    async ({ request }) => {
      const denied = await guard(request);
      if (denied) return denied;
      const { name, description, from } = await request.json();
      if (roles().some((r) => r.name.toLowerCase() === name.toLowerCase()))
        return errorResponse('A role with this name already exists', 409);
      const role = {
        id: `role-${Date.now()}`,
        name,
        description,
        system: false,
        members: 0,
        permissions: [...(roles().find((r) => r.id === from)?.permissions ?? [])],
        updatedAt: Date.now(),
      };
      roles().push(role);
      return HttpResponse.json(role, { status: 201 });
    },
  ),
  http.put<{ id: string }, { permissions: string[] }>(
    `${S}/roles/:id/permissions`,
    async ({ request, params }) => {
      const denied = await guard(request);
      if (denied) return denied;
      const role = roles().find((r) => r.id === params.id);
      if (!role) return errorResponse('Role not found', 404);
      if (role.system) return errorResponse('System roles cannot be changed', 403);
      role.permissions = (await request.json()).permissions;
      role.updatedAt = Date.now();
      return HttpResponse.json(role);
    },
  ),
];
