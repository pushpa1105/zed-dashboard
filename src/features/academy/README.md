# Academy workspace

A learning management system (LMS) dashboard: a course catalog and lesson player for learners,
plus students, assignments, grading and discussions for instructors. It lives at `/academy`
and uses the top navigation layout.

Everything is self-contained in `src/features/academy`. Data comes from the mock API in
`src/mocks/handlers/academy.ts` (seeded, deterministic, with in-memory mutations).

## Pages

| Route                                          | Page                | What it shows                                                                                  |
| ---------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------- |
| `/academy`                                     | `home-page`         | Learner dashboard: weekly goal, streak, continue learning, activity heatmap, upcoming sessions |
| `/academy/courses`                             | `catalog-page`      | Catalog with search, level/topic/price facets and sorting                                      |
| `/academy/courses/:courseId`                   | `course-page`       | Course landing: outcomes, curriculum, instructor, reviews, enrolment, link to the quiz         |
| `/academy/courses/:courseId/lessons/:lessonId` | `lesson-page`       | Lesson player with transcript, timestamped notes, Q&A and resources                            |
| `/academy/courses/:courseId/quiz`              | `quiz-page`         | Timed multiple-choice quiz: navigator, progress, auto-submit, score and answer review          |
| `/academy/courses/:courseId/builder`           | `builder-page`      | Curriculum editor: sections, drag-to-reorder lessons, add/edit lesson dialog, publish toggle   |
| `/academy/schedule`                            | `schedule-page`     | Weekly calendar of live classes, workshops, office hours and exams                             |
| `/academy/live?status=`                        | `live-page`         | Upcoming/past/reserved live sessions, join or reserve, replays, attendance chart, scheduling   |
| `/academy/discussions`                         | `discussions-page`  | Course forum with All / Unanswered / My threads filters, course filter and search              |
| `/academy/discussions/:threadId`               | `thread-page`       | Thread with instructor answer, replies and a reply form                                        |
| `/academy/students`                            | `students-page`     | Enrolments table, status filters, grade distribution, at-risk nudge                            |
| `/academy/students/:studentId`                 | `student-page`      | Student profile: courses and progress, activity heatmap and streak, grades, certificates       |
| `/academy/assignments`                         | `assignments-page`  | Assignments with due dates, submission and grading progress, status filters                    |
| `/academy/assignments/:assignmentId`           | `assignment-page`   | Grading view: brief, submissions table, score and feedback panel with "save and next"          |
| `/academy/instructors`                         | `instructors-page`  | Instructor directory                                                                           |
| `/academy/certificates`                        | `certificates-page` | Earned certificates with a printable preview                                                   |
| `/academy/reports`                             | `reports-page`      | Enrolments, completions and revenue over time, course leaderboard, drop-off by lesson, CSV     |

Detail pages are reached from their parent: course → quiz and (for admins) builder, students → profile, assignments →
grading, discussions → thread.

## API (mock) and models

Schemas live in `model/academy.ts` (Zod); requests, query keys, queries and mutations in
`api/academy-api.ts`. The instructor tools (builder, live sessions, reports) use `model/teaching.ts`
and `api/teaching-api.ts`. Every response is validated against its schema.

