import { http, HttpResponse, type HttpHandler } from 'msw';

import { env } from '@/core/config/env';

import { uid } from '../db';
import { errorResponse, networkDelay, requireAuth } from '../utils';

/** Mock API for the "app-mail" feature: an in-memory mailbox. */

type Folder = 'inbox' | 'sent' | 'drafts' | 'archive' | 'spam' | 'trash';
type Person = { name: string; email: string };
type Mail = {
  id: string;
  folder: Folder;
  from: Person;
  to: Person[];
  cc: Person[];
  subject: string;
  body: string;
  date: number;
  read: boolean;
  starred: boolean;
  labels: string[];
  attachments: Array<{ name: string; size: number }>;
  threadCount: number;
};

const ME: Person = { name: 'Demo User', email: 'demo@example.com' };
const LABELS = [
  { id: 'work', name: 'Work', tone: 'violet' },
  { id: 'finance', name: 'Finance', tone: 'aqua' },
  { id: 'travel', name: 'Travel', tone: 'orange' },
  { id: 'product', name: 'Product', tone: 'blue' },
  { id: 'personal', name: 'Personal', tone: 'magenta' },
] as const;

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

let mails: Mail[] = [];

function seed() {
  const now = Date.now();
  const p = (name: string, domain = 'northwind.io'): Person => ({
    name,
    email: `${name.split(' ')[0]!.toLowerCase()}@${domain}`,
  });
  const make = (
    ago: number,
    from: Person,
    subject: string,
    body: string,
    extra: Partial<Mail> = {},
  ): Mail => ({
    id: uid(),
    folder: 'inbox',
    from,
    to: [ME],
    cc: [],
    subject,
    body,
    date: now - ago,
    read: true,
    starred: false,
    labels: [],
    attachments: [],
    threadCount: 1,
    ...extra,
  });

  mails = [
    make(
      12 * MIN,
      p('Hannah Morgan', 'acme.dev'),
      'Billing v3 designs ready for review',
      'Hi,\n\nThe billing redesign is ready for a first review. I focused on the plan picker (annual toggle now sits above the cards) and the invoice history table, which is denser and sortable.\n\nCould you leave comments by Thursday? I would like to hand off to engineering on Monday.\n\nThanks,\nHannah',
      {
        read: false,
        starred: true,
        labels: ['work', 'product'],
        attachments: [{ name: 'billing-v3.pdf', size: 2_340_000 }],
        threadCount: 3,
      },
    ),
    make(
      48 * MIN,
      p('Stripe', 'stripe.com'),
      'Your payout of $48,210.44 is on the way',
      'A payout of $48,210.44 USD will arrive in your bank account ending in 4821 on November 27.\n\nPayout ID: po_1QzX8kL2\nPeriod: Nov 18 – Nov 24\n\nYou can see the transactions included in this payout in your dashboard.',
      { read: false, labels: ['finance'] },
    ),
    make(
      2 * HOUR,
      p('Daniel Okafor', 'acme.dev'),
      'Re: Postgres upgrade window',
      'Confirmed for tonight 23:00 UTC. Expected read-only time is about four minutes. I will post in #incidents when we start and finish.\n\nRollback plan is in the runbook, section 4.',
      { read: false, labels: ['work'], threadCount: 5 },
    ),
    make(
      5 * HOUR,
      p('Lufthansa', 'lufthansa.com'),
      'Booking confirmation LH 1172 Lisbon → Munich',
      'Booking reference: K7Q2MR\n\nDeparture: Dec 3, 07:25 from Lisbon (LIS)\nArrival: Dec 3, 11:20 at Munich (MUC)\nSeat: 14C\n\nCheck-in opens 30 hours before departure.',
      { labels: ['travel'], attachments: [{ name: 'e-ticket-K7Q2MR.pdf', size: 184_000 }] },
    ),
    make(
      9 * HOUR,
      p('Priya Raman', 'acme.dev'),
      'November close checklist',
      'Hi team,\n\nThe November close starts on the 3rd. Please send me:\n\n1. Outstanding vendor invoices (AWS, Datadog, Figma)\n2. Any prepaid contracts signed this month\n3. Headcount changes after Nov 15\n\nThe checklist is attached. Thanks!',
      {
        labels: ['finance', 'work'],
        attachments: [{ name: 'close-checklist-nov.xlsx', size: 61_000 }],
      },
    ),
    make(
      1 * DAY + 2 * HOUR,
      p('Lucas Meyer', 'acme.dev'),
      'Northwind wants annual + 40 seats',
      'Good news: Northwind is ready to move to annual billing and add 40 seats. They asked about SSO and a DPA. Can we get on a call with them on Friday?',
      { starred: true, labels: ['work'], threadCount: 2 },
    ),
    make(
      1 * DAY + 6 * HOUR,
      p('GitHub', 'github.com'),
      '[acme/web] Dependabot opened 4 pull requests',
      'Dependabot opened pull requests to update vite, react-router, zod and @tanstack/react-query. All checks passed.',
      {},
    ),
    make(
      2 * DAY,
      p('Figma', 'figma.com'),
      'Hannah Morgan invited you to "Design system 2026"',
      'You have been invited to edit the file "Design system 2026". Open it in Figma to get started.',
      { labels: ['product'] },
    ),
    make(
      2 * DAY + 5 * HOUR,
      p('Sofia Alvarez', 'acme.dev'),
      'Churn deep dive: first findings',
      'Churn is concentrated in accounts with fewer than three active users after 30 days. Activation of the second seat is the strongest predictor of retention we found.\n\nI will share the full deck on Monday.',
      {
        labels: ['work', 'product'],
        attachments: [{ name: 'churn-cohorts.pdf', size: 1_920_000 }],
      },
    ),
    make(
      3 * DAY,
      p('Airbnb', 'airbnb.com'),
      'Reservation reminder: Munich, Dec 3 – 6',
      'Your stay in Maxvorstadt starts in 9 days. Check-in is from 15:00. The host has shared arrival instructions.',
      { labels: ['travel', 'personal'] },
    ),
    make(
      4 * DAY,
      p('Megan Clark', 'acme.dev'),
      'Launch post: final draft',
      'Final draft of the launch post is in the doc. Legal signed off on the pricing section. Publishing is scheduled for Tuesday 9:00 ET.',
      { labels: ['product'] },
    ),
    make(
      5 * DAY,
      p('AWS', 'amazon.com'),
      'Your AWS invoice for October is available',
      'Invoice amount: $12,408.19\nBilling period: Oct 1 – Oct 31\nAccount: 4821-0093-1188',
      { labels: ['finance'], attachments: [{ name: 'aws-invoice-oct.pdf', size: 230_000 }] },
    ),
    make(
      6 * DAY,
      p('Tom Becker', 'acme.dev'),
      'On-call handover',
      'Quiet week. One incident (exports, 7 min). Runbooks updated. PagerDuty schedule for December is published.',
      {},
    ),
    make(
      8 * DAY,
      p('Linear', 'linear.app'),
      'Weekly digest: 34 issues closed',
      'Your team closed 34 issues and opened 21 this week. Cycle 48 ends on Friday.',
      {},
    ),

    make(
      30 * MIN,
      ME,
      'Re: Billing v3 designs ready for review',
      'Thanks Hannah, left comments on pages 3 and 5. The annual toggle placement works much better.',
      { folder: 'sent', to: [p('Hannah Morgan', 'acme.dev')] },
    ),
    make(
      1 * DAY,
      ME,
      'Q1 planning offsite',
      'Proposed dates: Jan 14–15 in Lisbon. Agenda draft attached. Please confirm by Friday.',
      {
        folder: 'sent',
        to: [p('Leadership', 'acme.dev')],
        attachments: [{ name: 'offsite-agenda.pdf', size: 98_000 }],
      },
    ),
    make(3 * HOUR, ME, 'Draft: pricing page copy', 'Starter: for founders tracking the basics…', {
      folder: 'drafts',
      to: [p('Megan Clark', 'acme.dev')],
    }),
    make(
      12 * DAY,
      p('Conference Desk', 'saasconf.com'),
      'Your SaaSConf badge',
      'Your badge is attached. See you in Berlin!',
      { folder: 'archive', labels: ['travel'] },
    ),
    make(
      2 * DAY,
      p('Prize Center', 'promo-winners.biz'),
      'You have been selected!!!',
      'Claim your reward now.',
      { folder: 'spam' },
    ),
    make(
      9 * DAY,
      p('Old Vendor', 'legacy-crm.com'),
      'Your trial has ended',
      'Your trial has ended. Upgrade to keep your data.',
      { folder: 'trash' },
    ),
  ];
}
seed();

