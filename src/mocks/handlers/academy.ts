import { http, HttpResponse, type HttpHandler } from 'msw';

import { env } from '@/core/config/env';

import { academyBuilderHandlers } from './academy-builder';
import {
  FEEDBACK,
  INSTRUCTOR_REPLIES,
  QUIZ_BANK,
  STUDENT_REPLIES,
  THREAD_SEEDS,
} from './academy-content';
import { academyLiveHandlers } from './academy-live';
import { academyReportHandlers } from './academy-reports';
import {
  authed,
  courseById,
  COURSES,
  DAY,
  daysFromNow,
  FIRST_NAMES,
  INSTRUCTORS,
  LAST_NAMES,
  pick,
  seeded,
  type CourseSeed,
} from './academy-seed';

/** Who is learning: progress per course for the demo learner. */
const PROGRESS: Record<string, number> = {
  'data-intensive-dashboards': 62,
  'sql-for-product-analytics': 100,
  'react-performance': 28,
  'metrics-layer': 9,
};

const reviews = (courseId: string) => {
  const rand = seeded(`reviews:${courseId}`);
  const people = [
    'Priya Raman',
    'Lucas Meyer',
    'Sofia Alvarez',
    'Daniel Okafor',
    'Megan Clark',
    'Noah Morgan',
  ];
  const quotes = [
    'The lab exercises are the best part. I rebuilt our revenue dashboard the week after finishing.',
    'Clear, practical and short. Every lesson ends with something you can use on Monday.',
    'I liked the critique sessions; seeing before and after made the principles stick.',
    'Dense in a good way. I paused a lot and took notes.',
    'Would love more on mobile layouts, but everything else was excellent.',
  ];
  return people.slice(0, 4).map((name, i) => ({
    id: `${courseId}-r${i}`,
    author: name,
    rating: rand() > 0.25 ? 5 : 4,
    body: quotes[(i + Math.floor(rand() * 5)) % quotes.length]!,
    createdAt: new Date(Date.now() - (i + 1) * 6 * 86_400_000).toISOString(),
  }));
};

const completed = new Map<string, Set<string>>();

function lessonsOf(course: CourseSeed) {
  const done = completed.get(course.id);
  const progress = PROGRESS[course.id] ?? 0;
  const flat = course.modules.flatMap(([, lessons]) => lessons);
  const doneCount = Math.round((progress / 100) * flat.length);
  let index = 0;
  return course.modules.map(([title, lessons], m) => ({
    id: `${course.id}-m${m + 1}`,
    title,
    lessons: lessons.map(([lessonTitle, type, durationMin], l) => {
      const id = `${course.id}-m${m + 1}-l${l + 1}`;
      const isDone = index < doneCount || (done?.has(id) ?? false);
      index++;
      return {
        id,
        title: lessonTitle,
        type,
        durationMin,
        completed: isDone,
        preview: m === 0 && l === 0,
      };
    }),
  }));
}

function summary(course: CourseSeed) {
  const rand = seeded(`course:${course.id}`);
  const instructor = INSTRUCTORS.find((i) => i.id === course.instructorId)!;
  const modules = lessonsOf(course);
  const lessons = modules.flatMap((m) => m.lessons);
  const done = lessons.filter((l) => l.completed).length;
  return {
    id: course.id,
    title: course.title,
    subtitle: course.subtitle,
    category: course.category,
    level: course.level,
    color: course.color,
    tags: course.tags,
    price: course.price,
    durationMin: lessons.reduce((sum, l) => sum + l.durationMin, 0),
    lessonCount: lessons.length,
    rating: Math.round((4.5 + rand() * 0.45) * 10) / 10,
    reviewCount: Math.round(180 + rand() * 2_400),
    students: Math.round(1_200 + rand() * 24_000),
    instructor: { id: instructor.id, name: instructor.name, title: instructor.title },
    enrolled: course.id in PROGRESS || enrolled.has(course.id),
    progress: lessons.length ? Math.round((done / lessons.length) * 100) : 0,
    updatedAt: new Date(Date.now() - Math.round(rand() * 90) * 86_400_000).toISOString(),
  };
}

const enrolled = new Set<string>();

const dayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const notes = new Map<
  string,
  Array<{ id: string; atSec: number; body: string; createdAt: string }>
