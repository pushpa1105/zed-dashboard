import { http, HttpResponse, type HttpHandler } from 'msw';

import { errorResponse } from '../utils';

import { DAY, guard, isoDate, rng, startOfToday, url, type Staff } from './hr-shared';

type Category = 'compliance' | 'leadership' | 'technical' | 'product' | 'wellbeing';
type Format = 'online' | 'workshop' | 'video';

/** Title, category, format, hours, provider, required. */
const COURSES: Array<[string, Category, Format, number, string, boolean]> = [
  ['Code of Conduct 2026', 'compliance', 'online', 1, 'Orbitly Academy', true],
  ['Information Security Essentials', 'compliance', 'online', 1.5, 'KnowBe4', true],
  ['GDPR & Data Privacy', 'compliance', 'video', 1, 'Orbitly Academy', true],
  ['First-Time Manager Bootcamp', 'leadership', 'workshop', 12, 'Orbitly Academy', false],
  ['Giving Effective Feedback', 'leadership', 'workshop', 3, 'Crucial Learning', false],
  ['Advanced TypeScript', 'technical', 'online', 8, 'Frontend Masters', false],
  ['Cloud Cost Fundamentals', 'technical', 'video', 4, 'A Cloud Guru', false],
  ['Product Discovery', 'product', 'workshop', 6, 'SVPG', false],
  ['Mindfulness at Work', 'wellbeing', 'video', 1, 'Headspace', false],
];

type Assignment = {
  id: string;
  personId: string;
  name: string;
  department: string;
  courseId: string;
  due: string;
  progress: number;
};

const statusOf = ({ progress, due }: Assignment) =>
  progress === 100
    ? 'completed'
    : Date.parse(due) < startOfToday()
      ? 'overdue'
      : progress
        ? 'inProgress'
        : 'notStarted';

export function hrTrainingHandlers(staff: readonly Staff[]): HttpHandler[] {
  const r = rng(4242);
  const today = startOfToday();
  const courses = COURSES.map(([title, category, format, hours, provider, required], i) => ({
    id: `course-${i + 1}`,
    title,
    category,
    format,
    hours,
    provider,
    required,
    rating: Math.round((3.8 + r() * 1.2) * 10) / 10,
  }));

  const assignments: Assignment[] = [];
  const assign = (person: Staff, courseId: string, due: string, progress = 0) =>
    assignments.push({
      id: `ta-${assignments.length + 1}`,
      personId: person.id,
      name: person.name,
      department: person.department,
      courseId,
      due,
      progress,
    });
  for (const person of staff) {
    for (const course of courses) {
      if (!course.required && r() > 0.1) continue;
      const roll = r();
      const progress = roll < 0.6 ? 100 : roll < 0.75 ? 0 : 10 * Math.ceil(r() * 9);
      assign(person, course.id, isoDate(today + Math.round(r() * 70 - 25) * DAY), progress);
    }
  }

  return [
    http.get(url('/training'), async ({ request }) => {
      const denied = await guard(request);
      if (denied) return denied;
      return HttpResponse.json({
        courses,
        assignments: assignments.map((a) => ({ ...a, status: statusOf(a) })),
      });
    }),

    http.post<never, { courseId: string; personIds: string[]; due: string }>(
      url('/training/assignments'),
      async ({ request }) => {
        const denied = await guard(request);
        if (denied) return denied;
        const { courseId, personIds, due } = await request.json();
        if (!courses.some((c) => c.id === courseId)) return errorResponse('Course not found', 404);
        const taken = new Set(
          assignments.filter((a) => a.courseId === courseId).map((a) => a.personId),
        );
        const people = staff.filter((p) => personIds.includes(p.id) && !taken.has(p.id));
        for (const person of people) assign(person, courseId, due);
        return HttpResponse.json({ assigned: people.length }, { status: 201 });
      },
    ),
  ];
}
