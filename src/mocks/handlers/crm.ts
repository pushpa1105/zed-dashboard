import { http, HttpResponse, type HttpHandler } from 'msw';

import { errorResponse, networkDelay, requireAuth } from '../utils';

import { createActivityHandlers } from './crm-activity';
import { createQuoteHandlers } from './crm-quotes';
import { crmUrl as url, DAY, iso, OWNERS, rng, today } from './crm-seed';

/**
 * Mock API for the CRM workspace. Data is seeded deterministically and kept
 * in memory, so moves, new deals, notes and completed tasks show up until reload.
 */

const rand = rng(4207);
const pick = <T>(list: readonly T[]) => list[Math.floor(rand() * list.length)]!;
const between = (min: number, max: number) => Math.round(min + rand() * (max - min));

const STAGES = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const;
type Stage = (typeof STAGES)[number];
const PROBABILITY: Record<Stage, number> = {
  lead: 10,
  qualified: 25,
  proposal: 50,
  negotiation: 75,
  won: 100,
  lost: 0,
};
const SOURCES = ['Inbound', 'Outbound', 'Referral', 'Partner', 'Event'] as const;
const INDUSTRIES = ['Logistics', 'Healthcare', 'Fintech', 'Retail', 'Manufacturing', 'Education'];
const CITIES = ['Berlin', 'Austin', 'Toronto', 'Lisbon', 'Singapore', 'Denver', 'Amsterdam'];

const COMPANY_NAMES = [
  'Northwind Freight',
  'Brightline Clinics',
  'Parcelpoint',
  'Kestrel & Co',
  'Copperleaf Retail',
  'Lumen Health',
  'Fieldwork Labs',
  'Haldane Systems',
  'Mosaic Payments',
  'Tidewater Foods',
  'Basalt Robotics',
  'Fernway Schools',
  'Oakridge Data',
  'Quarry Logistics',
  'Northpass Bank',
  'Halyard Marine',
  'Sundial Energy',
  'Ironbark Tools',
];
const FIRST = [
  'Hannah',
  'Megan',
  'Ivan',
  'Olivia',
  'Mia',
  'Raj',
  'Elena',
  'Tom',
  'Aiko',
  'Jonas',
  'Leah',
  'Marcus',
  'Nadia',
  'Omar',
  'Clara',
  'Felix',
  'Grace',
  'Henrik',
  'Isla',
  'Kofi',
];
const LAST = [
  'Morgan',
  'Clark',
  'Serhin',
  'Park',
  'Chen',
  'Patel',
  'Rossi',
  'Becker',
  'Tanaka',
  'Weber',
  'Kim',
  'Reed',
  'Haddad',
  'Novak',
  'Dubois',
  'Larsen',
  'Silva',
  'Lund',
  'Brennan',
  'Mensah',
];
const TITLES = [
  'VP Operations',
  'Head of Procurement',
  'CTO',
  'Finance Director',
  'Operations Manager',
  'Chief of Staff',
  'IT Lead',
  'COO',
];
const TAG_POOL = [
  'Decision maker',
  'Champion',
  'Technical',
  'Budget holder',
  'Renewal',
  'Expansion',
];
const PRODUCTS = [
  { name: 'Platform license', price: 18_000 },
  { name: 'Analytics add-on', price: 6_400 },
  { name: 'Premium support', price: 4_800 },
  { name: 'Onboarding package', price: 3_200 },
  { name: 'Extra seats (25)', price: 2_500 },
];

