import { http, HttpResponse, type HttpHandler } from 'msw';

import { env } from '@/core/config/env';

import { errorResponse, networkDelay, requireAuth } from '../utils';

type Operation = {
  id: string;
  code: string;
  name: string;
  owner: string;
  progress: number;
  value: number;
  dueDate: string;
};

const SEED_OPERATIONS: Operation[] = [
  {
    id: 'op-1342',
    code: '1342',
    name: 'Migrate billing to usage-based plans',
    owner: 'Hannah Morgan',
    progress: 70,
    value: 77,
    dueDate: '2026-12-04',
  },
  {
    id: 'op-4233',
    code: '4233',
    name: 'Warehouse scanner rollout, region 2',
    owner: 'Megan Clark',
    progress: 40,
    value: 12,
    dueDate: '2026-12-11',
  },
  {
    id: 'op-3442',
    code: '3442',
    name: 'Customer portal redesign',
    owner: 'Ivan Serhin',
    progress: 50,
    value: 43,
    dueDate: '2026-12-18',
  },
  {
    id: 'op-3244',
    code: '3244',
    name: 'SOC 2 evidence collection',
    owner: 'Priya Natarajan',
    progress: 30,
    value: 42,
    dueDate: '2027-01-08',
  },
  {
    id: 'op-6543',
    code: '6543',
    name: 'Partner API v2 launch',
    owner: 'Jeff Sussex',
    progress: 85,
    value: 65,
    dueDate: '2026-11-30',
  },
  {
    id: 'op-7120',
    code: '7120',
    name: 'Quarterly pricing review',
    owner: 'Lena Duarte',
    progress: 15,
    value: 28,
    dueDate: '2027-01-15',
  },
];

/** In-memory (resets on reload): deletions can be undone through `restore`. */
let operations = [...SEED_OPERATIONS];
const deleted = new Map<string, { op: Operation; index: number }>();

function overview() {
  return {
    sales: {
      total: 12_875,
      previous: 7_490,
      delta: 12,
      months: [
        { month: 'March', amount: 7_490, pct: 60 },
        { month: 'April', amount: 1_072, pct: 40 },
        { month: 'May', amount: 2_320, pct: 50 },
        { month: 'June', amount: 7_490, pct: 70 },
      ],
    },
    target: 175,
    projects: [
      { year: '2020', done: 128, created: 162, late: 54 },
      { year: '2021', done: 140, created: 216, late: 48 },
      { year: '2022', done: 184, created: 240, late: 58 },
      { year: '2023', done: 172, created: 218, late: 49 },
      { year: '2024', done: 114, created: 142, late: 36 },
      { year: '2025', done: 131, created: 171, late: 41 },
    ],
    tasks: [
      { key: 'done', label: 'Done', value: 72 },
      { key: 'new', label: 'New', value: 58 },
      { key: 'inProgress', label: 'In progress', value: 41 },
      { key: 'late', label: 'Late', value: 18 },
    ],
    capacity: { used: 312, total: 520 },
    analysis: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => ({
      day,
      hours: [42, 61, 78, 54, 66, 24, 30][i]!,
      planned: [48, 56, 64, 60, 60, 20, 20][i]!,
    })),
    deadlines: ['2026-11-30', '2026-12-04', '2026-12-11', '2026-12-18'],
    clients: [
      { id: 'c1', name: 'Jenny Wilson', company: 'Northwind Labs', since: '2026-11-21' },
      { id: 'c2', name: 'Marcus Reed', company: 'Haldane & Co.', since: '2026-11-18' },
      { id: 'c3', name: 'Aiko Tanaka', company: 'Kumo Logistics', since: '2026-11-14' },
      { id: 'c4', name: 'Rafael Ortiz', company: 'Brightline Studio', since: '2026-11-09' },
    ],
    activity: [
      {
        id: 'a1',
        actor: 'Hannah Morgan',
        action: 'moved',
        target: 'Billing migration to review',
        at: '2026-11-24T09:12:00Z',
      },
      {
        id: 'a2',
        actor: 'Ivan Serhin',
        action: 'uploaded',
        target: 'portal-wireframes-v3.fig',
        at: '2026-11-24T08:40:00Z',
      },
      {
        id: 'a3',
        actor: 'Megan Clark',
        action: 'commented on',
        target: 'Scanner rollout plan',
        at: '2026-11-23T16:05:00Z',
      },
      {
        id: 'a4',
        actor: 'Jeff Sussex',
        action: 'closed',
        target: '12 tasks in Partner API v2',
        at: '2026-11-23T11:30:00Z',
      },
      {
        id: 'a5',
        actor: 'Priya Natarajan',
        action: 'requested access to',
        target: 'Audit evidence folder',
        at: '2026-11-22T14:20:00Z',
      },
    ],
  };
}

/** Mock API for the "dashboard-projects" feature. */
export const erpProjectsHandlers: HttpHandler[] = [
  http.get(`${env.API_URL}/erp/projects/overview`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    return HttpResponse.json(overview());
  }),

  http.get(`${env.API_URL}/erp/projects/operations`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    return HttpResponse.json(operations);
  }),

  http.patch<{ id: string }, { progress: number }>(
    `${env.API_URL}/erp/projects/operations/:id`,
    async ({ request, params }) => {
      await networkDelay();
      const auth = requireAuth(request);
      if ('error' in auth) return auth.error;
      const op = operations.find((o) => o.id === params.id);
      if (!op) return errorResponse('Operation not found', 404);
      const { progress } = await request.json();
      const updated = { ...op, progress: Math.max(0, Math.min(100, Math.round(progress))) };
      operations = operations.map((o) => (o.id === op.id ? updated : o));
      return HttpResponse.json(updated);
    },
  ),

  http.delete(`${env.API_URL}/erp/projects/operations/:id`, async ({ request, params }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const index = operations.findIndex((op) => op.id === params.id);
    if (index === -1) return errorResponse('Operation not found', 404);
    deleted.set(operations[index]!.id, { op: operations[index]!, index });
    operations = operations.filter((op) => op.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${env.API_URL}/erp/projects/operations/:id/restore`, async ({ request, params }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const entry = deleted.get(String(params.id));
    if (!entry) return errorResponse('Nothing to restore', 404);
    deleted.delete(entry.op.id);
    operations = [...operations];
    operations.splice(Math.min(entry.index, operations.length), 0, entry.op);
    return HttpResponse.json(entry.op);
  }),
];
