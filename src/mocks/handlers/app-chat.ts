import { http, HttpResponse, type HttpHandler } from 'msw';

import { env } from '@/core/config/env';

import { uid } from '../db';
import { errorResponse, networkDelay, requireAuth } from '../utils';

/** Mock API for the "app-chat" feature: in-memory conversations with simulated replies. */

type Attachment = { name: string; size: number; kind: 'image' | 'pdf' | 'doc' | 'sheet' | 'zip' };
type Reaction = { label: string; count: number; mine: boolean };
type Message = {
  id: string;
  conversationId: string;
  authorId: string;
  body: string;
  createdAt: number;
  replyToId: string | null;
  reactions: Reaction[];
  attachments: Attachment[];
};
type Member = { id: string; name: string; role: string; online: boolean };
type Conversation = {
  id: string;
  name: string;
  kind: 'direct' | 'group';
  topic: string;
  memberIds: string[];
  pinned: boolean;
  muted: boolean;
  unread: number;
  /** The other side "is typing" until this timestamp. */
  typingUntil: number;
  typingId: string | null;
  /** Last message of mine the others have read. */
  readUpTo: number;
};

const ME = 'me';
const MIN = 60_000;
const HOUR = 60 * MIN;

const members: Member[] = [
  { id: ME, name: 'You', role: 'Product lead', online: true },
  { id: 'hm', name: 'Hannah Morgan', role: 'Design lead', online: true },
  { id: 'dk', name: 'Daniel Okafor', role: 'Backend engineer', online: false },
  { id: 'pr', name: 'Priya Raman', role: 'Finance manager', online: true },
  { id: 'mc', name: 'Megan Clark', role: 'Marketing', online: false },
  { id: 'lm', name: 'Lucas Meyer', role: 'Customer success', online: true },
  { id: 'sa', name: 'Sofia Alvarez', role: 'Data analyst', online: false },
  { id: 'tb', name: 'Tom Becker', role: 'Infrastructure', online: true },
  { id: 'ak', name: 'Aiko Tanaka', role: 'Frontend engineer', online: true },
];

let conversations: Conversation[] = [];
let messages: Message[] = [];

/** Scripted replies, picked per conversation in order. */
const REPLIES: Record<string, string[]> = {
  c1: [
    'Makes sense. I will update the frame and share a link in a bit.',
    'Pushed the new version, check the "Billing v3" page.',
  ],
  c2: ['Got it, adding it to the sprint board.', 'Deploy is green on staging now.'],
  c3: ['Thanks! I will reconcile it against the bank feed tomorrow morning.'],
  c4: ['Sounds good to me.', 'Can we do Thursday instead?'],
  c5: ['On it, I will reply to the customer within the hour.'],
  c6: ['Query is running, I will post the numbers here.'],
  c7: ['Rolled back. Error rate is back under 0.2%.'],
};
const replyCursor: Record<string, number> = {};

