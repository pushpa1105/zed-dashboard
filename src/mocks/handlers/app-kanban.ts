import { http, HttpResponse, type HttpHandler } from 'msw';

import { env } from '@/core/config/env';

import { uid } from '../db';
import { errorResponse, networkDelay, requireAuth } from '../utils';

/**
 * Mock API for the kanban app: three boards with columns, cards, checklists
 * and comments. Moves and edits are kept in memory until reload.
 */

type Priority = 'low' | 'medium' | 'high' | 'urgent';
type DbCard = {
  id: string;
  key: string;
  boardId: string;
  columnId: string;
  title: string;
  description: string;
  labelIds: string[];
  assigneeIds: string[];
  due: string | null;
  priority: Priority;
  checklist: Array<{ id: string; text: string; done: boolean }>;
  comments: Array<{ id: string; authorId: string; text: string; at: string }>;
};
type DbColumn = { id: string; boardId: string; title: string; wipLimit: number | null };
type DbBoard = { id: string; name: string; description: string; prefix: string };

const API = `${env.API_URL}/kanban`;
const DAY = 86_400_000;

const MEMBERS = [
  { id: 'm-ines', name: 'Ines Duarte', role: 'Product manager' },
  { id: 'm-tomas', name: 'Tomas Reyes', role: 'Engineer' },
  { id: 'm-aiko', name: 'Aiko Tanaka', role: 'Designer' },
  { id: 'm-samuel', name: 'Samuel Adeyemi', role: 'Data engineer' },
  { id: 'm-marta', name: 'Marta Kowalska', role: 'Engineer' },
  { id: 'm-demo', name: 'Demo User', role: 'Engineering lead' },
];

const LABELS = [
  { id: 'l-bug', name: 'Bug', tone: 'danger' },
  { id: 'l-feature', name: 'Feature', tone: 'violet' },
  { id: 'l-design', name: 'Design', tone: 'magenta' },
  { id: 'l-infra', name: 'Infra', tone: 'blue' },
  { id: 'l-docs', name: 'Docs', tone: 'aqua' },
  { id: 'l-customer', name: 'Customer', tone: 'orange' },
] as const;

