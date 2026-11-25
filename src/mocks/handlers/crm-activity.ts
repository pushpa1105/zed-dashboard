import { http, HttpResponse, type HttpHandler } from 'msw';

import { errorResponse } from '../utils';

import type { Deal, Person } from './crm';
import { authorize, crmUrl as url, DAY, fullName, iso, OWNERS, seededHelpers } from './crm-seed';

type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'stage';
type Stage = Deal['stage'];
type FeedItem = {
  id: string;
  type: ActivityType;
  title: string;
  detail: string | null;
  owner: string;
  at: string;
  dealId: string;
  dealName: string;
  company: string;
  stage: { from: Stage; to: Stage } | null;
};
type LogActivityInput = Pick<FeedItem, 'type' | 'title' | 'dealId'> & { detail?: string };

const { rand, pick } = seededHelpers(8128);

/** Title templates; `{contact}` and `{company}` are filled per item. */
const TEMPLATES: Record<Exclude<ActivityType, 'stage'>, { titles: string[]; details: string[] }> = {
  call: {
    titles: [
      'Discovery call with {contact}',
      'Pricing call with {contact}',
      'Check-in with {contact}',
    ],
    details: ['Positive · 25 min', 'Needs follow-up · 15 min', 'No answer', 'Positive · 40 min'],
  },
  email: {
    titles: [
      'Sent proposal to {contact}',
      'Shared a case study with {contact}',
      'Replied to {contact} about the security review',
    ],
    details: ['Opened 3 times', 'Replied within an hour', 'Not opened yet'],
  },
  meeting: {
    titles: [
      'Product demo for {company}',
      'Onsite workshop at {company}',
      'Executive sponsor meeting',
    ],
    details: ['4 attendees · 60 min', '2 attendees · 45 min', '6 attendees · 90 min'],
  },
  note: {
    titles: ['Note on {company}'],
    details: [
      'Budget approved for Q1; legal review starts next week.',
      'Champion is moving teams. Need a new sponsor before renewal.',
      'They compared us with two competitors; price is not the blocker.',
      'Security questionnaire returned with two open items.',
    ],
  },
};
const TYPES = ['call', 'call', 'email', 'email', 'email', 'meeting', 'note', 'stage'] as const;
const FLOW: Stage[] = ['lead', 'qualified', 'proposal', 'negotiation', 'won'];

function stageChange(deal: Deal) {
  const to = deal.stage === 'lost' ? 'lost' : pick(FLOW.slice(1));
  const from = to === 'lost' ? pick(FLOW.slice(1, 4)) : FLOW[FLOW.indexOf(to) - 1]!;
  return { from, to };
}

export function createActivityHandlers({ deals, people }: { deals: Deal[]; people: Person[] }) {
  const contactOf = (deal: Deal) => people.find((p) => p.id === deal.contactId)?.name ?? '';
  const base = (deal: Deal, type: ActivityType, index: number, at: number) => ({
    id: `act-${index + 1}`,
    type,
    owner: deal.owner,
    at: iso(at),
    dealId: deal.id,
    dealName: deal.name,
    company: deal.company,
    stage: null,
  });

  const feed: FeedItem[] = Array.from({ length: 160 }, (_, i) => {
    const deal = pick(deals);
    const type = pick(TYPES);
    const at = Date.now() - Math.floor(rand() * 45 * DAY);
    if (type === 'stage') {
      return {
        ...base(deal, type, i, at),
        title: deal.name,
        detail: null,
        stage: stageChange(deal),
      };
    }
    const template = TEMPLATES[type];
    return {
      ...base(deal, type, i, at),
      owner: rand() > 0.7 ? pick(OWNERS) : deal.owner,
      title: pick(template.titles)
        .replace('{contact}', contactOf(deal))
        .replace('{company}', deal.company),
      detail: rand() > 0.15 ? pick(template.details) : null,
    };
  }).sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

  return [
    http.get(url('/activity'), async ({ request }) => {
      const auth = await authorize(request);
      if ('error' in auth) return auth.error;
      return HttpResponse.json(feed);
    }),

    http.post<never, LogActivityInput>(url('/activity'), async ({ request }) => {
      const auth = await authorize(request);
      if ('error' in auth) return auth.error;
      const { type, title, detail, dealId } = await request.json();
      const deal = deals.find((d) => d.id === dealId);
      if (!deal) return errorResponse('Deal not found', 404);
      const item: FeedItem = {
        ...base(deal, type, feed.length, Date.now()),
        owner: fullName(auth.user),
        title,
        detail: detail || null,
      };
      feed.unshift(item);
      return HttpResponse.json(item);
    }),
  ] satisfies HttpHandler[];
}