const preview = (m: Mail) => ({
  id: m.id,
  folder: m.folder,
  from: m.from,
  to: m.to,
  subject: m.subject,
  snippet: m.body.replace(/\s+/g, ' ').slice(0, 140),
  date: m.date,
  read: m.read,
  starred: m.starred,
  labels: m.labels,
  hasAttachments: m.attachments.length > 0,
  threadCount: m.threadCount,
});

export const appMailHandlers: HttpHandler[] = [
  http.get(`${env.API_URL}/mail/summary`, async ({ request }) => {
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const folders = (['inbox', 'sent', 'drafts', 'archive', 'spam', 'trash'] as const).map(
      (id) => ({
        id,
        total: mails.filter((m) => m.folder === id).length,
        unread: mails.filter((m) => m.folder === id && !m.read).length,
      }),
    );
    return HttpResponse.json({
      folders,
      starred: mails.filter((m) => m.starred && m.folder !== 'trash').length,
      labels: LABELS.map((l) => ({
        ...l,
        count: mails.filter((m) => m.labels.includes(l.id) && m.folder !== 'trash').length,
      })),
    });
  }),

  http.get(`${env.API_URL}/mail/messages`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const url = new URL(request.url);
    const folder = url.searchParams.get('folder') ?? 'inbox';
    const label = url.searchParams.get('label');
    const q = url.searchParams.get('q')?.toLowerCase().trim();
    const list = mails
      .filter((m) =>
        label
          ? m.labels.includes(label) && m.folder !== 'trash'
          : folder === 'starred'
            ? m.starred && m.folder !== 'trash'
            : m.folder === folder,
      )
      .filter(
        (m) =>
          !q ||
          m.subject.toLowerCase().includes(q) ||
          m.from.name.toLowerCase().includes(q) ||
          m.body.toLowerCase().includes(q),
      )
      .sort((a, b) => b.date - a.date)
      .map(preview);
    return HttpResponse.json(list);
  }),

  http.get(`${env.API_URL}/mail/messages/:id`, async ({ request, params }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const mail = mails.find((m) => m.id === params.id);
    if (!mail) return errorResponse('Message not found', 404);
    mail.read = true;
    return HttpResponse.json({
      ...preview(mail),
      cc: mail.cc,
      body: mail.body,
      attachments: mail.attachments,
    });
  }),

  http.patch<
    never,
    { ids: string[]; read?: boolean; starred?: boolean; folder?: Folder; labels?: string[] }
  >(`${env.API_URL}/mail/messages`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const { ids, ...changes } = await request.json();
    for (const mail of mails.filter((m) => ids.includes(m.id))) {
      if (changes.read !== undefined) mail.read = changes.read;
      if (changes.starred !== undefined) mail.starred = changes.starred;
      if (changes.labels) mail.labels = changes.labels;
      if (changes.folder) {
        // Deleting from the trash removes for good.
        if (changes.folder === 'trash' && mail.folder === 'trash')
          mails = mails.filter((m) => m !== mail);
        else mail.folder = changes.folder;
      }
    }
    return HttpResponse.json({ updated: ids.length });
  }),

  http.post<
    never,
    {
      to: string[];
      cc: string[];
      subject: string;
      body: string;
      attachments: Array<{ name: string; size: number }>;
      draft?: boolean;
    }
  >(`${env.API_URL}/mail/messages`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const input = await request.json();
    if (!input.draft && !input.to.length) return errorResponse('Add at least one recipient', 422);
    const toPerson = (email: string): Person => ({ name: email.split('@')[0]!, email });
    const mail: Mail = {
      id: uid(),
      folder: input.draft ? 'drafts' : 'sent',
      from: ME,
      to: input.to.map(toPerson),
      cc: input.cc.map(toPerson),
      subject: input.subject || '(no subject)',
      body: input.body,
      date: Date.now(),
      read: true,
      starred: false,
      labels: [],
      attachments: input.attachments,
      threadCount: 1,
    };
    mails.push(mail);
    return HttpResponse.json(preview(mail));
  }),
];
