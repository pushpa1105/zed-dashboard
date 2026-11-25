import { http, HttpResponse, type HttpHandler } from 'msw';

import { errorResponse } from '../utils';

import { guard, HOUR, MIN, S, seeded } from './saas-admin';

type Priority = 'low' | 'normal' | 'high' | 'urgent';
type Status = 'open' | 'pending' | 'resolved';

const SLA_HOURS: Record<Priority, number> = { urgent: 1, high: 4, normal: 8, low: 24 };
const AGENTS = ['Amara Diallo', 'Victor Sam', 'James Anderson', 'Demo User'];
const CUSTOMERS = [
  ['Maya Chen', 'Acme Robotics'],
  ['Luis Ortega', 'Globex'],
  ['Priya Nair', 'Hooli'],
  ['Tom Becker', 'Initech'],
  ['Sara Lind', 'Pied Piper'],
  ['Kofi Mensah', 'Stark Logistics'],
  ['Elena Rossi', 'Wonka Foods'],
  ['Noah Kim', 'Massive Dynamic'],
];
const THREADS = [
  [
    'Webhooks stopped arriving after key rotation',
    'Since we rotated our signing secret this morning no webhook reaches our endpoint.',
  ],
  [
    '429 errors below our plan limit',
    'We get rate limited at around 300 rpm even though the Scale plan allows 1,000.',
  ],
  [
    'Invoice shows seats we removed',
    'Our last invoice still bills 42 seats; we removed 10 members two weeks ago.',
  ],
  [
    'SSO login loops back to the sign-in page',
    'Users signing in with Okta are redirected back to the login screen.',
  ],
  [
    'How do I scope a key to one project?',
    'We want a key that can only read logs of the staging project.',
  ],
  [
    'Latency spike in fra1',
    'P95 latency for /v1/search jumped from 120 ms to 900 ms in Frankfurt.',
  ],
  [
    'Request to export all audit events',
    'Our compliance team needs the full audit log for last year as CSV.',
  ],
  ['Cannot downgrade to Teams', 'The downgrade button is disabled on the billing page.'],
  [
    'Duplicate events in our Segment destination',
    'Every usage event arrives twice since yesterday.',
  ],
  ['Need a DPA signed', 'Legal asks for a signed data processing agreement before renewal.'],
];
const REPLIES = [
  'Thanks for the report. I am looking into it now and will update you shortly.',
  'Could you send us a request id from one of the failing calls?',
  'Here it is: req_8f2k1x. It happened again five minutes ago.',
  'Found it: a cached configuration was still in place. It is cleared now, can you retry?',
];

function build() {
  const rand = seeded('saas:support');
  const pick = <T>(list: readonly T[]) => list[Math.floor(rand() * list.length)]!;
  const now = Date.now();

  const tickets = Array.from({ length: 36 }, (_, i) => {
    const [subject, body] = THREADS[i % THREADS.length]!;
    const [name, company] = pick(CUSTOMERS);
    const priority = pick<Priority>(['low', 'normal', 'normal', 'high', 'high', 'urgent']);
    const status = pick<Status>(['open', 'open', 'open', 'pending', 'resolved']);
    const createdAt = now - Math.round(10 + rand() * 60 * 24 * 4) * MIN;
    const assignee = status === 'open' && rand() < 0.35 ? null : pick(AGENTS);
    const replies = Math.floor(rand() * REPLIES.length);
    return {
      id: `T-${(4120 + i * 7).toString()}`,
      subject: subject!,
      customer: {
        name: name!,
        email: `${name!.split(' ')[0]!.toLowerCase()}@${company!.toLowerCase().replace(/\W+/g, '')}.com`,
        company: company!,
      },
      priority,
      status,
      channel: pick(['email', 'chat', 'api'] as const),
      assignee,
      createdAt,
      slaDueAt: createdAt + SLA_HOURS[priority] * HOUR,
      messages: [body!, ...REPLIES.slice(0, replies)].map((text, m) => ({
        id: `T-${i}-m${m}`,
        author: m % 2 ? (assignee ?? AGENTS[0]!) : name!,
        fromCustomer: m % 2 === 0,
        body: text,
        at: createdAt + m * 37 * MIN,
      })),
    };
  });

  return { agents: AGENTS, tickets: tickets.sort((a, b) => b.createdAt - a.createdAt) };
}

let state: ReturnType<typeof build> | null = null;
const inbox = () => (state ??= build());
const findTicket = (id: string) => inbox().tickets.find((t) => t.id === id);

export const saasSupportHandlers: HttpHandler[] = [
  http.get(`${S}/support`, async ({ request }) => {
    const denied = await guard(request);
    return denied ?? HttpResponse.json(inbox());
  }),
  http.post<{ id: string }, { body: string }>(
    `${S}/support/tickets/:id/replies`,
    async ({ request, params }) => {
      const denied = await guard(request);
      if (denied) return denied;
      const ticket = findTicket(params.id);
      if (!ticket) return errorResponse('Ticket not found', 404);
      const author = ticket.assignee ?? 'Demo User';
      ticket.messages.push({
        id: `${ticket.id}-m${ticket.messages.length}`,
        author,
        fromCustomer: false,
        body: (await request.json()).body,
        at: Date.now(),
      });
      Object.assign(ticket, { assignee: author, status: 'pending' });
      return HttpResponse.json(ticket);
    },
  ),
  http.patch<{ id: string }, { status?: Status; assignee?: string | null }>(
    `${S}/support/tickets/:id`,
    async ({ request, params }) => {
      const denied = await guard(request);
      if (denied) return denied;
      const ticket = findTicket(params.id);
      if (!ticket) return errorResponse('Ticket not found', 404);
      Object.assign(ticket, await request.json());
      return HttpResponse.json(ticket);
    },
  ),
];