type Company = {
  id: string;
  name: string;
  industry: string;
  employees: number;
  revenue: number;
  city: string;
  owner: string;
  tags: string[];
  website: string;
};
export type Person = {
  id: string;
  name: string;
  title: string;
  companyId: string;
  company: string;
  email: string;
  phone: string;
  owner: string;
  tags: string[];
  status: 'customer' | 'prospect' | 'churned';
  lastContactedAt: string;
};
export type Deal = {
  id: string;
  name: string;
  companyId: string;
  company: string;
  contactId: string;
  value: number;
  stage: Stage;
  probability: number;
  owner: string;
  source: (typeof SOURCES)[number];
  closeDate: string;
  createdAt: string;
};
type Note = { id: string; author: string; body: string; at: string };
type Task = {
  id: string;
  title: string;
  dealId: string | null;
  related: string;
  owner: string;
  dueAt: string;
  priority: 'high' | 'medium' | 'low';
  done: boolean;
};
type Meeting = {
  id: string;
  kind: 'call' | 'meeting' | 'demo';
  title: string;
  with: string;
  company: string;
  startsAt: string;
  durationMin: number;
  owner: string;
  outcome: string | null;
};

const now = today();

const companies: Company[] = COMPANY_NAMES.map((name, i) => ({
  id: `co-${i + 1}`,
  name,
  industry: pick(INDUSTRIES),
  employees: between(40, 4200),
  revenue: between(2, 380) * 1_000_000,
  city: pick(CITIES),
  owner: pick(OWNERS),
  tags: [pick(['Enterprise', 'Mid-market', 'SMB']), ...(rand() > 0.6 ? ['Strategic'] : [])],
  website: `${name.toLowerCase().replace(/[^a-z]+/g, '')}.com`,
}));