>();
const questions = new Map<
  string,
  Array<{
    id: string;
    author: string;
    body: string;
    votes: number;
    answers: number;
    createdAt: string;
  }>
>();

/* -------------------------------------------------------------------------- */
/*  Students, assignments and grading                                         */
/* -------------------------------------------------------------------------- */

const ME = 'Demo User';
const daysSince = (iso: string) => Math.round((Date.now() - new Date(iso).getTime()) / DAY);

const STUDENTS = (() => {
  const rand = seeded('academy:students');
  return Array.from({ length: 36 }, (_, i) => {
    const name = `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[(i * 7) % LAST_NAMES.length]}`;
    const course = COURSES[i % 5]!;
    const progress = Math.round(rand() * 100);
    const grade = Math.round(55 + rand() * 45);
    const lastActiveDays = Math.round(rand() * 20);
    const status =
      progress > 96 ? 'completed' : lastActiveDays > 12 || grade < 62 ? 'at-risk' : 'on-track';
    return {
      id: `st-${i + 1}`,
      name,
      email: `${name
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .replace(/[^a-z]+/g, '.')}@example.com`,
      courseId: course.id,
      courseTitle: course.title,
      progress: status === 'completed' ? 100 : progress,
      grade,
      lastActive: daysFromNow(-lastActiveDays),
      status,
    };
  });
})();

const ASSIGNMENTS = (
  [
    ['data-intensive-dashboards', 'Dashboard brief for a real stakeholder', -9, 100],
    ['data-intensive-dashboards', 'Redesign a cluttered report', -2, 100],
    ['data-intensive-dashboards', 'Layout critique of a peer dashboard', 5, 50],
    ['sql-for-product-analytics', 'Ten queries on the events table', -14, 50],
    ['sql-for-product-analytics', 'Build a retention triangle', 3, 100],
    ['react-performance', 'Profile and fix the slow render', -4, 100],
    ['react-performance', 'Virtualize the orders table', 9, 100],
    ['metrics-layer', 'Model monthly recurring revenue', -1, 100],
    ['accessible-data-viz', 'Accessibility audit of a dashboard', -6, 80],
    ['accessible-data-viz', 'Text alternatives for four charts', 12, 40],
  ] as const
).map(([courseId, title, dueInDays, points], i) => ({
  id: `as-${i + 1}`,
  courseId,
  title,
  points,
  dueAt: daysFromNow(dueInDays),
}));
type Assignment = (typeof ASSIGNMENTS)[number];

const SUBMISSIONS = ASSIGNMENTS.flatMap((a) => {
  const rand = seeded(`academy:submissions:${a.id}`);
  const due = new Date(a.dueAt).getTime();
  const past = due < Date.now();
  return STUDENTS.filter((s) => s.courseId === a.courseId && rand() < (past ? 0.88 : 0.45)).map(
    (s) => {
      const late = past && rand() < 0.15;
      const at = due + (late ? rand() * 2 : -0.2 - rand() * 4) * DAY;
      const graded = past && rand() < 0.65;
      const ratio = Math.min(1, Math.max(0.3, (s.grade + (rand() - 0.5) * 16) / 100));
      return {
        id: `${a.id}-${s.id}`,
        assignmentId: a.id,
        studentId: s.id,
        studentName: s.name,
        studentEmail: s.email,
        submittedAt: new Date(Math.min(at, Date.now() - 3_600_000)).toISOString(),
        late,
        score: graded ? Math.round(ratio * a.points) : null,
        feedback: graded ? pick(rand, FEEDBACK) : '',
        attachment: {
          name: `${s.email.split('@')[0]}-${a.id}.pdf`,
          size: `${(0.4 + rand() * 3).toFixed(1)} MB`,
        },
      };
    },
  );
});

function assignmentSummary(a: Assignment) {
  const scores = SUBMISSIONS.flatMap((s) =>
    s.assignmentId === a.id && s.score !== null ? [s.score] : [],
  );
  return {
    ...a,
    courseTitle: courseById(a.courseId).title,
    enrolled: STUDENTS.filter((s) => s.courseId === a.courseId).length,
    submitted: SUBMISSIONS.filter((s) => s.assignmentId === a.id).length,
    graded: scores.length,
    averageScore: scores.length
      ? Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length / a.points) * 100)
      : null,
  };
}