function seed() {
  const now = Date.now();
  conversations = [
    {
      id: 'c1',
      name: 'Hannah Morgan',
      kind: 'direct',
      topic: 'Billing redesign',
      memberIds: [ME, 'hm'],
      pinned: true,
      muted: false,
      unread: 2,
      typingUntil: 0,
      typingId: null,
      readUpTo: now - 50 * MIN,
    },
    {
      id: 'c2',
      name: 'Platform team',
      kind: 'group',
      topic: 'Releases, incidents and infra',
      memberIds: [ME, 'dk', 'tb', 'ak'],
      pinned: true,
      muted: false,
      unread: 5,
      typingUntil: 0,
      typingId: null,
      readUpTo: now - 3 * HOUR,
    },
    {
      id: 'c3',
      name: 'Priya Raman',
      kind: 'direct',
      topic: 'Month-end close',
      memberIds: [ME, 'pr'],
      pinned: false,
      muted: false,
      unread: 0,
      typingUntil: 0,
      typingId: null,
      readUpTo: now,
    },
    {
      id: 'c4',
      name: 'Q1 launch',
      kind: 'group',
      topic: 'Launch checklist and owners',
      memberIds: [ME, 'hm', 'mc', 'lm'],
      pinned: false,
      muted: true,
      unread: 12,
      typingUntil: 0,
      typingId: null,
      readUpTo: now - 26 * HOUR,
    },
    {
      id: 'c5',
      name: 'Lucas Meyer',
      kind: 'direct',
      topic: 'Northwind renewal',
      memberIds: [ME, 'lm'],
      pinned: false,
      muted: false,
      unread: 1,
      typingUntil: 0,
      typingId: null,
      readUpTo: now - 2 * HOUR,
    },
    {
      id: 'c6',
      name: 'Sofia Alvarez',
      kind: 'direct',
      topic: 'Churn analysis',
      memberIds: [ME, 'sa'],
      pinned: false,
      muted: false,
      unread: 0,
      typingUntil: 0,
      typingId: null,
      readUpTo: now,
    },
    {
      id: 'c7',
      name: 'Incidents',
      kind: 'group',
      topic: 'On-call and postmortems',
      memberIds: [ME, 'tb', 'dk'],
      pinned: false,
      muted: false,
      unread: 0,
      typingUntil: 0,
      typingId: null,
      readUpTo: now,
    },
  ];

  const m = (
    conversationId: string,
    authorId: string,
    minutesAgo: number,
    body: string,
    extra: Partial<Message> = {},
  ): Message => ({
    id: uid(),
    conversationId,
    authorId,
    body,
    createdAt: now - minutesAgo * MIN,
    replyToId: null,
    reactions: [],
    attachments: [],
    ...extra,
  });

  const c1Ask = m(
    'c1',
    ME,
    26 * 60 + 40,
    'Can you take another pass at the plan picker? Sales says people miss the annual toggle.',
  );
  messages = [
    c1Ask,
    m(
      'c1',
      'hm',
      26 * 60 + 12,
      'Yes. I think the toggle should sit above the cards, not inside the first one.',
      { replyToId: c1Ask.id },
    ),
    m('c1', 'hm', 26 * 60 + 10, 'Exported the current flow so we can compare.', {
      attachments: [{ name: 'plan-picker-v2.fig', size: 4_812_000, kind: 'doc' }],
    }),
    m('c1', ME, 25 * 60, 'Perfect, let us review it in the design crit.', {
      reactions: [{ label: '+1', count: 1, mine: false }],
    }),
    m('c1', 'hm', 62, 'New version is up. I also tightened the spacing in the invoice table.'),
    m('c1', 'hm', 61, 'Screens attached.', {
      attachments: [
        { name: 'billing-v3-desktop.png', size: 1_240_000, kind: 'image' },
        { name: 'billing-v3-mobile.png', size: 806_000, kind: 'image' },
      ],
    }),

    m(
      'c2',
      'tb',
      5 * 60,
      'Heads up: Postgres minor upgrade tonight at 23:00 UTC, about 4 minutes read-only.',
    ),
    m('c2', 'dk', 4 * 60 + 30, 'Migrations for the usage-based billing branch are merged.', {
      reactions: [{ label: 'nice', count: 2, mine: true }],
    }),
    m(
      'c2',
      ME,
      4 * 60,
      'Thanks. Are we still on track to enable it for the pilot accounts on Monday?',
    ),
    m('c2', 'dk', 3 * 60 + 50, 'Yes, behind the flag. Need one more review on the invoice job.'),
    m('c2', 'ak', 2 * 60, 'I can review it after lunch.'),
    m('c2', 'tb', 95, 'Staging is on the new build.', {
      attachments: [{ name: 'release-notes-2026.11.pdf', size: 312_000, kind: 'pdf' }],
    }),
    m('c2', 'dk', 40, 'Load test results look good: p95 182 ms at 3x traffic.'),
    m('c2', 'ak', 12, 'Approved the PR, two small comments.'),

    m(
      'c3',
      'pr',
      3 * 24 * 60,
      'November close is scheduled for the 3rd. I need the AWS invoices by then.',
    ),
    m('c3', ME, 3 * 24 * 60 - 20, 'Forwarded both of them to finance@.'),
    m('c3', 'pr', 2 * 24 * 60, 'Received, thank you.', {
      reactions: [{ label: 'thanks', count: 1, mine: false }],
    }),
    m('c3', 'pr', 50, 'Accruals sheet for review.', {
      attachments: [{ name: 'accruals-nov.xlsx', size: 92_000, kind: 'sheet' }],
    }),
    m('c3', ME, 30, 'Looks right. One question on the Datadog line, it is higher than October.'),

    m('c4', 'mc', 2 * 24 * 60, 'Launch post draft is in the doc, comments welcome.'),
    m('c4', 'lm', 27 * 60, 'Customers on the beta list get the email first, right?'),
    m('c4', 'hm', 26 * 60 + 30, 'Yes, 48 hours early access.'),

    m('c5', 'lm', 3 * 60, 'Northwind wants to move to annual billing and add 40 seats.'),
    m('c5', ME, 2 * 60 + 40, 'Great news. Offer them the standard 15% annual discount.'),
    m('c5', 'lm', 2 * 60 + 10, 'Will do. They also asked about SSO.'),

    m('c6', 'sa', 6 * 60, 'Churn is concentrated in accounts with fewer than 3 active users.'),
    m('c6', 'sa', 6 * 60 - 2, 'Full breakdown here.', {
      attachments: [{ name: 'churn-cohorts-q4.pdf', size: 1_920_000, kind: 'pdf' }],
    }),
    m('c6', ME, 5 * 60, 'Super useful. Can you split it by acquisition channel?'),

    m(
      'c7',
      'tb',
      9 * 60,
      'Error spike on /api/exports between 08:12 and 08:19, caused by a bad config push.',
    ),
    m('c7', 'dk', 8 * 60 + 50, 'Postmortem doc started.', {
      attachments: [{ name: 'postmortem-exports.zip', size: 2_400_000, kind: 'zip' }],
    }),
  ];
}
seed();

const memberById = (id: string) => members.find((m) => m.id === id)!;

