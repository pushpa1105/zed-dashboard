import { http, HttpResponse } from 'msw';

import { env } from '@/core/config/env';

import {
  authed,
  courseById,
  COURSES,
  DAY,
  FIRST_NAMES,
  INSTRUCTORS,
  LAST_NAMES,
  pick,
  seeded,
} from './academy-seed';

const FORMATS = ['Live build', 'Office hours', 'Workshop', 'Ask me anything', 'Critique'];
const HOURS = [9, 11, 14, 16, 18];
const PAST = 12;
const UPCOMING = 9;

const agenda = (topic: string) => [
  'Questions from the forum',
  `Walkthrough: ${topic}`,
  'Hands-on exercise in breakout rooms',
  'Open Q&A and next steps',
];

function newSession(id: string, courseId: string, title: string, startsAt: Date) {
  const course = courseById(courseId);
  const host = INSTRUCTORS.find((i) => i.id === course.instructorId)!;
  return {
    id,
    title,
    courseId,
    courseTitle: course.title,
    color: course.color,
    host: { name: host.name, title: host.title },
    startsAt: startsAt.toISOString(),
    durationMin: 60,
    capacity: 100,
    registered: 0,
    attended: null as number | null,
    going: false,
    joinUrl: `https://meet.example.com/academy-${id}`,
    agenda: agenda(title),
    attendees: [] as string[],
    recording: null as { durationMin: number; views: number } | null,
  };
}

const SESSIONS = (() => {
  const rand = seeded('academy:live');
  return Array.from({ length: PAST + UPCOMING }, (_, i) => {
    const course = COURSES[i % COURSES.length]!;
    const [topic] = pick(
      rand,
      course.modules.flatMap(([, lessons]) => lessons),
    );
    const start = new Date(Date.now() + (i - PAST) * 3.2 * DAY);
    start.setHours(pick(rand, HOURS), rand() > 0.5 ? 30 : 0, 0, 0);
    // One session is running right now so the "Join" flow is visible.
    if (i === PAST) start.setTime(Date.now() - 20 * 60_000);
    const session = newSession(
      `live-${i + 1}`,
      course.id,
      `${pick(rand, FORMATS)}: ${topic}`,
      start,
    );
    const past = i < PAST;
    const capacity = pick(rand, [40, 60, 80, 120]);
    const registered = Math.round(capacity * (0.45 + rand() * 0.5));
    const attended = Math.round(registered * (0.45 + rand() * 0.45));
    return Object.assign(session, {
      durationMin: pick(rand, [45, 60, 60, 90]),
      capacity,
      registered,
      attended: past ? attended : null,
      going: !past && rand() < 0.45,
      attendees: Array.from(
        { length: 7 },
        (_, k) =>
          `${FIRST_NAMES[(i * 5 + k * 3) % FIRST_NAMES.length]} ${LAST_NAMES[(i + k * 7) % LAST_NAMES.length]}`,
      ),
      recording:
        past && rand() < 0.85
          ? {
              durationMin: 40 + Math.round(rand() * 45),
              views: Math.round(attended * (1 + rand() * 3)),
            }
          : null,
    });
  });
})();

export const academyLiveHandlers = [
  http.get(`${env.API_URL}/academy/live`, async ({ request }) => {
    const error = await authed(request);
    if (error) return error;
    return HttpResponse.json([...SESSIONS].sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
  }),

  http.post<
    never,
    { title: string; courseId: string; startsAt: string; durationMin: number; capacity: number }
  >(`${env.API_URL}/academy/live`, async ({ request }) => {
    const error = await authed(request);
    if (error) return error;
    const { title, courseId, startsAt, durationMin, capacity } = await request.json();
    if (!COURSES.some((c) => c.id === courseId))
      return HttpResponse.json({ message: 'Course not found' }, { status: 422 });
    const session = newSession(`live-${SESSIONS.length + 1}`, courseId, title, new Date(startsAt));
    SESSIONS.push(Object.assign(session, { durationMin, capacity }));
    return HttpResponse.json(session, { status: 201 });
  }),

  http.put<{ id: string }, { going: boolean }>(
    `${env.API_URL}/academy/live/:id/registration`,
    async ({ request, params }) => {
      const error = await authed(request);
      if (error) return error;
      const session = SESSIONS.find((s) => s.id === params.id);
      if (!session) return HttpResponse.json({ message: 'Session not found' }, { status: 404 });
      const { going } = await request.json();
      if (going && session.registered >= session.capacity)
        return HttpResponse.json({ message: 'This session is full' }, { status: 422 });
      if (going !== session.going) session.registered += going ? 1 : -1;
      session.going = going;
      return HttpResponse.json(session);
    },
  ),
];