function studentProfile(student: (typeof STUDENTS)[number]) {
  const rand = seeded(`academy:student:${student.id}`);
  const extra = COURSES.filter((c) => c.id !== student.courseId && rand() < 0.25).slice(0, 2);
  const enrollments = [
    { course: courseById(student.courseId), ...student },
    ...extra.map((course) => ({
      course,
      progress: rand() < 0.4 ? 100 : Math.round(rand() * 90),
      grade: Math.round(65 + rand() * 33),
      lastActive: daysFromNow(-Math.round(8 + rand() * 40)),
    })),
  ].map(({ course, progress, grade, lastActive }) => ({
    courseId: course.id,
    title: course.title,
    color: course.color,
    category: course.category,
    progress,
    grade,
    lastActive,
  }));

  // 12 weeks Monday → Sunday, current week last. Nothing after the last active day.
  const today = 77 + ((new Date().getDay() + 6) % 7);
  const lastDay = today - daysSince(student.lastActive);
  const days = Array.from({ length: 84 }, (_, i) => {
    if (i > lastDay) return 0;
    if (i === lastDay) return Math.round(15 + rand() * 40);
    return rand() < (i % 7 >= 5 ? 0.55 : 0.2) ? 0 : Math.round(10 + rand() * 60);
  });
  let streakDays = 0;
  for (let i = today; i >= 0 && days[i]; i--) streakDays++;
  let longestStreak = 0;
  days.reduce((run, m) => {
    const next = m ? run + 1 : 0;
    longestStreak = Math.max(longestStreak, next);
    return next;
  }, 0);

  return {
    student,
    joinedAt: daysFromNow(-Math.round(120 + rand() * 400)),
    enrollments,
    grades: SUBMISSIONS.filter((s) => s.studentId === student.id).map((s) => {
      const a = ASSIGNMENTS.find((x) => x.id === s.assignmentId)!;
      return {
        assignmentId: a.id,
        title: a.title,
        courseTitle: courseById(a.courseId).title,
        points: a.points,
        score: s.score,
        submittedAt: s.submittedAt,
      };
    }),
    activity: Array.from({ length: 7 }, (_, d) =>
      Array.from({ length: 12 }, (_, w) => days[w * 7 + d]!),
    ),
    streakDays,
    longestStreak,
    totalMinutes: days.reduce((sum, m) => sum + m, 0),
    certificates: enrollments
      .filter((e) => e.progress === 100)
      .map((e) => ({
        id: `${student.id}-${e.courseId}`,
        courseTitle: e.title,
        issuedAt: e.lastActive,
        credentialId: `ORB-${e.courseId.slice(0, 3).toUpperCase()}-2026-${Math.floor(10_000 + rand() * 89_999)}`,
        grade: e.grade,
      })),
  };
}

/* -------------------------------------------------------------------------- */
/*  Quizzes                                                                   */
/* -------------------------------------------------------------------------- */

const quizOf = (course: CourseSeed) =>
  QUIZ_BANK[course.category].map(([prompt, options, answer, explanation], i) => {
    const id = `${course.id}-q${i + 1}`;
    return {
      id,
      prompt,
      options: options.map((text, o) => ({ id: `${id}-o${o + 1}`, text })),
      answerId: `${id}-o${answer + 1}`,
      explanation,
    };
  });

const PASSING_SCORE = 70;
const quizScores = new Map<string, number[]>();

/* -------------------------------------------------------------------------- */
/*  Discussions                                                               */
/* -------------------------------------------------------------------------- */

type Reply = {
  id: string;
  author: string;
  role: 'student' | 'instructor';
  body: string;
  createdAt: string;
  accepted: boolean;
};

const THREADS = THREAD_SEEDS.map(([courseId, title, body], i) => {
  const rand = seeded(`academy:thread:${i}`);
  const createdAgo = 0.3 + i * 1.6 + rand();
  const replies: Reply[] = Array.from({ length: Math.floor(rand() * 4) }, (_, r) => ({
    id: `th-${i + 1}-r${r + 1}`,
    author: pick(rand, STUDENTS).name,
    role: 'student',
    body: pick(rand, STUDENT_REPLIES),
    createdAt: daysFromNow(-createdAgo * (1 - (r + 1) / 5)),
    accepted: false,
  }));
  if (rand() < 0.6)
    replies.unshift({
      id: `th-${i + 1}-answer`,
      author: INSTRUCTORS.find((x) => x.id === courseById(courseId).instructorId)!.name,
      role: 'instructor',
      body: pick(rand, INSTRUCTOR_REPLIES),
      createdAt: daysFromNow(-createdAgo * 0.9),
      accepted: true,
    });
  return {
    id: `th-${i + 1}`,
    courseId,
    title,
    body,
    author: i % 4 === 1 ? ME : pick(rand, STUDENTS).name,
    createdAt: daysFromNow(-createdAgo),
    votes: Math.round(rand() * 30),
    replies,
  };
});

