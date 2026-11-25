import { http, HttpResponse } from 'msw';

import { errorResponse } from '../utils';

import { DAY, DEPARTMENTS, guard, isoDate, rng, startOfToday, url } from './hr-shared';

const QUESTIONS = [
  'recommend',
  'growth',
  'manager',
  'recognition',
  'workload',
  'mission',
  'tools',
  'belonging',
] as const;

type Survey = {
  id: string;
  title: string;
  status: 'scheduled' | 'active' | 'closed';
  opensAt: string;
  closesAt: string;
  invited: number;
  responses: number;
  remindedAt: string | null;
};

/** Title, days from today to opening, length in days. */
const SURVEYS: Array<[string, number, number]> = [
  ['Annual culture survey 2027', 20, 21],
  ['Q4 2026 pulse', -9, 14],
  ['Remote work check-in', -48, 10],
  ['Q3 2026 pulse', -95, 14],
  ['Manager effectiveness 2026', -150, 21],
  ['Q2 2026 pulse', -185, 14],
];

const COMMENTS: Array<['positive' | 'neutral' | 'negative', (typeof QUESTIONS)[number], string]> = [
  ['positive', 'manager', 'My manager makes time for one-on-ones even in busy weeks.'],
  ['negative', 'workload', 'The last release crunch was rough; we need better planning.'],
  ['positive', 'mission', 'I can see how my work moves the company goals forward.'],
  ['neutral', 'tools', 'Laptops are fine, but the VPN drops several times a day.'],
  ['negative', 'growth', 'Promotion criteria are unclear outside engineering.'],
  ['positive', 'belonging', 'The new ERG events made it easier to meet people across teams.'],
  ['neutral', 'recognition', 'Shout-outs happen in Slack but rarely reach leadership.'],
  ['positive', 'growth', 'The learning budget is generous and easy to use.'],
  ['negative', 'tools', 'Expense reports still take far too many clicks.'],
  ['neutral', 'workload', 'Workload is fair most months, but quarter end is intense.'],
  ['positive', 'recommend', 'I already referred two friends, both got offers.'],
  ['negative', 'manager', 'Reorgs changed my manager three times this year.'],
];

const r = rng(909);
const today = startOfToday();
const surveys: Survey[] = SURVEYS.map(([title, opensIn, length], i) => {
  const invited = 58 + Math.round(r() * 8);
  const status = opensIn > 0 ? 'scheduled' : opensIn + length > 0 ? 'active' : 'closed';
  return {
    id: `survey-${i + 1}`,
    title,
    status,
    opensAt: isoDate(today + opensIn * DAY),
    closesAt: isoDate(today + (opensIn + length) * DAY),
    invited,
    responses:
      status === 'scheduled'
        ? 0
        : Math.round(invited * (status === 'active' ? 0.52 : 0.78 + r() * 0.15)),
    remindedAt: null,
  };
});

const enps = Array.from({ length: 12 }, (_, i) => {
  const month = new Date(today);
  month.setUTCDate(1);
  month.setUTCMonth(month.getUTCMonth() - 11 + i);
  const promoters = Math.round(38 + i * 1.1 + r() * 8);
  const detractors = Math.round(24 - i * 0.6 + r() * 6);
  return {
    month: isoDate(month.getTime()).slice(0, 7),
    promoters,
    passives: 100 - promoters - detractors,
    detractors,
    score: promoters - detractors,
  };
});

const scores = DEPARTMENTS.map((department) => ({
  department,
  values: Object.fromEntries(
    QUESTIONS.map((q) => [
      q,
      Math.min(5, Math.round((2.6 + r() * 2.2 + (q === 'mission' ? 0.4 : 0)) * 10) / 10),
    ]),
  ),
}));

const comments = COMMENTS.map(([sentiment, topic, text], i) => ({
  id: `comment-${i + 1}`,
  sentiment,
  topic,
  text,
  department: DEPARTMENTS[Math.floor(r() * DEPARTMENTS.length)]!,
  date: isoDate(today - Math.floor(r() * 9) * DAY),
}));

export const hrEngagementHandlers = [
  http.get(url('/engagement'), async ({ request }) => {
    const denied = await guard(request);
    if (denied) return denied;
    return HttpResponse.json({ surveys, enps, scores, comments });
  }),

  http.post<{ id: string }>(url('/engagement/surveys/:id/remind'), async ({ request, params }) => {
    const denied = await guard(request);
    if (denied) return denied;
    const survey = surveys.find((s) => s.id === params.id);
    if (survey?.status !== 'active') return errorResponse('Survey is not open', 409);
    survey.remindedAt = isoDate(startOfToday());
    return HttpResponse.json(survey);
  }),
];