const people: Person[] = Array.from({ length: 54 }, (_, i) => {
  const first = FIRST[i % FIRST.length]!;
  const last = LAST[(i * 7) % LAST.length]!;
  const company = companies[i % companies.length]!;
  return {
    id: `p-${i + 1}`,
    name: `${first} ${last}`,
    title: pick(TITLES),
    companyId: company.id,
    company: company.name,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@${company.website}`,
    phone: `+1 (${between(200, 989)}) ${between(200, 989)}-${between(1000, 9999)}`,
    owner: company.owner,
    tags: Array.from(new Set([pick(TAG_POOL), ...(rand() > 0.5 ? [pick(TAG_POOL)] : [])])),
    status: rand() > 0.82 ? 'churned' : rand() > 0.45 ? 'customer' : 'prospect',
    lastContactedAt: iso(now - between(0, 40) * DAY - between(1, 10) * 3_600_000),
  };
});

const DEAL_KINDS = [
  'Platform rollout',
  'Renewal',
  'Expansion',
  'Pilot',
  'Analytics upgrade',
  'Multi-site license',
];
const deals: Deal[] = Array.from({ length: 64 }, (_, i) => {
  const company = companies[i % companies.length]!;
  const contact = people.find((p) => p.companyId === company.id) ?? people[0]!;
  const stage: Stage =
    i < 10
      ? 'lead'
      : i < 22
        ? 'qualified'
        : i < 33
          ? 'proposal'
          : i < 42
            ? 'negotiation'
            : i < 56
              ? 'won'
              : 'lost';
  const closed = stage === 'won' || stage === 'lost';
  return {
    id: `d-${1001 + i}`,
    name: `${company.name.split(' ')[0]} · ${pick(DEAL_KINDS)}`,
    companyId: company.id,
    company: company.name,
    contactId: contact.id,
    value: between(6, 140) * 1_000,
    stage,
    probability: PROBABILITY[stage],
    owner: pick(OWNERS),
    source: pick(SOURCES),
    closeDate: iso(closed ? now - between(2, 120) * DAY : now + between(-3, 75) * DAY),
    createdAt: iso(now - between(15, 200) * DAY),
  };
});

const notes = new Map<string, Note[]>();
const noteFor = (dealId: string): Note[] => {
  if (!notes.has(dealId)) {
    notes.set(dealId, [
      {
        id: `${dealId}-n1`,
        author: 'Maya Chen',
        body: 'Security review passed. They want SSO and an EU data region before signing.',
        at: iso(now - 2 * DAY + 15 * 3_600_000),
      },
      {
        id: `${dealId}-n2`,
        author: 'Daniel Okafor',
        body: 'Procurement asked for a 3-year price lock; finance is fine with 2 years.',
        at: iso(now - 6 * DAY + 10.5 * 3_600_000),
      },
    ]);
  }
  return notes.get(dealId)!;
};

const TASK_TITLES = [
  'Send revised proposal',
  'Follow up on security questionnaire',
  'Book technical deep dive',
  'Prepare ROI summary',
  'Confirm legal redlines',
  'Schedule QBR',
  'Share case study',
  'Update forecast notes',
];
const tasks: Task[] = Array.from({ length: 22 }, (_, i) => {
  const deal = deals[(i * 3) % 42]!;
  return {
    id: `t-${i + 1}`,
    title: TASK_TITLES[i % TASK_TITLES.length]!,
    dealId: deal.id,
    related: deal.name,
    owner: pick(OWNERS),
    dueAt: iso(
      now + Math.round((i - 6) * 0.7) * DAY + (9 + ((i * 3) % 8)) * 3_600_000 + (i % 2) * 1_800_000,
    ),
    priority: pick(['high', 'medium', 'low'] as const),
    done: i % 7 === 3,
  };
});

const MEETING_TITLES: Record<Meeting['kind'], string[]> = {
  call: ['Discovery call', 'Pricing check-in', 'Renewal call'],
  meeting: ['Stakeholder review', 'Procurement sync', 'Onsite workshop'],
  demo: ['Product demo', 'Analytics walkthrough', 'Admin console demo'],
};
const meetings: Meeting[] = Array.from({ length: 16 }, (_, i) => {
  const person = people[(i * 5) % people.length]!;
  const kind = pick(['call', 'meeting', 'demo'] as const);
  const startsAt =
    now + Math.round((i - 5) * 0.6) * DAY + (9 + ((i * 5) % 8)) * 3_600_000 + (i % 2) * 1_800_000;
  return {
    id: `m-${i + 1}`,
    kind,
    title: pick(MEETING_TITLES[kind]),
    with: person.name,
    company: person.company,
    startsAt: iso(startsAt),
    durationMin: pick([15, 30, 45, 60]),
    owner: pick(OWNERS),
    outcome: startsAt < Date.now() ? pick(['Positive', 'Needs follow-up', 'No answer']) : null,
  };
});

type Lead = {
  id: string;
  name: string;
  title: string;
  email: string;
  company: string;
  source: (typeof SOURCES)[number];
  score: number;
  interest: string;
  estimatedValue: number;
  status: 'new' | 'qualified' | 'disqualified' | 'converted';
  owner: string;
  dealId: string | null;
  createdAt: string;
};
type LeadAction = 'qualify' | 'disqualify' | 'convert';

const LEAD_PREFIXES = ['Bluefin', 'Cedar', 'Granite', 'Harbor', 'Juniper', 'Meridian', 'Pioneer'];
const LEAD_SUFFIXES = ['Analytics', 'Health', 'Supply', 'Studios', 'Partners'];
const INTERESTS = [
  'Pricing page',
  'Demo request',
  'Whitepaper',
  'Webinar',
  'Free trial',
  'Contact form',
];

const leadRand = rng(5150);
const leads: Lead[] = Array.from({ length: 32 }, (_, i) => {
  const first = FIRST[(i * 3 + 5) % FIRST.length]!;
  const last = LAST[(i * 11 + 2) % LAST.length]!;
  const company = `${LEAD_PREFIXES[i % LEAD_PREFIXES.length]} ${LEAD_SUFFIXES[(i * 3) % LEAD_SUFFIXES.length]}`;
  const roll = leadRand();
  return {
    id: `l-${i + 1}`,
    name: `${first} ${last}`,
    title: TITLES[i % TITLES.length]!,
    email: `${first.toLowerCase()}@${company.toLowerCase().replace(/[^a-z]+/g, '')}.io`,
    company,
    source: SOURCES[Math.floor(leadRand() * SOURCES.length)]!,
    score: Math.round(12 + leadRand() * 86),
    interest: INTERESTS[i % INTERESTS.length]!,
    estimatedValue: Math.round(8 + leadRand() * 90) * 1_000,
    status: roll > 0.9 ? 'disqualified' : roll > 0.72 ? 'qualified' : 'new',
    owner: OWNERS[i % OWNERS.length]!,
    dealId: null,
    createdAt: iso(Date.now() - Math.round(leadRand() * 14 * DAY)),
  };
});

function applyLeadAction(lead: Lead, action: LeadAction) {
  if (action === 'qualify') lead.status = 'qualified';
  if (action === 'disqualify') lead.status = 'disqualified';
  if (action !== 'convert' || lead.dealId) return;
  let company = companies.find((c) => c.name === lead.company);
  if (!company) {
    company = {
      id: `co-${companies.length + 1}`,
      name: lead.company,
      industry: pick(INDUSTRIES),
      employees: between(20, 600),
      revenue: between(1, 40) * 1_000_000,
      city: pick(CITIES),
      owner: lead.owner,
      tags: ['SMB'],
      website: lead.email.split('@')[1]!,
    };
    companies.push(company);
  }
  const deal: Deal = {
    id: `d-${2001 + deals.length}`,
    name: `${lead.company.split(' ')[0]} · ${lead.interest}`,
    companyId: company.id,
    company: company.name,
    contactId: people.find((p) => p.companyId === company.id)?.id ?? people[0]!.id,
    value: lead.estimatedValue,
    stage: 'qualified',
    probability: PROBABILITY.qualified,
    owner: lead.owner,
    source: lead.source,
    closeDate: iso(now + 45 * DAY),
    createdAt: iso(Date.now()),
  };
  deals.unshift(deal);
  Object.assign(lead, { status: 'converted', dealId: deal.id });
}

type SequenceStep = { kind: 'email' | 'call' | 'task'; delayDays: number; subject: string };
type Sequence = {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'draft';
  steps: SequenceStep[];
  owner: string;
  enrolled: number;
  active: number;
  openRate: number;
  replyRate: number;
  updatedAt: string;
};
type SequenceInput = Pick<Sequence, 'name' | 'status' | 'steps'>;

const STEP_SUBJECTS: Record<SequenceStep['kind'], string[]> = {
  email: [
    'Quick intro',
    'Following up',
    'Customer story you might like',
    'Worth a chat?',
    'Closing the loop',
  ],
  call: ['Intro call', 'Check-in call'],
  task: ['Connect on LinkedIn', 'Research account'],
};
const SEQUENCE_NAMES = [
  'Inbound demo follow-up',
  'Webinar attendees',
  'Outbound · Logistics VPs',
  'Trial nurture',
  'Renewal heads-up',
  'Re-engage closed-lost',
];
const seqRand = rng(6060);
const sequences: Sequence[] = SEQUENCE_NAMES.map((name, i) => {
  const steps = Array.from({ length: 3 + (i % 3) }, (_, s): SequenceStep => {
    const kind = s === 0 ? 'email' : (['email', 'email', 'call', 'task'] as const)[(s + i) % 4]!;
    return {
      kind,
      delayDays: s === 0 ? 0 : 2 + ((s + i) % 3),
      subject: STEP_SUBJECTS[kind][s % STEP_SUBJECTS[kind].length]!,
    };
  });
  const enrolled = i === 5 ? 0 : Math.round(40 + seqRand() * 400);
  return {
    id: `seq-${i + 1}`,
    name,
    status: i === 5 ? 'draft' : i === 3 ? 'paused' : 'active',
    steps,
    owner: OWNERS[i % OWNERS.length]!,
    enrolled,
    active: Math.round(enrolled * (0.2 + seqRand() * 0.4)),
    openRate: enrolled ? Math.round(38 + seqRand() * 30) : 0,
    replyRate: enrolled ? Math.round(4 + seqRand() * 14) : 0,
    updatedAt: iso(Date.now() - Math.round(seqRand() * 20 * DAY)),
  };
});

function companyDetail(company: Company) {
  const contacts = people.filter((p) => p.companyId === company.id);
  const companyDeals = deals.filter((d) => d.companyId === company.id);
  const names = new Set(contacts.map((p) => p.name));
  const activity = [
    ...companyDeals.map((d) => ({
      id: `${d.id}-a`,
      kind: d.stage === 'won' ? 'won' : 'deal',
      title: d.stage === 'won' ? `Closed ${d.name}` : `Opened ${d.name}`,
      actor: d.owner,
      at: d.stage === 'won' ? d.closeDate : d.createdAt,
    })),
    ...meetings
      .filter((m) => names.has(m.with) && Date.parse(m.startsAt) <= Date.now())
      .map((m) => ({
        id: m.id,
        kind: m.kind,
        title: `${m.title} with ${m.with}`,
        actor: m.owner,
        at: m.startsAt,
      })),
  ]
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, 8);
  return {
    company,
    contacts,
    deals: companyDeals,
    activity,
    wonRevenue: companyDeals.filter((d) => d.stage === 'won').reduce((s, d) => s + d.value, 0),
  };
}

const REP_QUOTA = 180_000;
const monthKey = (ms: number) => new Date(ms).toISOString().slice(0, 7);

function forecast() {
  const sum = (list: Deal[]) => list.reduce((s, d) => s + d.value, 0);
  const start = new Date(now);
  const months = Array.from({ length: 6 }, (_, i) => {
    const key = monthKey(new Date(start.getFullYear(), start.getMonth() - 2 + i, 15).getTime());
    const inMonth = deals.filter((d) => monthKey(Date.parse(d.closeDate)) === key);
    const at = (...stages: Stage[]) => sum(inMonth.filter((d) => stages.includes(d.stage)));
    return {
      month: key,
      closed: at('won'),
      commit: at('negotiation'),
      bestCase: at('proposal'),
      pipeline: at('lead', 'qualified'),
    };
  });
  const reps = OWNERS.map((owner) => {
    const own = deals.filter((d) => d.owner === owner);
    const won = own.filter((d) => d.stage === 'won');
    return {
      owner,
      quota: REP_QUOTA,
      closed: sum(won),
      commit: sum(own.filter((d) => d.stage === 'negotiation')),
      bestCase: sum(own.filter((d) => d.stage === 'proposal')),
      wonDeals: won.length,
    };
  }).sort((a, b) => b.closed - a.closed);
  return {
    quota: REP_QUOTA * OWNERS.length,
    closed: reps.reduce((s, r) => s + r.closed, 0),
    months,
    reps,
  };
}

const open = (d: Deal) => d.stage !== 'won' && d.stage !== 'lost';

function overview() {
  const quarterStart = now - 60 * DAY;
  const wonThisQuarter = deals
    .filter((d) => d.stage === 'won' && Date.parse(d.closeDate) >= quarterStart)
    .reduce((sum, d) => sum + d.value, 0);
  const quota = 900_000;
  const pipeline = STAGES.filter((s) => s !== 'won' && s !== 'lost').map((stage) => {
    const list = deals.filter((d) => d.stage === stage);
    return { stage, count: list.length, value: list.reduce((s, d) => s + d.value, 0) };
  });
  const r = rng(77);
  let cumulative = 0;
  const forecast = Array.from({ length: 12 }, (_, i) => {
    cumulative += 45_000 + r() * 60_000;
    return {
      week: `W${i + 1}`,
      closed: i < 8 ? Math.round(cumulative) : null,
      forecast: Math.round(cumulative * (i < 8 ? 1 : 1.02) + (i >= 7 ? (i - 6) * 18_000 : 0)),
      target: Math.round((quota / 12) * (i + 1)),
    };
  });
  const leaderboard = OWNERS.map((owner) => {
    const won = deals.filter((d) => d.owner === owner && d.stage === 'won');
    return {
      owner,
      won: won.reduce((s, d) => s + d.value, 0),
      deals: won.length,
      quota: 180_000,
    };
  }).sort((a, b) => b.won - a.won);
  const closingSoon = deals
    .filter(open)
    .filter((d) => Date.parse(d.closeDate) <= now + 21 * DAY)
    .sort((a, b) => Date.parse(a.closeDate) - Date.parse(b.closeDate))
    .slice(0, 6);
  const openDeals = deals.filter(open);
  return {
    quota,
    won: wonThisQuarter,
    stats: {
      pipelineValue: openDeals.reduce((s, d) => s + d.value, 0),
      weighted: openDeals.reduce((s, d) => s + (d.value * d.probability) / 100, 0),
      openDeals: openDeals.length,
      winRate: Math.round(
        (deals.filter((d) => d.stage === 'won').length / deals.filter((d) => !open(d)).length) *
          100,
      ),
    },
    pipeline,
    forecast,
    leaderboard,
    closingSoon,
  };
}

function reports() {
  const closed = deals.filter((d) => !open(d));
  const bySource = SOURCES.map((source) => {
    const list = deals.filter((d) => d.source === source);
    const won = list.filter((d) => d.stage === 'won');
    return {
      source,
      deals: list.length,
      won: won.length,
      revenue: won.reduce((s, d) => s + d.value, 0),
    };
  });
  const r = rng(91);
  const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
  return {
    winRate: Math.round((closed.filter((d) => d.stage === 'won').length / closed.length) * 100),
    avgCycleDays: 41,
    avgDealSize: Math.round(
      deals.filter((d) => d.stage === 'won').reduce((s, d) => s + d.value, 0) /
        Math.max(1, deals.filter((d) => d.stage === 'won').length),
    ),
    trend: months.map((month, i) => ({
      month,
      winRate: Math.round(28 + i * 2 + r() * 8),
      cycle: Math.round(52 - i * 2 + r() * 6),
    })),
    bySource,
    lossReasons: [
      { reason: 'Price', count: 9 },
      { reason: 'Chose competitor', count: 7 },
      { reason: 'No decision', count: 5 },
      { reason: 'Missing feature', count: 3 },
      { reason: 'Timing', count: 2 },
    ],
    byOwner: OWNERS.map((owner) => {
      const own = closed.filter((d) => d.owner === owner);
      return {
        owner,
        winRate: own.length
          ? Math.round((own.filter((d) => d.stage === 'won').length / own.length) * 100)
          : 0,
        cycle: 28 + ((owner.length * 7) % 30),
      };
    }),
  };
}

function dealDetail(deal: Deal) {
  const contact = people.find((p) => p.id === deal.contactId)!;
  const others = people
    .filter((p) => p.companyId === deal.companyId && p.id !== contact.id)
    .slice(0, 2);
  const r = rng(Number(deal.id.slice(2)));
  const products = PRODUCTS.filter(() => r() > 0.4).map((p) => ({
    ...p,
    quantity: 1 + Math.floor(r() * 3),
  }));
  const created = Date.parse(deal.createdAt);
  const activity = [
    {
      id: 'a1',
      kind: 'created',
      title: 'Deal created from inbound form',
      actor: deal.owner,
      at: iso(created + 9.5 * 3_600_000),
    },
    {
      id: 'a2',
      kind: 'call',
      title: `Discovery call with ${contact.name}`,
      actor: deal.owner,
      at: iso(created + 3 * DAY + 14 * 3_600_000),
    },
    {
      id: 'a3',
      kind: 'email',
      title: 'Sent pricing and security pack',
      actor: deal.owner,
      at: iso(created + 9 * DAY + 11.25 * 3_600_000),
    },
    {
      id: 'a4',
      kind: 'stage',
      title: `Moved to ${deal.stage}`,
      actor: deal.owner,
      at: iso(Math.min(Date.now(), created + 20 * DAY + 16.5 * 3_600_000)),
    },
  ].reverse();
  return {
    deal,
    contacts: [contact, ...others],
    products: products.length ? products : [{ ...PRODUCTS[0]!, quantity: 1 }],
    activity,
    notes: noteFor(deal.id),
  };
}

function contactDetail(person: Person) {
  const company = companies.find((c) => c.id === person.companyId)!;
  const personDeals = deals.filter((d) => d.companyId === person.companyId);
  const base = Date.parse(person.lastContactedAt);
  return {
    person,
    company,
    deals: personDeals,
    activity: [
      { id: 'c1', kind: 'email', title: 'Replied to the renewal proposal', at: iso(base) },
      { id: 'c2', kind: 'meeting', title: 'Quarterly business review', at: iso(base - 9 * DAY) },
      { id: 'c3', kind: 'call', title: 'Asked about SSO pricing', at: iso(base - 21 * DAY) },
      {
        id: 'c4',
        kind: 'note',
        title: 'Prefers async updates over calls',
        at: iso(base - 34 * DAY),
      },
    ],
    emails: [
      {
        id: 'e1',
        subject: 'Re: Renewal proposal for 2027',
        snippet: 'Thanks, the 2-year option works for us. Legal will send redlines by Friday.',
        at: iso(base),
        direction: 'in' as const,
      },
      {
        id: 'e2',
        subject: 'Renewal proposal for 2027',
        snippet: 'Attached is the proposal we discussed, including the analytics add-on.',
        at: iso(base - DAY),
        direction: 'out' as const,
      },
      {
        id: 'e3',
        subject: 'QBR follow-up',
        snippet: 'Here are the adoption numbers and the roadmap items you asked about.',
        at: iso(base - 8 * DAY),
        direction: 'out' as const,
      },
    ],
    files: [
      { id: 'f1', name: 'Order form 2027.pdf', size: 248_000, at: iso(base - DAY) },
      { id: 'f2', name: 'Security questionnaire.xlsx', size: 91_000, at: iso(base - 12 * DAY) },
      { id: 'f3', name: 'QBR deck Q3.pptx', size: 4_200_000, at: iso(base - 9 * DAY) },
    ],
  };
}

export const crmHandlers: HttpHandler[] = [
  http.get(url('/overview'), async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    return HttpResponse.json(overview());
  }),

  http.get(url('/deals'), async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    return HttpResponse.json(deals);
  }),

  http.post<never, { name: string; company: string; value: number; stage: Stage }>(
    url('/deals'),
    async ({ request }) => {
      await networkDelay();
      const auth = requireAuth(request);
      if ('error' in auth) return auth.error;
      const body = await request.json();
      const company = companies.find((c) => c.name === body.company) ?? companies[0]!;
      const deal: Deal = {
        id: `d-${1001 + deals.length + 100}`,
        name: body.name,
        companyId: company.id,
        company: company.name,
        contactId: people.find((p) => p.companyId === company.id)?.id ?? people[0]!.id,
        value: body.value,
        stage: body.stage,
        probability: PROBABILITY[body.stage],
        owner: `${auth.user.firstName} ${auth.user.lastName}`,
        source: 'Inbound',
        closeDate: iso(now + 30 * DAY),
        createdAt: iso(Date.now()),
      };
      deals.unshift(deal);
      return HttpResponse.json(deal);
    },
  ),

  http.patch<{ id: string }, { stage: Stage }>(url('/deals/:id'), async ({ request, params }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const deal = deals.find((d) => d.id === params.id);
    if (!deal) return errorResponse('Deal not found', 404);
    const { stage } = await request.json();
    Object.assign(deal, { stage, probability: PROBABILITY[stage] });
    return HttpResponse.json(deal);
  }),

  http.get<{ id: string }>(url('/deals/:id'), async ({ request, params }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const deal = deals.find((d) => d.id === params.id);
    if (!deal) return errorResponse('Deal not found', 404);
    return HttpResponse.json(dealDetail(deal));
  }),

  http.post<{ id: string }, { body: string }>(
    url('/deals/:id/notes'),
    async ({ request, params }) => {
      await networkDelay();
      const auth = requireAuth(request);
      if ('error' in auth) return auth.error;
      const list = noteFor(params.id);
      const { body } = await request.json();
      const note: Note = {
        id: `${params.id}-n${list.length + 1}-${Date.now()}`,
        author: `${auth.user.firstName} ${auth.user.lastName}`,
        body,
        at: iso(Date.now()),
      };
      list.unshift(note);
      return HttpResponse.json(note);
    },
  ),

  http.get(url('/people'), async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    return HttpResponse.json(people);
  }),

  http.get(url('/companies'), async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    return HttpResponse.json(
      companies.map((c) => ({
        ...c,
        contacts: people.filter((p) => p.companyId === c.id).length,
        openDeals: deals.filter((d) => d.companyId === c.id && open(d)).length,
        pipeline: deals
          .filter((d) => d.companyId === c.id && open(d))
          .reduce((s, d) => s + d.value, 0),
      })),
    );
  }),

  http.get<{ id: string }>(url('/contacts/:id'), async ({ request, params }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const person = people.find((p) => p.id === params.id);
    if (!person) return errorResponse('Contact not found', 404);
    return HttpResponse.json(contactDetail(person));
  }),

  http.get(url('/tasks'), async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    return HttpResponse.json(tasks);
  }),

  http.patch<{ id: string }, { done: boolean }>(url('/tasks/:id'), async ({ request, params }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const task = tasks.find((t) => t.id === params.id);
    if (!task) return errorResponse('Task not found', 404);
    task.done = (await request.json()).done;
    return HttpResponse.json(task);
  }),

  http.get(url('/meetings'), async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    return HttpResponse.json(
      [...meetings].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)),
    );
  }),

  http.post<never, { with: string; outcome: string; durationMin: number; title: string }>(
    url('/calls'),
    async ({ request }) => {
      await networkDelay();
      const auth = requireAuth(request);
      if ('error' in auth) return auth.error;
      const body = await request.json();
      const person = people.find((p) => p.name === body.with);
      const meeting: Meeting = {
        id: `m-${meetings.length + 1}-${Date.now()}`,
        kind: 'call',
        title: body.title,
        with: body.with,
        company: person?.company ?? '—',
        startsAt: iso(Date.now() - body.durationMin * 60_000),
        durationMin: body.durationMin,
        owner: `${auth.user.firstName} ${auth.user.lastName}`,
        outcome: body.outcome,
      };
      meetings.push(meeting);
      return HttpResponse.json(meeting);
    },
  ),

  http.get(url('/reports'), async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    return HttpResponse.json(reports());
  }),

  http.get<{ id: string }>(url('/companies/:id'), async ({ request, params }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const company = companies.find((c) => c.id === params.id);
    if (!company) return errorResponse('Company not found', 404);
    return HttpResponse.json(companyDetail(company));
  }),

  http.get(url('/leads'), async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    return HttpResponse.json(leads);
  }),

  http.post<never, { ids: string[]; action: LeadAction }>(
    url('/leads/actions'),
    async ({ request }) => {
      await networkDelay();
      const auth = requireAuth(request);
      if ('error' in auth) return auth.error;
      const { ids, action } = await request.json();
      const changed = leads.filter((l) => ids.includes(l.id) && l.status !== 'converted');
      changed.forEach((lead) => applyLeadAction(lead, action));
      return HttpResponse.json(changed);
    },
  ),

  http.get(url('/sequences'), async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    return HttpResponse.json(sequences);
  }),

  http.post<never, SequenceInput>(url('/sequences'), async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const sequence: Sequence = {
      ...(await request.json()),
      id: `seq-${sequences.length + 1}-${Date.now()}`,
      owner: `${auth.user.firstName} ${auth.user.lastName}`,
      enrolled: 0,
      active: 0,
      openRate: 0,
      replyRate: 0,
      updatedAt: iso(Date.now()),
    };
    sequences.unshift(sequence);
    return HttpResponse.json(sequence);
  }),

  http.put<{ id: string }, SequenceInput>(url('/sequences/:id'), async ({ request, params }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const sequence = sequences.find((s) => s.id === params.id);
    if (!sequence) return errorResponse('Sequence not found', 404);
    Object.assign(sequence, await request.json(), { updatedAt: iso(Date.now()) });
    return HttpResponse.json(sequence);
  }),

  http.get(url('/forecast'), async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    return HttpResponse.json(forecast());
  }),

  ...createQuoteHandlers({ deals, people }),
  ...createActivityHandlers({ deals, people }),
];