const threadSummary = ({ replies, ...thread }: (typeof THREADS)[number]) => ({
  ...thread,
  courseTitle: courseById(thread.courseId).title,
  replyCount: replies.length,
  lastActivityAt: replies.reduce(
    (latest, r) => (r.createdAt > latest ? r.createdAt : latest),
    thread.createdAt,
  ),
  answered: replies.some((r) => r.accepted),
  mine: thread.author === ME,
});

/* -------------------------------------------------------------------------- */
/*  Handlers                                                                  */
/* -------------------------------------------------------------------------- */

export const academyHandlers: HttpHandler[] = [
  http.get(`${env.API_URL}/academy/home`, async ({ request }) => {
    const error = await authed(request);
    if (error) return error;
    const rand = seeded('academy:home');
    const inProgress = COURSES.filter(
      (c) => (PROGRESS[c.id] ?? 0) < 100 && (c.id in PROGRESS || enrolled.has(c.id)),
    );
    const today = dayStart();

    return HttpResponse.json({
      learner: { streakDays: 12, weeklyGoalMin: 180, weeklyDoneMin: 134, xp: 4_820, level: 7 },
      continueLearning: inProgress.map((course) => {
        const s = summary(course);
        const next = lessonsOf(course)
          .flatMap((m) => m.lessons)
          .find((l) => !l.completed);
        return {
          courseId: course.id,
          title: course.title,
          color: course.color,
          category: course.category,
          progress: s.progress,
          nextLessonId: next?.id ?? null,
          nextLessonTitle: next?.title ?? null,
          minutesLeft: lessonsOf(course)
            .flatMap((m) => m.lessons)
            .filter((l) => !l.completed)
            .reduce((sum, l) => sum + l.durationMin, 0),
        };
      }),
      // 12 weeks × 7 days of minutes learned (rows = weekdays).
      activity: Array.from({ length: 7 }, (_, d) =>
        Array.from({ length: 12 }, (_, w) => {
          const weekend = d >= 5 ? 0.45 : 1;
          const ramp = 0.5 + w / 22;
          return rand() < 0.18 ? 0 : Math.round(rand() * 55 * weekend * ramp);
        }),
      ),
      upcoming: [
        {
          id: 's1',
          title: 'Live critique: your dashboard briefs',
          instructor: 'Inês Duarte',
          kind: 'live',
          startsAt: new Date(today.getTime() + 86_400_000 + 17 * 3_600_000).toISOString(),
          durationMin: 60,
        },
        {
          id: 's2',
          title: 'Office hours: window functions',
          instructor: 'Amara Okafor',
          kind: 'office-hours',
          startsAt: new Date(today.getTime() + 2 * 86_400_000 + 15 * 3_600_000).toISOString(),
          durationMin: 45,
        },
        {
          id: 's3',
          title: 'Workshop: profiling a slow chart',
          instructor: 'Kenji Watanabe',
          kind: 'workshop',
          startsAt: new Date(today.getTime() + 4 * 86_400_000 + 16 * 3_600_000).toISOString(),
          durationMin: 90,
        },
      ],
      achievements: [
        { id: 'a1', name: 'First query', description: 'Ran your first SQL lab', progress: 100 },
        { id: 'a2', name: 'Two-week streak', description: 'Learn 14 days in a row', progress: 86 },
        { id: 'a3', name: 'Chart critic', description: 'Complete 5 critique labs', progress: 60 },
        { id: 'a4', name: 'Certified analyst', description: 'Earn 3 certificates', progress: 33 },
      ],
      recommended: COURSES.filter((c) => !(c.id in PROGRESS))
        .slice(0, 3)
        .map(summary),
    });
  }),

  http.get(`${env.API_URL}/academy/courses`, async ({ request }) => {
    const error = await authed(request);
    if (error) return error;
    const params = new URL(request.url).searchParams;
    const q = (params.get('q') ?? '').trim().toLowerCase();
    const levels = params.get('levels')?.split(',').filter(Boolean) ?? [];
    const categories = params.get('categories')?.split(',').filter(Boolean) ?? [];
    const price = params.get('price') ?? 'any';
    const sort = params.get('sort') ?? 'popular';

    const all = COURSES.map(summary);
    const matchesText = (c: (typeof all)[number]) =>
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.tags.some((tag) => tag.toLowerCase().includes(q)) ||
      c.instructor.name.toLowerCase().includes(q);
    const matchesPrice = (c: (typeof all)[number]) =>
      price === 'any' || (price === 'free' ? c.price === 0 : c.price > 0);
    const base = all.filter((c) => matchesText(c) && matchesPrice(c));
    const filtered = base.filter(
      (c) =>
        (!levels.length || levels.includes(c.level)) &&
        (!categories.length || categories.includes(c.category)),
    );
    const sorted = [...filtered].sort((a, b) =>
      sort === 'rating'
        ? b.rating - a.rating
        : sort === 'newest'
          ? b.updatedAt.localeCompare(a.updatedAt)
          : sort === 'shortest'
            ? a.durationMin - b.durationMin
            : b.students - a.students,
    );
    const count = <K extends 'level' | 'category'>(key: K, value: string) =>
      base.filter(
        (c) =>
          c[key] === value &&
          (key === 'level'
            ? !categories.length || categories.includes(c.category)
            : !levels.length || levels.includes(c.level)),
      ).length;

    return HttpResponse.json({
      courses: sorted,
      facets: {
        levels: (['beginner', 'intermediate', 'advanced'] as const).map((value) => ({
          value,
          count: count('level', value),
        })),
        categories: (['data', 'design', 'engineering', 'product', 'leadership'] as const).map(
          (value) => ({ value, count: count('category', value) }),
        ),
      },
    });
  }),

  http.get(`${env.API_URL}/academy/courses/:courseId`, async ({ request, params }) => {
    const error = await authed(request);
    if (error) return error;
    const course = COURSES.find((c) => c.id === params.courseId);
    if (!course) return HttpResponse.json({ message: 'Course not found' }, { status: 404 });
    const instructor = INSTRUCTORS.find((i) => i.id === course.instructorId)!;
    return HttpResponse.json({
      ...summary(course),
      modules: lessonsOf(course),
      instructor,
      outcomes: [
        `Apply ${course.tags[0]} techniques to your own work`,
        'Critique existing work with a shared vocabulary',
        'Ship a portfolio piece reviewed by the instructor',
        'Explain trade-offs to stakeholders with confidence',
      ],
      requirements:
        course.level === 'beginner'
          ? ['No prior experience needed']
          : ['Comfortable with the basics of the topic', 'A laptop with a modern browser'],
      reviews: reviews(course.id),
    });
  }),

  http.post(`${env.API_URL}/academy/courses/:courseId/enroll`, async ({ request, params }) => {
    const error = await authed(request);
    if (error) return error;
    const course = COURSES.find((c) => c.id === params.courseId);
    if (!course) return HttpResponse.json({ message: 'Course not found' }, { status: 404 });
    enrolled.add(course.id);
    return HttpResponse.json(summary(course));
  }),

  http.get(
    `${env.API_URL}/academy/courses/:courseId/lessons/:lessonId`,
    async ({ request, params }) => {
      const error = await authed(request);
      if (error) return error;
      const course = COURSES.find((c) => c.id === params.courseId);
      const modules = course ? lessonsOf(course) : [];
      const lesson = modules.flatMap((m) => m.lessons).find((l) => l.id === params.lessonId);
      if (!course || !lesson)
        return HttpResponse.json({ message: 'Lesson not found' }, { status: 404 });
      const instructor = INSTRUCTORS.find((i) => i.id === course.instructorId)!;
      const transcript = [
        'Welcome back. In this lesson we will work through one concrete example from start to finish.',
        `The topic is “${lesson.title}”, and by the end you should be able to apply it to your own project.`,
        'Let us start with the question we are trying to answer, because everything else follows from it.',
        'Notice how the first version looks reasonable but hides the most important number.',
        'Now compare it with the second version. Same data, very different decision.',
        'Before the next lesson, try this on one screen you own and write down what changed.',
      ];
      return HttpResponse.json({
        course: { id: course.id, title: course.title, instructor: instructor.name },
        lesson: {
          ...lesson,
          transcript: transcript.map((text, i) => ({ atSec: i * 47, text })),
          resources: [
            { name: 'Slides (PDF)', size: '2.4 MB' },
            { name: 'Exercise dataset (CSV)', size: '840 KB' },
          ],
        },
        modules,
        notes: notes.get(lesson.id) ?? [],
        questions: questions.get(lesson.id) ?? [
          {
            id: 'q1',
            author: 'Lucas Meyer',
            body: 'How would you handle this when the metric definition changes halfway through the quarter?',
            votes: 14,
            answers: 3,
            createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
          },
          {
            id: 'q2',
            author: 'Priya Raman',
            body: 'Is there a rule of thumb for how many charts fit on one screen?',
            votes: 9,
            answers: 1,
            createdAt: new Date(Date.now() - 5 * 86_400_000).toISOString(),
          },
        ],
      });
    },
  ),

  http.post(`${env.API_URL}/academy/lessons/:lessonId/complete`, async ({ request, params }) => {
    const error = await authed(request);
    if (error) return error;
    const courseId = COURSES.find((c) => String(params.lessonId).startsWith(c.id))?.id;
    if (!courseId) return HttpResponse.json({ message: 'Lesson not found' }, { status: 404 });
    const set = completed.get(courseId) ?? new Set<string>();
    set.add(String(params.lessonId));
    completed.set(courseId, set);
    return HttpResponse.json({ ok: true });
  }),

  http.post<{ lessonId: string }, { atSec: number; body: string }>(
    `${env.API_URL}/academy/lessons/:lessonId/notes`,
    async ({ request, params }) => {
      const error = await authed(request);
      if (error) return error;
      const body = await request.json();
      const note = {
        id: `n-${Date.now()}`,
        atSec: body.atSec,
        body: body.body,
        createdAt: new Date().toISOString(),
      };
      notes.set(params.lessonId, [note, ...(notes.get(params.lessonId) ?? [])]);
      return HttpResponse.json(note, { status: 201 });
    },
  ),

  http.post<{ lessonId: string }, { body: string }>(
    `${env.API_URL}/academy/lessons/:lessonId/questions`,
    async ({ request, params }) => {
      const error = await authed(request);
      if (error) return error;
      const body = await request.json();
      const question = {
        id: `q-${Date.now()}`,
        author: 'Demo User',
        body: body.body,
        votes: 0,
        answers: 0,
        createdAt: new Date().toISOString(),
      };
      const existing = questions.get(params.lessonId) ?? [];
      questions.set(params.lessonId, [question, ...existing]);
      return HttpResponse.json(question, { status: 201 });
    },
  ),

  http.get(`${env.API_URL}/academy/schedule`, async ({ request }) => {
    const error = await authed(request);
    if (error) return error;
    const week = Number(new URL(request.url).searchParams.get('week') ?? 0);
    const rand = seeded(`academy:schedule:${week}`);
    const today = dayStart();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) + week * 7);
    const slots: Array<
      [
        number,
        number,
        number,
        string,
        string,
        string,
        'live' | 'office-hours' | 'workshop' | 'exam',
      ]
    > = [
      [0, 9, 90, 'Data-Intensive Dashboards: critique', 'Inês Duarte', 'Room A · Lisbon', 'live'],
      [0, 14, 60, 'SQL office hours', 'Amara Okafor', 'Online', 'office-hours'],
      [1, 10, 120, 'React performance workshop', 'Kenji Watanabe', 'Online', 'workshop'],
      [1, 16, 45, 'Experiment design Q&A', 'Hannah Morgan', 'Online', 'office-hours'],
      [2, 9, 60, 'Metrics layer: modelling MRR', 'Samuel Adeyemi', 'Room B · Toronto', 'live'],
      [2, 13, 90, 'Accessible charts lab', 'Inês Duarte', 'Online', 'workshop'],
      [3, 11, 60, 'Postgres RLS deep dive', 'Tomás Reyes', 'Online', 'live'],
      [3, 15, 120, 'Mid-term: SQL for Product Analytics', 'Amara Okafor', 'Exam hall', 'exam'],
      [4, 10, 60, 'Leading data teams roundtable', 'Samuel Adeyemi', 'Online', 'live'],
      [4, 14, 45, 'Office hours: dashboards', 'Inês Duarte', 'Online', 'office-hours'],
    ];
    return HttpResponse.json({
      weekStart: monday.toISOString(),
      sessions: slots.map(([day, hour, durationMin, title, instructor, location, kind], i) => {
        const start = new Date(monday);
        start.setDate(monday.getDate() + day);
        start.setHours(hour + (rand() > 0.8 ? 1 : 0), rand() > 0.6 ? 30 : 0, 0, 0);
        return {
          id: `w${week}-s${i}`,
          title,
          instructor,
          location,
          kind,
          startsAt: start.toISOString(),
          durationMin,
          attendees: Math.round(12 + rand() * 80),
        };
      }),
    });
  }),

  http.get(`${env.API_URL}/academy/students`, async ({ request }) => {
    const error = await authed(request);
    if (error) return error;
    return HttpResponse.json(STUDENTS);
  }),

  http.get(`${env.API_URL}/academy/certificates`, async ({ request }) => {
    const error = await authed(request);
    if (error) return error;
    return HttpResponse.json([
      {
        id: 'cert-1',
        courseTitle: 'SQL for Product Analytics',
        instructor: 'Amara Okafor',
        issuedAt: '2026-10-14T00:00:00Z',
        credentialId: 'ORB-SQL-2026-48213',
        hours: 9,
        grade: 94,
      },
      {
        id: 'cert-2',
        courseTitle: 'Accessible Data Visualization',
        instructor: 'Inês Duarte',
        issuedAt: '2026-08-02T00:00:00Z',
        credentialId: 'ORB-A11Y-2026-11902',
        hours: 6,
        grade: 88,
      },
      {
        id: 'cert-3',
        courseTitle: 'Python for Analysts',
        instructor: 'Amara Okafor',
        issuedAt: '2026-05-21T00:00:00Z',
        credentialId: 'ORB-PY-2026-07734',
        hours: 8,
        grade: 91,
      },
    ]);
  }),

  http.get(`${env.API_URL}/academy/instructors`, async ({ request }) => {
    const error = await authed(request);
    if (error) return error;
    return HttpResponse.json(
      INSTRUCTORS.map((instructor) => ({
        ...instructor,
        courses: COURSES.filter((c) => c.instructorId === instructor.id).map((c) => ({
          id: c.id,
          title: c.title,
        })),
      })),
    );
  }),

  http.get(`${env.API_URL}/academy/students/:studentId`, async ({ request, params }) => {
    const error = await authed(request);
    if (error) return error;
    const student = STUDENTS.find((s) => s.id === params.studentId);
    if (!student) return HttpResponse.json({ message: 'Student not found' }, { status: 404 });
    return HttpResponse.json(studentProfile(student));
  }),

  http.get(`${env.API_URL}/academy/assignments`, async ({ request }) => {
    const error = await authed(request);
    if (error) return error;
    return HttpResponse.json(ASSIGNMENTS.map(assignmentSummary));
  }),

  http.get(`${env.API_URL}/academy/assignments/:assignmentId`, async ({ request, params }) => {
    const error = await authed(request);
    if (error) return error;
    const assignment = ASSIGNMENTS.find((a) => a.id === params.assignmentId);
    if (!assignment) return HttpResponse.json({ message: 'Assignment not found' }, { status: 404 });
    return HttpResponse.json({
      ...assignmentSummary(assignment),
      brief: `Submit a PDF or a link to your work for “${assignment.title}”. Explain the decisions you made in under 500 words and reference at least one lesson from the course.`,
      submissions: SUBMISSIONS.filter((s) => s.assignmentId === assignment.id),
    });
  }),

  http.patch<{ submissionId: string }, { score: number; feedback: string }>(
    `${env.API_URL}/academy/submissions/:submissionId`,
    async ({ request, params }) => {
      const error = await authed(request);
      if (error) return error;
      const submission = SUBMISSIONS.find((s) => s.id === params.submissionId);
      if (!submission)
        return HttpResponse.json({ message: 'Submission not found' }, { status: 404 });
      const { score, feedback } = await request.json();
      const { points } = ASSIGNMENTS.find((a) => a.id === submission.assignmentId)!;
      if (!Number.isFinite(score) || score < 0 || score > points)
        return HttpResponse.json({ message: `Score must be 0–${points}` }, { status: 422 });
      Object.assign(submission, { score, feedback });
      return HttpResponse.json(submission);
    },
  ),

  http.get(`${env.API_URL}/academy/courses/:courseId/quiz`, async ({ request, params }) => {
    const error = await authed(request);
    if (error) return error;
    const course = COURSES.find((c) => c.id === params.courseId);
    if (!course) return HttpResponse.json({ message: 'Course not found' }, { status: 404 });
    const questions = quizOf(course);
    const scores = quizScores.get(course.id) ?? [];
    return HttpResponse.json({
      courseId: course.id,
      courseTitle: course.title,
      timeLimitSec: questions.length * 90,
      passingScore: PASSING_SCORE,
      attempts: scores.length,
      bestScore: scores.length ? Math.max(...scores) : null,
      questions: questions.map(({ answerId: _answer, explanation: _explanation, ...q }) => q),
    });
  }),

  http.post<{ courseId: string }, { answers: Record<string, string> }>(
    `${env.API_URL}/academy/courses/:courseId/quiz/attempts`,
    async ({ request, params }) => {
      const error = await authed(request);
      if (error) return error;
      const course = COURSES.find((c) => c.id === params.courseId);
      if (!course) return HttpResponse.json({ message: 'Course not found' }, { status: 404 });
      const { answers } = await request.json();
      const review = quizOf(course).map((q) => ({
        questionId: q.id,
        selectedId: answers[q.id] ?? null,
        correctId: q.answerId,
        explanation: q.explanation,
      }));
      const correct = review.filter((r) => r.selectedId === r.correctId).length;
      const score = Math.round((correct / review.length) * 100);
      quizScores.set(course.id, [...(quizScores.get(course.id) ?? []), score]);
      return HttpResponse.json({
        score,
        correct,
        total: review.length,
        passed: score >= PASSING_SCORE,
        review,
      });
    },
  ),

  http.get(`${env.API_URL}/academy/threads`, async ({ request }) => {
    const error = await authed(request);
    if (error) return error;
    const params = new URL(request.url).searchParams;
    const filter = params.get('filter') ?? 'all';
    const courseId = params.get('courseId');
    const q = (params.get('q') ?? '').trim().toLowerCase();
    const inScope = THREADS.map(threadSummary).filter(
      (t) =>
        (!courseId || t.courseId === courseId) &&
        (!q || t.title.toLowerCase().includes(q) || t.body.toLowerCase().includes(q)),
    );
    return HttpResponse.json({
      threads: inScope
        .filter((t) => (filter === 'unanswered' ? !t.answered : filter === 'mine' ? t.mine : true))
        .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt)),
      counts: {
        all: inScope.length,
        unanswered: inScope.filter((t) => !t.answered).length,
        mine: inScope.filter((t) => t.mine).length,
      },
      courses: [...new Set(THREADS.map((t) => t.courseId))].map((id) => ({
        id,
        title: courseById(id).title,
      })),
    });
  }),

  http.get(`${env.API_URL}/academy/threads/:threadId`, async ({ request, params }) => {
    const error = await authed(request);
    if (error) return error;
    const thread = THREADS.find((t) => t.id === params.threadId);
    if (!thread) return HttpResponse.json({ message: 'Thread not found' }, { status: 404 });
    return HttpResponse.json({ ...threadSummary(thread), replies: thread.replies });
  }),

  http.post<{ threadId: string }, { body: string }>(
    `${env.API_URL}/academy/threads/:threadId/replies`,
    async ({ request, params }) => {
      const error = await authed(request);
      if (error) return error;
      const thread = THREADS.find((t) => t.id === params.threadId);
      if (!thread) return HttpResponse.json({ message: 'Thread not found' }, { status: 404 });
      const { body } = await request.json();
      const reply: Reply = {
        id: `${thread.id}-r${Date.now()}`,
        author: ME,
        role: 'student',
        body,
        createdAt: new Date().toISOString(),
        accepted: false,
      };
      thread.replies.push(reply);
      return HttpResponse.json(reply, { status: 201 });
    },
  ),

  ...academyBuilderHandlers,
  ...academyLiveHandlers,
  ...academyReportHandlers,
];
