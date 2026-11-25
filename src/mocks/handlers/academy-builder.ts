import { http, HttpResponse } from 'msw';

import { env } from '@/core/config/env';

import { authed, COURSES, daysFromNow, type LessonType } from './academy-seed';

type Lesson = {
  id: string;
  title: string;
  type: LessonType;
  durationMin: number;
  preview: boolean;
  summary: string;
};
type Section = { id: string; title: string; lessons: Lesson[] };

const SUMMARIES: Record<LessonType, string> = {
  video: 'A short walkthrough with a worked example you can pause and replay.',
  reading: 'A focused article with diagrams and a checklist to keep.',
  quiz: 'A few questions to check the key ideas before moving on.',
  lab: 'A hands-on exercise on a real dataset, reviewed against a rubric.',
};

/** Draft curricula edited in the builder, created from the course seed on first open. */
const drafts = new Map<
  string,
  { courseId: string; published: boolean; updatedAt: string; sections: Section[] }
>();

function draftOf(courseId: string) {
  const course = COURSES.find((c) => c.id === courseId);
  if (!course) return null;
  if (!drafts.has(courseId))
    drafts.set(courseId, {
      courseId,
      published: true,
      updatedAt: daysFromNow(-3),
      sections: course.modules.map(([title, lessons], m) => ({
        id: `${courseId}-m${m + 1}`,
        title,
        lessons: lessons.map(([lessonTitle, type, durationMin], l) => ({
          id: `${courseId}-m${m + 1}-l${l + 1}`,
          title: lessonTitle,
          type,
          durationMin,
          preview: m === 0 && l === 0,
          summary: SUMMARIES[type],
        })),
      })),
    });
  const draft = drafts.get(courseId)!;
  const { title, color, category } = course;
  return { draft, response: () => HttpResponse.json({ ...draft, title, color, category }) };
}

const notFound = () => HttpResponse.json({ message: 'Course not found' }, { status: 404 });
const touch = (draft: { updatedAt: string }) => (draft.updatedAt = new Date().toISOString());

export const academyBuilderHandlers = [
  http.get(`${env.API_URL}/academy/courses/:courseId/builder`, async ({ request, params }) => {
    const error = await authed(request);
    if (error) return error;
    return draftOf(String(params.courseId))?.response() ?? notFound();
  }),

  http.patch<{ courseId: string }, { published: boolean }>(
    `${env.API_URL}/academy/courses/:courseId/builder`,
    async ({ request, params }) => {
      const error = await authed(request);
      if (error) return error;
      const found = draftOf(params.courseId);
      if (!found) return notFound();
      found.draft.published = (await request.json()).published;
      touch(found.draft);
      return found.response();
    },
  ),

  http.put<{ courseId: string }, { sections: Section[] }>(
    `${env.API_URL}/academy/courses/:courseId/builder/sections`,
    async ({ request, params }) => {
      const error = await authed(request);
      if (error) return error;
      const found = draftOf(params.courseId);
      if (!found) return notFound();
      found.draft.sections = (await request.json()).sections;
      touch(found.draft);
      return found.response();
    },
  ),

  http.put<{ courseId: string; lessonId: string }, Omit<Lesson, 'id'> & { sectionId: string }>(
    `${env.API_URL}/academy/courses/:courseId/builder/lessons/:lessonId`,
    async ({ request, params }) => {
      const error = await authed(request);
      if (error) return error;
      const found = draftOf(params.courseId);
      if (!found) return notFound();
      const { sectionId, ...fields } = await request.json();
      const target = found.draft.sections.find((s) => s.id === sectionId);
      if (!target) return HttpResponse.json({ message: 'Section not found' }, { status: 422 });
      const lesson = { ...fields, id: params.lessonId };
      const current = target.lessons.findIndex((l) => l.id === lesson.id);
      if (current >= 0) target.lessons[current] = lesson;
      else {
        for (const s of found.draft.sections)
          s.lessons = s.lessons.filter((l) => l.id !== lesson.id);
        target.lessons.push(lesson);
      }
      touch(found.draft);
      return found.response();
    },
  ),
];