| Method  | Endpoint                                   | Schema / hook                                      |
| ------- | ------------------------------------------ | -------------------------------------------------- |
| `GET`   | `/academy/home`                            | `homeSchema` · `useAcademyHome`                    |
| `GET`   | `/academy/courses`                         | `catalogSchema` · `useCatalog`                     |
| `GET`   | `/academy/courses/:courseId`               | `courseDetailSchema` · `useCourse`                 |
| `POST`  | `/academy/courses/:courseId/enroll`        | `courseSummarySchema` · `useEnroll`                |
| `GET`   | `/academy/courses/:courseId/lessons/:id`   | `lessonPageSchema` · `useLesson`                   |
| `POST`  | `/academy/lessons/:lessonId/complete`      | `useCompleteLesson`                                |
| `POST`  | `/academy/lessons/:lessonId/notes`         | `noteSchema` · `useAddNote`                        |
| `POST`  | `/academy/lessons/:lessonId/questions`     | `questionSchema` · `useAsk`                        |
| `GET`   | `/academy/courses/:courseId/quiz`          | `quizSchema` · `useQuiz` (answers are not sent)    |
| `POST`  | `/academy/courses/:courseId/quiz/attempts` | `quizResultSchema` · `useSubmitQuiz`               |
| `GET`   | `/academy/schedule?week=`                  | `scheduleSchema` · `useSchedule`                   |
| `GET`   | `/academy/students`                        | `studentSchema[]` · `useStudents`                  |
| `GET`   | `/academy/students/:studentId`             | `studentProfileSchema` · `useStudentProfile`       |
| `GET`   | `/academy/assignments`                     | `assignmentSchema[]` · `useAssignments`            |
| `GET`   | `/academy/assignments/:assignmentId`       | `assignmentDetailSchema` · `useAssignment`         |
| `PATCH` | `/academy/submissions/:submissionId`       | `submissionSchema` · `useGradeSubmission`          |
| `GET`   | `/academy/threads?filter=&courseId=&q=`    | `threadListSchema` · `useThreads`                  |
| `GET`   | `/academy/threads/:threadId`               | `threadDetailSchema` · `useThread`                 |
| `POST`  | `/academy/threads/:threadId/replies`       | `replySchema` · `useReply`                         |
| `GET`   | `/academy/certificates`                    | `certificateSchema[]` · `useCertificates`          |
| `GET`   | `/academy/instructors`                     | `instructorWithCoursesSchema[]` · `useInstructors` |
| `GET`   | `/academy/courses/:courseId/builder`       | `builderSchema` · `useBuilder`                     |
| `PATCH` | `/academy/courses/:courseId/builder`       | `builderSchema` · `usePublishCourse`               |
| `PUT`   | `/academy/courses/:id/builder/sections`    | `builderSchema` · `useSaveSections` (optimistic)   |
| `PUT`   | `/academy/courses/:id/builder/lessons/:id` | `builderSchema` · `useSaveLesson` (upsert)         |
| `GET`   | `/academy/live`                            | `liveSessionSchema[]` · `useLiveSessions`          |
| `POST`  | `/academy/live`                            | `useScheduleLive`                                  |
| `PUT`   | `/academy/live/:id/registration`           | `liveSessionSchema` · `useRegisterLive`            |
| `GET`   | `/academy/reports?range=30d                | 90d                                                | 12m` | `reportsSchema` · `useReports` |

Mutations declare `meta: { invalidates, successMessage }`; the app's query client refetches the
listed keys and shows the toast. Courses, instructors and the seeded random generator are in
`src/mocks/handlers/academy-seed.ts`; static copy (quiz questions, forum threads, feedback) in
`academy-content.ts`; the builder, live sessions and reports endpoints in `academy-builder.ts`,
`academy-live.ts` and `academy-reports.ts`.

## Components

- `QueryState`: error with retry, skeleton while loading, then renders the data.
- `FilterTabs`: pill filters with counts that scroll sideways on small screens.
- `GradingPanel`: score + feedback form for one submission.
- `CurriculumSection` / `LessonDialog`: one builder section with sortable lessons, and the
  add/edit lesson form.
- `LiveSessionsTable`, `LiveAction` (join / reserve / cancel), `LiveSessionSheet` (details and
  replay), `ScheduleLiveDialog`.
- `CourseLeaderboard` and `DropoffChart` for the reports page.
- `QuizRunner` / `QuizResult`: the quiz flow (timer, navigator) and the scored review.
- `LessonPlayer`: video player stand-in with real controls (play, seek, speed, captions).
- `CourseCover`, `CourseCard`, `AssignmentStatusTag`, `StudentStatusBadge`, `LessonTypeIcon`.

All colors come from theme tokens, so the workspace follows light/dark mode and every preset.
Strings are in `i18n/en.json` and `i18n/es.json` (keys must match in both).

## Customizing

**Add a page**

1. Add the route to `routes.ts` (`defineRoute('/academy/…')`).
2. Create `pages/<name>-page.tsx` with a default-export component and, optionally, a `loader`
   that prefetches its query.
3. Register it in `index.ts` under `workspace.routes`, and add a `nav` entry if it should appear
   in the menu.
4. Add its strings to both `i18n/en.json` and `i18n/es.json`.

**Use a real API**

The pages only talk to `api/academy-api.ts`. Set `VITE_APP_API_URL` to your backend and implement
the endpoints above with the same response shapes (the Zod schemas are the contract). Then set
`VITE_APP_ENABLE_API_MOCKING=false`, or remove `academyHandlers` from `src/mocks/handlers/index.ts`. If
your API differs, adapt the functions in `academyApi`; components do not need to change.

**Change the data**

Courses and instructors are seeded in `src/mocks/handlers/academy-seed.ts`, assignments and
students at the top of `academy.ts`; quiz questions and forum threads are in `academy-content.ts`.

## Tests

`__tests__/academy.test.tsx` renders each main page through the full app (router, providers,
mock API): dashboard, catalog filters, course, lesson, assignments and grading, quiz flow,
discussions, student profile, course builder (add a lesson), live sessions and reports.
