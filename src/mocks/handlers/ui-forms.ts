import { delay, http, HttpResponse, type HttpHandler } from 'msw';

import { env } from '@/core/config/env';

import { errorResponse, networkDelay } from '../utils';

/** Mock API for the "ui-forms" feature: async search and form submission. */

const FIRST = [
  'Ava',
  'Liam',
  'Maya',
  'Noah',
  'Sofia',
  'Ethan',
  'Aria',
  'Lucas',
  'Isla',
  'Mateo',
  'Zara',
  'Leo',
  'Nora',
  'Kai',
  'Hannah',
  'Omar',
  'Priya',
  'Felix',
  'Yuki',
  'Diego',
];
const LAST = [
  'Morgan',
  'Chen',
  'Patel',
  'García',
  'Okafor',
  'Novak',
  'Silva',
  'Kim',
  'Rossi',
  'Andersen',
];
const ROLES = [
  'Product Designer',
  'Engineer',
  'Account Executive',
  'Data Analyst',
  'Support Lead',
  'Recruiter',
  'Finance Manager',
  'Marketing Lead',
];
const TEAMS = [
  'Design',
  'Platform',
  'Sales',
  'Analytics',
  'Support',
  'People',
  'Finance',
  'Growth',
];

const USERS = Array.from({ length: 200 }, (_, i) => {
  const first = FIRST[i % FIRST.length]!;
  const last = LAST[Math.floor(i / FIRST.length) % LAST.length]!;
  const role = (i * 7) % ROLES.length;
  return {
    id: `u-${i + 1}`,
    name: `${first} ${last}`,
    email: `${first}.${last}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') + '@acme.io',
    role: ROLES[role]!,
    team: TEAMS[role]!,
  };
});

const COUNTRIES = [
  ['AR', 'Argentina', 'Americas'],
  ['AU', 'Australia', 'Oceania'],
  ['AT', 'Austria', 'Europe'],
  ['BD', 'Bangladesh', 'Asia'],
  ['BE', 'Belgium', 'Europe'],
  ['BR', 'Brazil', 'Americas'],
  ['BG', 'Bulgaria', 'Europe'],
  ['CA', 'Canada', 'Americas'],
  ['CL', 'Chile', 'Americas'],
  ['CN', 'China', 'Asia'],
  ['CO', 'Colombia', 'Americas'],
  ['HR', 'Croatia', 'Europe'],
  ['CZ', 'Czechia', 'Europe'],
  ['DK', 'Denmark', 'Europe'],
  ['EG', 'Egypt', 'Africa'],
  ['EE', 'Estonia', 'Europe'],
  ['FI', 'Finland', 'Europe'],
  ['FR', 'France', 'Europe'],
  ['DE', 'Germany', 'Europe'],
  ['GH', 'Ghana', 'Africa'],
  ['GR', 'Greece', 'Europe'],
  ['HU', 'Hungary', 'Europe'],
  ['IS', 'Iceland', 'Europe'],
  ['IN', 'India', 'Asia'],
  ['ID', 'Indonesia', 'Asia'],
  ['IE', 'Ireland', 'Europe'],
  ['IL', 'Israel', 'Asia'],
  ['IT', 'Italy', 'Europe'],
  ['JP', 'Japan', 'Asia'],
  ['KE', 'Kenya', 'Africa'],
  ['LV', 'Latvia', 'Europe'],
  ['LT', 'Lithuania', 'Europe'],
  ['MY', 'Malaysia', 'Asia'],
  ['MX', 'Mexico', 'Americas'],
  ['MA', 'Morocco', 'Africa'],
  ['NP', 'Nepal', 'Asia'],
  ['NL', 'Netherlands', 'Europe'],
  ['NZ', 'New Zealand', 'Oceania'],
  ['NG', 'Nigeria', 'Africa'],
  ['NO', 'Norway', 'Europe'],
  ['PK', 'Pakistan', 'Asia'],
  ['PE', 'Peru', 'Americas'],
  ['PH', 'Philippines', 'Asia'],
  ['PL', 'Poland', 'Europe'],
  ['PT', 'Portugal', 'Europe'],
  ['RO', 'Romania', 'Europe'],
  ['SA', 'Saudi Arabia', 'Asia'],
  ['RS', 'Serbia', 'Europe'],
  ['SG', 'Singapore', 'Asia'],
  ['SK', 'Slovakia', 'Europe'],
  ['ZA', 'South Africa', 'Africa'],
  ['KR', 'South Korea', 'Asia'],
  ['ES', 'Spain', 'Europe'],
  ['LK', 'Sri Lanka', 'Asia'],
  ['SE', 'Sweden', 'Europe'],
  ['CH', 'Switzerland', 'Europe'],
  ['TH', 'Thailand', 'Asia'],
  ['TR', 'Türkiye', 'Asia'],
  ['UA', 'Ukraine', 'Europe'],
  ['AE', 'United Arab Emirates', 'Asia'],
  ['GB', 'United Kingdom', 'Europe'],
  ['US', 'United States', 'Americas'],
  ['VN', 'Vietnam', 'Asia'],
].map(([code, name, region]) => ({ code: code!, name: name!, region: region! }));

const searchDelay = () =>
  import.meta.env.MODE === 'test' ? delay(0) : delay(250 + Math.random() * 450);

const matches = (q: string, ...fields: string[]) =>
  fields.some((f) => f.toLowerCase().includes(q.toLowerCase()));

export const uiFormsHandlers: HttpHandler[] = [
  http.get(`${env.API_URL}/ui/search/users`, async ({ request }) => {
    await searchDelay();
    const q = new URL(request.url).searchParams.get('q') ?? '';
    if (q === 'error') return errorResponse('Search is temporarily unavailable', 503);
    return HttpResponse.json(USERS.filter((u) => matches(q, u.name, u.email, u.team)).slice(0, 20));
  }),

  http.get(`${env.API_URL}/ui/search/countries`, async ({ request }) => {
    await searchDelay();
    const q = new URL(request.url).searchParams.get('q') ?? '';
    if (q === 'error') return errorResponse('Search is temporarily unavailable', 503);
    return HttpResponse.json(COUNTRIES.filter((c) => matches(q, c.name, c.code)));
  }),

  http.post(`${env.API_URL}/ui/forms/company`, async ({ request }) => {
    await networkDelay();
    const body = (await request.json()) as { companyName?: string };
    if (body.companyName?.toLowerCase() === 'taken') {
      return errorResponse('That company name is already registered', 409);
    }
    return HttpResponse.json({ id: `org-${Date.now()}`, ...body }, { status: 201 });
  }),

  /** Generic demo submit: echoes an id. Send `"fail": true` to get a 422. */
  http.post(`${env.API_URL}/ui/forms/submit`, async ({ request }) => {
    await networkDelay();
    const body = (await request.json()) as Record<string, unknown>;
    if (body.fail === true) return errorResponse('The server rejected this submission', 422);
    return HttpResponse.json({ id: `sub-${Date.now()}`, receivedAt: Date.now() }, { status: 201 });
  }),

  /** Auth form demos: emails containing "locked" fail; one-time codes must be 123456. */
  http.post(`${env.API_URL}/ui/auth/:action`, async ({ request, params }) => {
    await networkDelay();
    const body = (await request.json()) as { email?: string; code?: string; password?: string };
    if (body.email?.includes('locked')) {
      return errorResponse('This account is locked. Contact your admin.', 423);
    }
    if ((params.action === 'otp' || params.action === 'two-factor') && body.code !== '123456') {
      return errorResponse('That code is not valid. Try 123456.', 400);
    }
    if (params.action === 'unlock' && body.password !== 'password') {
      return errorResponse('Wrong password. Try "password".', 401);
    }
    return HttpResponse.json({ ok: true });
  }),

  /** Lazy tree: children of a folder (`parent` is the folder path). */
  http.get(`${env.API_URL}/ui/tree/children`, async ({ request }) => {
    await searchDelay();
    const parent = new URL(request.url).searchParams.get('parent') ?? '';
    const depth = parent.split('/').length;
    const folders = ['Design', 'Engineering', 'Marketing', 'Finance', 'Legal'];
    const files = ['brief.pdf', 'budget.xlsx', 'notes.md', 'roadmap.key'];
    const children =
      depth < 3
        ? folders.slice(0, 5 - depth).map((name) => ({
            value: `${parent}/${name.toLowerCase()}`,
            label: name,
            hasChildren: true,
          }))
        : files.map((file) => ({ value: `${parent}/${file}`, label: file }));
    return HttpResponse.json(children);
  }),
];
