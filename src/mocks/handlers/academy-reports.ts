import { http, HttpResponse } from 'msw';

import { env } from '@/core/config/env';

import { authed, COURSES, DAY, seeded } from './academy-seed';

/** Buckets per range and days per bucket. */
const RANGES: Record<string, [count: number, days: number]> = {
  '30d': [30, 1],
  '90d': [13, 7],
  '12m': [12, 30],
};

type Totals = { enrolments: number; completions: number; revenue: number };

const sum = (rows: Totals[]): Totals => ({
  enrolments: rows.reduce((s, r) => s + r.enrolments, 0),
  completions: rows.reduce((s, r) => s + r.completions, 0),
  revenue: rows.reduce((s, r) => s + r.revenue, 0),
});

/** Splits `total` proportionally to `weights` (all zero → all zero). */
const share = (total: number, weights: number[]) => {
  const all = weights.reduce((s, w) => s + w, 0);
  return weights.map((w) => (all ? Math.round((total * w) / all) : 0));
};

/** Two consecutive periods of buckets: the previous one for deltas, then the current one. */
function timeline(range: string) {
  const [count, days] = RANGES[range]!;
  const rand = seeded(`academy:reports:${range}`);
  const buckets = Array.from({ length: count * 2 }, (_, k) => {
    const growth = 0.8 + (0.35 * k) / (count * 2);
    const enrolments = Math.round(days * 46 * growth * (0.85 + rand() * 0.3));
    return {
      period: new Date(Date.now() - (count * 2 - k - 1) * days * DAY).toISOString(),
      enrolments,
      completions: Math.round(enrolments * (0.28 + rand() * 0.12)),
      revenue: Math.round(enrolments * (38 + rand() * 14)),
    };
  });
  return { previous: sum(buckets.slice(0, count)), series: buckets.slice(count) };
}

function leaderboard(range: string, totals: Totals) {
  const rand = seeded(`academy:leaderboard:${range}`);
  const weights = COURSES.map(() => 0.4 + rand());
  const rates = COURSES.map(() => 0.2 + rand() * 0.3);
  const enrolments = share(totals.enrolments, weights);
  const completions = share(
    totals.completions,
    enrolments.map((e, i) => e * rates[i]!),
  );
  const revenue = share(
    totals.revenue,
    enrolments.map((e, i) => e * COURSES[i]!.price),
  );
  return COURSES.map((c, i) => ({
    id: c.id,
    title: c.title,
    color: c.color,
    enrolments: enrolments[i]!,
    completions: completions[i]!,
    revenue: revenue[i]!,
    rating: Math.round((4.4 + rand() * 0.55) * 10) / 10,
  }));
}

const DROPOFF = Object.fromEntries(
  COURSES.map((course) => {
    const rand = seeded(`academy:dropoff:${course.id}`);
    let learners = 100;
    const lessons = course.modules.flatMap(([, list]) => list);
    return [
      course.id,
      lessons.map(([title, type], i) => {
        if (i) learners *= type === 'lab' ? 0.8 + rand() * 0.1 : 0.88 + rand() * 0.1;
        return { title, learners: Math.round(learners) };
      }),
    ];
  }),
);

export const academyReportHandlers = [
  http.get(`${env.API_URL}/academy/reports`, async ({ request }) => {
    const error = await authed(request);
    if (error) return error;
    const param = new URL(request.url).searchParams.get('range') ?? '';
    const range = param in RANGES ? param : '30d';
    const { previous, series } = timeline(range);
    return HttpResponse.json({
      range,
      series,
      previous,
      courses: leaderboard(range, sum(series)),
      dropoff: DROPOFF,
    });
  }),
];