function summarize(c: Conversation) {
  const own = messages
    .filter((m) => m.conversationId === c.id)
    .sort((a, b) => a.createdAt - b.createdAt);
  const last = own.at(-1);
  const others = c.memberIds.filter((id) => id !== ME).map(memberById);
  return {
    id: c.id,
    name: c.name,
    kind: c.kind,
    topic: c.topic,
    pinned: c.pinned,
    muted: c.muted,
    unread: c.unread,
    online: others.some((m) => m.online),
    typing: c.typingUntil > Date.now() ? memberById(c.typingId ?? others[0]!.id).name : null,
    members: c.memberIds.map(memberById),
    lastMessage: last
      ? {
          body: last.body || (last.attachments[0] ? last.attachments[0].name : ''),
          authorName: last.authorId === ME ? 'You' : memberById(last.authorId).name,
          createdAt: last.createdAt,
        }
      : null,
  };
}

function scheduleReply(c: Conversation) {
  const lines = REPLIES[c.id] ?? ['Okay!'];
  const i = replyCursor[c.id] ?? 0;
  replyCursor[c.id] = i + 1;
  const responder = c.memberIds.filter((id) => id !== ME)[i % (c.memberIds.length - 1)]!;
  const startTyping = 900;
  const answerAt = 900 + 2200 + Math.random() * 1200;

  setTimeout(() => {
    c.typingUntil = Date.now() + (answerAt - startTyping) + 200;
    c.typingId = responder;
  }, startTyping);
  setTimeout(() => {
    c.readUpTo = Date.now();
    messages.push({
      id: uid(),
      conversationId: c.id,
      authorId: responder,
      body: lines[i % lines.length]!,
      createdAt: Date.now(),
      replyToId: null,
      reactions: [],
      attachments: [],
    });
    c.typingUntil = 0;
    c.typingId = null;
  }, answerAt);
}

const findConversation = (id: string | readonly string[] | undefined) =>
  conversations.find((c) => c.id === id);

export const appChatHandlers: HttpHandler[] = [
  http.get(`${env.API_URL}/chat/conversations`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const list = conversations
      .map(summarize)
      .sort(
        (a, b) =>
          Number(b.pinned) - Number(a.pinned) ||
          (b.lastMessage?.createdAt ?? 0) - (a.lastMessage?.createdAt ?? 0),
      );
    return HttpResponse.json(list);
  }),

  http.get(`${env.API_URL}/chat/conversations/:id`, async ({ request, params }) => {
    // Polled while a thread is open: no artificial latency.
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const c = findConversation(params.id);
    if (!c) return errorResponse('Conversation not found', 404);
    c.unread = 0;
    const thread = messages
      .filter((m) => m.conversationId === c.id)
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((m) => ({ ...m, read: m.authorId !== ME || m.createdAt <= c.readUpTo }));
    return HttpResponse.json({ conversation: summarize(c), messages: thread });
  }),

  http.post<
    { id: string },
    { body: string; replyToId?: string | null; attachments?: Attachment[] }
  >(`${env.API_URL}/chat/conversations/:id/messages`, async ({ request, params }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const c = findConversation(params.id);
    if (!c) return errorResponse('Conversation not found', 404);
    const input = await request.json();
    const body = input.body?.trim() ?? '';
    if (!body && !input.attachments?.length) return errorResponse('Message is empty', 422);
    const message: Message = {
      id: uid(),
      conversationId: c.id,
      authorId: ME,
      body,
      createdAt: Date.now(),
      replyToId: input.replyToId ?? null,
      reactions: [],
      attachments: input.attachments ?? [],
    };
    messages.push(message);
    if (!c.muted || c.kind === 'direct') scheduleReply(c);
    return HttpResponse.json({ ...message, read: false });
  }),

  http.patch<{ id: string }, { pinned?: boolean; muted?: boolean }>(
    `${env.API_URL}/chat/conversations/:id`,
    async ({ request, params }) => {
      await networkDelay();
      const auth = requireAuth(request);
      if ('error' in auth) return auth.error;
      const c = findConversation(params.id);
      if (!c) return errorResponse('Conversation not found', 404);
      const input = await request.json();
      if (input.pinned !== undefined) c.pinned = input.pinned;
      if (input.muted !== undefined) c.muted = input.muted;
      return HttpResponse.json(summarize(c));
    },
  ),

  http.post<{ id: string }, { label: string }>(
    `${env.API_URL}/chat/messages/:id/reactions`,
    async ({ request, params }) => {
      const auth = requireAuth(request);
      if ('error' in auth) return auth.error;
      const message = messages.find((m) => m.id === params.id);
      if (!message) return errorResponse('Message not found', 404);
      const { label } = await request.json();
      const existing = message.reactions.find((r) => r.label === label);
      if (existing) {
        existing.count += existing.mine ? -1 : 1;
        existing.mine = !existing.mine;
        message.reactions = message.reactions.filter((r) => r.count > 0);
      } else {
        message.reactions.push({ label, count: 1, mine: true });
      }
      return HttpResponse.json({ ok: true });
    },
  ),
];

/** Test helper: restore the seeded conversations. */
export const resetChat = seed;