/** Local calendar date (YYYY-MM-DD) `days` from today. */
const due = (days: number) => {
  const d = new Date(Date.now() + days * DAY);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const ago = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();
const checklist = (items: Array<[string, boolean]>) =>
  items.map(([text, done], i) => ({ id: `ci-${i}-${text.length}`, text, done }));

function seed() {
  const boards: DbBoard[] = [
    {
      id: 'b-launch',
      name: 'Scheduled reports launch',
      description: 'Ship scheduled PDF and Slack reports to all paid plans.',
      prefix: 'REP',
    },
    {
      id: 'b-web',
      name: 'Website refresh',
      description: 'New marketing site, pricing page and docs navigation.',
      prefix: 'WEB',
    },
    {
      id: 'b-support',
      name: 'Support escalations',
      description: 'Tier-2 issues escalated from the support queue.',
      prefix: 'SUP',
    },
  ];
  const columns: DbColumn[] = [
    { id: 'c-backlog', boardId: 'b-launch', title: 'Backlog', wipLimit: null },
    { id: 'c-todo', boardId: 'b-launch', title: 'To do', wipLimit: null },
    { id: 'c-doing', boardId: 'b-launch', title: 'In progress', wipLimit: 4 },
    { id: 'c-review', boardId: 'b-launch', title: 'In review', wipLimit: 2 },
    { id: 'c-done', boardId: 'b-launch', title: 'Done', wipLimit: null },
    { id: 'w-ideas', boardId: 'b-web', title: 'Ideas', wipLimit: null },
    { id: 'w-design', boardId: 'b-web', title: 'Design', wipLimit: 3 },
    { id: 'w-build', boardId: 'b-web', title: 'Build', wipLimit: 3 },
    { id: 'w-live', boardId: 'b-web', title: 'Live', wipLimit: null },
    { id: 's-new', boardId: 'b-support', title: 'New', wipLimit: null },
    { id: 's-investigating', boardId: 'b-support', title: 'Investigating', wipLimit: 3 },
    { id: 's-waiting', boardId: 'b-support', title: 'Waiting on customer', wipLimit: null },
    { id: 's-resolved', boardId: 'b-support', title: 'Resolved', wipLimit: null },
  ];

  type Seed = Omit<DbCard, 'id' | 'key' | 'boardId' | 'comments'> & {
    comments?: DbCard['comments'];
  };
  const launch: Seed[] = [
    {
      columnId: 'c-backlog',
      title: 'Timezone picker for schedule owner',
      description:
        'Schedules currently run in UTC. Owners should pick a timezone; default to the workspace timezone.',
      labelIds: ['l-feature'],
      assigneeIds: [],
      due: null,
      priority: 'low',
      checklist: [],
    },
    {
      columnId: 'c-backlog',
      title: 'Usage-based limits per plan',
      description: 'Starter: 5 schedules, Growth: 50, Scale: unlimited.',
      labelIds: ['l-feature', 'l-customer'],
      assigneeIds: ['m-ines'],
      due: due(21),
      priority: 'medium',
      checklist: [],
    },
    {
      columnId: 'c-todo',
      title: 'Retry failed Slack deliveries with backoff',
      description:
        'Use exponential backoff (1, 5, 30 min) and surface the final failure in the activity log.',
      labelIds: ['l-infra'],
      assigneeIds: ['m-samuel'],
      due: due(5),
      priority: 'high',
      checklist: checklist([
        ['Queue retry jobs', false],
        ['Log final failure', false],
        ['Alert owner by email', false],
      ]),
    },
    {
      columnId: 'c-todo',
      title: 'Empty state for the schedules list',
      description: '',
      labelIds: ['l-design'],
      assigneeIds: ['m-aiko'],
      due: due(3),
      priority: 'medium',
      checklist: [],
    },
    {
      columnId: 'c-todo',
      title: 'Docs: scheduling a report',
      description: 'Step-by-step guide with screenshots for the help centre.',
      labelIds: ['l-docs'],
      assigneeIds: ['m-ines'],
      due: due(9),
      priority: 'low',
      checklist: [],
    },
    {
      columnId: 'c-doing',
      title: 'PDF renderer: page breaks inside tables',
      description:
        'Long tables split mid-row. Repeat the header row on each page and keep rows together.',
      labelIds: ['l-bug'],
      assigneeIds: ['m-tomas'],
      due: due(1),
      priority: 'urgent',
      checklist: checklist([
        ['Reproduce with 300-row table', true],
        ['Keep rows together', true],
        ['Repeat header row', false],
      ]),
      comments: [
        {
          id: 'cm-1',
          authorId: 'm-ines',
          text: 'Fieldwork hit this on their board pack, can we get it into this sprint?',
          at: ago(20),
        },
        {
          id: 'cm-2',
          authorId: 'm-tomas',
          text: 'On it. Header repeat is the last bit.',
          at: ago(3),
        },
      ],
    },
    {
      columnId: 'c-doing',
      title: 'Schedule editor UI',
      description: 'Frequency, time, recipients and format in one dialog.',
      labelIds: ['l-feature', 'l-design'],
      assigneeIds: ['m-aiko', 'm-marta'],
      due: due(4),
      priority: 'high',
      checklist: checklist([
        ['Frequency picker', true],
        ['Recipients input', true],
        ['Format toggle', false],
        ['Preview', false],
      ]),
    },
    {
      columnId: 'c-doing',
      title: 'Worker autoscaling for render queue',
      description: 'Scale render workers on queue depth; cap at 20.',
      labelIds: ['l-infra'],
      assigneeIds: ['m-samuel'],
      due: due(6),
      priority: 'medium',
      checklist: [],
    },
    {
      columnId: 'c-review',
      title: 'Slack app manifest + OAuth scopes',
      description: '',
      labelIds: ['l-infra'],
      assigneeIds: ['m-demo'],
      due: due(-1),
      priority: 'high',
      checklist: checklist([['Scopes reviewed by security', true]]),
      comments: [
        { id: 'cm-3', authorId: 'm-demo', text: 'PR #1824 ready for review.', at: ago(30) },
      ],
    },
    {
      columnId: 'c-review',
      title: 'Email template for delivered reports',
      description: 'Plain, branded, with a single "Open report" button.',
      labelIds: ['l-design'],
      assigneeIds: ['m-aiko'],
      due: due(2),
      priority: 'medium',
      checklist: [],
    },
    {
      columnId: 'c-review',
      title: 'Permission check on shared schedules',
      description: 'Recipients without workspace access must only see the PDF.',
      labelIds: ['l-bug', 'l-customer'],
      assigneeIds: ['m-marta'],
      due: due(0),
      priority: 'urgent',
      checklist: [],
    },
    {
      columnId: 'c-done',
      title: 'Schedules data model and API',
      description: '',
      labelIds: ['l-feature'],
      assigneeIds: ['m-tomas'],
      due: null,
      priority: 'medium',
      checklist: checklist([
        ['Migration', true],
        ['CRUD endpoints', true],
        ['Tests', true],
      ]),
    },
    {
      columnId: 'c-done',
      title: 'Spike: PDF rendering options',
      description: 'Chose headless Chromium over a PDF library.',
      labelIds: ['l-infra'],
      assigneeIds: ['m-samuel', 'm-tomas'],
      due: null,
      priority: 'low',
      checklist: [],
    },
  ];
  const web: Seed[] = [
    {
      columnId: 'w-ideas',
      title: 'Interactive pricing calculator',
      description: '',
      labelIds: ['l-feature'],
      assigneeIds: [],
      due: null,
      priority: 'low',
      checklist: [],
    },
    {
      columnId: 'w-ideas',
      title: 'Customer story: Lumen Health',
      description: '',
      labelIds: ['l-customer', 'l-docs'],
      assigneeIds: ['m-ines'],
      due: due(30),
      priority: 'medium',
      checklist: [],
    },
    {
      columnId: 'w-design',
      title: 'Pricing page v3',
      description: 'Three tiers, yearly toggle, comparison table.',
      labelIds: ['l-design'],
      assigneeIds: ['m-aiko'],
      due: due(4),
      priority: 'high',
      checklist: checklist([
        ['Wireframes', true],
        ['Copy', false],
        ['Hi-fi', false],
      ]),
    },
    {
      columnId: 'w-design',
      title: 'Docs sidebar navigation',
      description: '',
      labelIds: ['l-design', 'l-docs'],
      assigneeIds: ['m-aiko'],
      due: due(8),
      priority: 'medium',
      checklist: [],
    },
    {
      columnId: 'w-build',
      title: 'Move marketing site to static export',
      description: '',
      labelIds: ['l-infra'],
      assigneeIds: ['m-marta'],
      due: due(10),
      priority: 'medium',
      checklist: [],
    },
    {
      columnId: 'w-live',
      title: 'New homepage hero',
      description: '',
      labelIds: ['l-design'],
      assigneeIds: ['m-aiko', 'm-ines'],
      due: null,
      priority: 'medium',
      checklist: [],
    },
  ];
  const support: Seed[] = [
    {
      columnId: 's-new',
      title: 'Halden Pharma: SSO login loop',
      description: 'Users bounced back to the IdP after login since Tuesday.',
      labelIds: ['l-bug', 'l-customer'],
      assigneeIds: [],
      due: due(1),
      priority: 'urgent',
      checklist: [],
    },
    {
      columnId: 's-investigating',
      title: 'Parcelpoint: CSV export missing rows',
      description: '',
      labelIds: ['l-bug'],
      assigneeIds: ['m-marta'],
      due: due(2),
      priority: 'high',
      checklist: [],
    },
    {
      columnId: 's-waiting',
      title: 'Kestrel & Co: custom domain DNS',
      description: 'Waiting for CNAME change on their side.',
      labelIds: ['l-customer'],
      assigneeIds: ['m-demo'],
      due: due(5),
      priority: 'low',
      checklist: [],
    },
    {
      columnId: 's-resolved',
      title: 'Mosaic Labs: duplicate invoices',
      description: '',
      labelIds: ['l-bug', 'l-customer'],
      assigneeIds: ['m-samuel'],
      due: null,
      priority: 'medium',
      checklist: [],
    },
  ];

  const cards: DbCard[] = [];
  const add = (boardId: string, prefix: string, items: Seed[], start: number) =>
    items.forEach((item, i) =>
      cards.push({
        comments: [],
        ...item,
        id: `card-${boardId}-${i}`,
        key: `${prefix}-${start + i}`,
        boardId,
      }),
    );
  add('b-launch', 'REP', launch, 214);
  add('b-web', 'WEB', web, 88);
  add('b-support', 'SUP', support, 1031);
  return { boards, columns, cards };
}

// Persisted per browser tab so a reload keeps your moves; tests start fresh.
const STORAGE_KEY = 'zed-dashboard:mock-kanban';
const canPersist = typeof sessionStorage !== 'undefined' && import.meta.env.MODE !== 'test';
let db: ReturnType<typeof seed> | null = null;
function store() {
  if (db) return db;
  try {
    const saved = canPersist ? sessionStorage.getItem(STORAGE_KEY) : null;
    db = saved ? (JSON.parse(saved) as ReturnType<typeof seed>) : seed();
  } catch {
    db = seed();
  }
  return db;
}
const persist = () => {
  if (canPersist && db) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};

const publicCard = ({ boardId: _b, ...card }: DbCard) => card;

function boardPayload(boardId: string) {
  const { boards, columns, cards } = store();
  const board = boards.find((b) => b.id === boardId);
  if (!board) return null;
  return {
    id: board.id,
    name: board.name,
    description: board.description,
    columns: columns.filter((c) => c.boardId === boardId).map(({ boardId: _b, ...c }) => c),
    cards: cards.filter((c) => c.boardId === boardId).map(publicCard),
  };
}

async function guard(request: Request) {
  await networkDelay();
  const auth = requireAuth(request);
  return 'error' in auth ? auth.error : null;
}

export const appKanbanHandlers: HttpHandler[] = [
  http.get(`${API}/workspace`, async ({ request }) => {
    const denied = await guard(request);
    if (denied) return denied;
    const { boards, cards } = store();
    return HttpResponse.json({
      boards: boards.map((b) => ({
        id: b.id,
        name: b.name,
        description: b.description,
        cardCount: cards.filter((c) => c.boardId === b.id).length,
      })),
      members: MEMBERS,
      labels: LABELS,
    });
  }),

  http.get<{ id: string }>(`${API}/boards/:id`, async ({ request, params }) => {
    const denied = await guard(request);
    if (denied) return denied;
    const payload = boardPayload(params.id);
    return payload ? HttpResponse.json(payload) : errorResponse('Board not found', 404);
  }),

  http.post<{ id: string }, { title: string; wipLimit: number | null }>(
    `${API}/boards/:id/columns`,
    async ({ request, params }) => {
      const denied = await guard(request);
      if (denied) return denied;
      const { title, wipLimit } = await request.json();
      if (!title?.trim()) return errorResponse('A column needs a title', 422);
      store().columns.push({
        id: `col-${uid()}`,
        boardId: params.id,
        title: title.trim(),
        wipLimit,
      });
      persist();
      return HttpResponse.json(boardPayload(params.id));
    },
  ),

  http.patch<{ id: string }, { title?: string; wipLimit?: number | null }>(
    `${API}/columns/:id`,
    async ({ request, params }) => {
      const denied = await guard(request);
      if (denied) return denied;
      const column = store().columns.find((c) => c.id === params.id);
      if (!column) return errorResponse('Column not found', 404);
      Object.assign(column, await request.json());
      persist();
      return HttpResponse.json(boardPayload(column.boardId));
    },
  ),

  http.post<{ id: string }, { columnId: string; title: string }>(
    `${API}/boards/:id/cards`,
    async ({ request, params }) => {
      const denied = await guard(request);
      if (denied) return denied;
      const { columnId, title } = await request.json();
      if (!title?.trim()) return errorResponse('A card needs a title', 422);
      const { boards, cards } = store();
      const board = boards.find((b) => b.id === params.id);
      if (!board) return errorResponse('Board not found', 404);
      const count = cards.filter((c) => c.boardId === board.id).length;
      cards.push({
        id: `card-${uid()}`,
        key: `${board.prefix}-${300 + count}`,
        boardId: board.id,
        columnId,
        title: title.trim(),
        description: '',
        labelIds: [],
        assigneeIds: [],
        due: null,
        priority: 'medium',
        checklist: [],
        comments: [],
      });
      persist();
      return HttpResponse.json(boardPayload(board.id));
    },
  ),

  http.patch<{ id: string }, Partial<DbCard>>(`${API}/cards/:id`, async ({ request, params }) => {
    const denied = await guard(request);
    if (denied) return denied;
    const card = store().cards.find((c) => c.id === params.id);
    if (!card) return errorResponse('Card not found', 404);
    const {
      id: _i,
      key: _k,
      boardId: _b,
      columnId: _c,
      comments: _m,
      ...patch
    } = await request.json();
    Object.assign(card, patch);
    persist();
    return HttpResponse.json(boardPayload(card.boardId));
  }),

  http.post<{ id: string }, { columnId: string; beforeId: string | null; assigneeIds?: string[] }>(
    `${API}/cards/:id/move`,
    async ({ request, params }) => {
      const denied = await guard(request);
      if (denied) return denied;
      const state = store();
      const card = state.cards.find((c) => c.id === params.id);
      if (!card) return errorResponse('Card not found', 404);
      const { columnId, beforeId, assigneeIds } = await request.json();
      state.cards = state.cards.filter((c) => c.id !== card.id);
      card.columnId = columnId;
      if (assigneeIds) card.assigneeIds = assigneeIds;
      const at = beforeId ? state.cards.findIndex((c) => c.id === beforeId) : -1;
      if (at >= 0) state.cards.splice(at, 0, card);
      else state.cards.push(card);
      persist();
      return HttpResponse.json(boardPayload(card.boardId));
    },
  ),

  http.post<{ id: string }, { text: string }>(
    `${API}/cards/:id/comments`,
    async ({ request, params }) => {
      const denied = await guard(request);
      if (denied) return denied;
      const card = store().cards.find((c) => c.id === params.id);
      if (!card) return errorResponse('Card not found', 404);
      const { text } = await request.json();
      if (!text?.trim()) return errorResponse('Write something first', 422);
      card.comments.push({
        id: `cm-${uid()}`,
        authorId: 'm-demo',
        text: text.trim(),
        at: new Date().toISOString(),
      });
      persist();
      return HttpResponse.json(boardPayload(card.boardId));
    },
  ),
];
