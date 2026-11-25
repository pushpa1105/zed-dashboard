# HR workspace

People operations for a growing company: directory and org chart, hiring, onboarding, time and attendance, payroll and benefits, performance, training, engagement surveys and policy documents. It mounts at `/hr`, uses the `rail` shell layout and ships with English and Spanish translations.

Everything runs against a mock API (MSW) with deterministic seeded data. Changes you make (moving candidates, approving requests, ticking tasks) persist in memory until the page reloads.

## Pages

| Route                         | Page         | What it demonstrates                                                                                                                                                                                                     |
| ----------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/hr`                         | Overview     | Hiring dashboard: KPI report with range/compare filters, interviews, openings, headcount, pipeline, onboarding, activity.                                                                                                |
| `/hr/people`                  | Directory    | Searchable, filterable employee list with card and table views.                                                                                                                                                          |
| `/hr/people/:personId`        | Person       | Employee profile with tabs: job, reports, time off balances, documents, reviews, goals.                                                                                                                                  |
| `/hr/org`                     | Org chart    | Zoomable, collapsible reporting tree.                                                                                                                                                                                    |
| `/hr/onboarding`              | Onboarding   | New hires with checklists grouped by phase (before day one, first week, first month), progress bars, task owners, overdue flags. Ticking a task is an optimistic mutation.                                               |
| `/hr/recruitment`             | Open roles   | Job cards with applicant counts; "New job" dialog.                                                                                                                                                                       |
| `/hr/recruitment/:jobId`      | Job pipeline | Drag-and-drop Kanban of candidates by stage. Candidate names link to their profile.                                                                                                                                      |
| `/hr/candidates/:candidateId` | Candidate    | Stage pipeline, résumé summary (experience, education, skills), interview scorecards with per-criterion scores and recommendations, and a move-stage action.                                                             |
| `/hr/time-off`                | Time off     | Team calendar for the month and an approval queue.                                                                                                                                                                       |
| `/hr/attendance`              | Attendance   | Today's clock-in status, weekly timesheet grid (hours per day), overtime flags, week navigation, filters, and single or bulk timesheet approval.                                                                         |
| `/hr/payroll`                 | Payroll      | Pay run history, trend chart, approve the next run.                                                                                                                                                                      |
| `/hr/payroll/:runId`          | Pay run      | Department split, earnings breakdown and employee lines.                                                                                                                                                                 |
| `/hr/benefits`                | Benefits     | Plan cards with enrollment and cost, cost-by-category donut, employee enrollment table with search and status filter, plan detail sheet.                                                                                 |
| `/hr/performance`             | Performance  | Review cycles, company goals, rating distribution, pending reviews.                                                                                                                                                      |
| `/hr/training`                | Training     | Course catalog with completion per course, compliance by department, assignments table with search, status filter (`?status=overdue`) and paging, course detail sheet, "Assign training" dialog (React Hook Form + Zod). |
| `/hr/engagement`              | Engagement   | eNPS with 12-month trend and promoter split, survey list with response rates and reminders, question × department heat table, anonymous comments filtered by sentiment.                                                  |
| `/hr/documents`               | Documents    | Policies and employee documents with signature progress, kind and status filters (`?status=pending`), signatures by department, and a document sheet with pending/signed lists, version history and "Send reminder".     |
| `/hr/settings`                | Settings     | Leave policy, work week and notification preferences.                                                                                                                                                                    |

## Folder layout

```
hr/
  index.ts          feature definition: nav, routes, translations
  routes.ts         typed route helpers (hrRoutes.candidate.href({ candidateId }))
  pages/            one file per route; each exports a default component and an optional `loader`
  components/       page sections (timesheet-table, onboarding-checklist, benefit-plan-sheet, …)
  api/              TanStack Query options, hooks and mutations
  model/            Zod schemas and types (the API contract)
  lib/format.ts     money, date, hour formatting
  i18n/en.json, es.json
  __tests__/        page-level tests that render the full app
```

## API (mock endpoints)

All endpoints live in `src/mocks/handlers/hr.ts` (training, engagement and documents in `hr-training.ts`, `hr-engagement.ts` and `hr-documents.ts`; shared helpers in `hr-shared.ts`) and require an authenticated session.

| Method and path                          | Returns / does                                         | Schema                                    |
| ---------------------------------------- | ------------------------------------------------------ | ----------------------------------------- |
| `GET /hr/overview?range&compare`         | Dashboard data                                         | `hrOverviewSchema` (model/overview.ts)    |
| `POST /hr/jobs`                          | Create a job                                           | `openingSchema`                           |
| `GET /hr/people`                         | Employees                                              | `employeeSchema[]`                        |
| `GET /hr/people/:id`                     | Employee profile                                       | `profileSchema`                           |
| `GET /hr/jobs`                           | Open roles                                             | `jobSchema[]`                             |
| `GET /hr/jobs/:id/candidates`            | Job and its candidates                                 | `jobBoardSchema`                          |
| `GET /hr/candidates/:id`                 | Candidate profile, résumé, scorecards                  | `candidateProfileSchema`                  |
| `PATCH /hr/candidates/:id`               | Move to a stage (`{ stage }`)                          | `candidateSchema`                         |
| `GET /hr/time-off`                       | Leave requests                                         | `timeOffSchema[]`                         |
| `PATCH /hr/time-off/:id`                 | Approve or decline (`{ status }`)                      | `timeOffSchema`                           |
| `GET /hr/attendance?week`                | Timesheets for a week (`0` = current, `-1` = last)     | `attendanceSchema` (model/workforce.ts)   |
| `POST /hr/timesheets/approve`            | Approve timesheets (`{ ids }`), 204                    | none                                      |
| `GET /hr/onboarding`                     | New hires with checklists                              | `newHireSchema[]`                         |
| `PATCH /hr/onboarding/tasks/:id`         | Set a task's `done` flag                               | `newHireSchema`                           |
| `GET /hr/benefits`                       | Plans with enrollment counts, per-employee enrollments | `benefitsSchema`                          |
| `GET /hr/payroll`                        | Pay runs                                               | `payRunSchema[]`                          |
| `GET /hr/payroll/:id`                    | Pay run detail                                         | `payRunDetailSchema`                      |
| `POST /hr/payroll/:id/approve`           | Approve a run                                          | `payRunSchema`                            |
| `GET /hr/training`                       | Courses and assignments                                | `trainingSchema` (model/training.ts)      |
| `POST /hr/training/assignments`          | Assign a course (`{ courseId, personIds, due }`)       | none                                      |
| `GET /hr/engagement`                     | Surveys, eNPS, scores, comments                        | `engagementSchema` (model/engagement.ts)  |
| `POST /hr/engagement/surveys/:id/remind` | Remind non-respondents of an open survey               | none                                      |
| `GET /hr/documents`                      | Documents with acknowledgements and versions           | `hrDocumentSchema[]` (model/documents.ts) |
| `POST /hr/documents/:id/remind`          | Remind everyone who has not signed                     | none                                      |
| `GET /hr/performance`                    | Cycles, goals, distribution                            | `performanceSchema`                       |

Mutations declare `meta: { invalidates, successMessage }`; the app's query client refreshes those queries and shows the toast. Candidate moves and onboarding ticks update the cache optimistically.

## Customizing

**Connect a real backend.** Set `VITE_APP_API_URL` to your server and implement the endpoints above. Responses are validated with the Zod schemas in `model/`, so a mismatch fails loudly instead of rendering bad data. Remove `hrHandlers` from `src/mocks/handlers/index.ts` once every endpoint is real.

**Add a page.**

1. Add a route in `routes.ts`, e.g. `reviews: defineRoute('/hr/reviews')`.
2. Create `pages/reviews-page.tsx` with a default-export component wrapped in `Page`, plus a `loader` that prefetches its query.
3. Add the schema to `model/`, the request and query hook to `api/`, and a mock endpoint to `src/mocks/handlers/hr.ts`.
4. Register `{ path: r.reviews.path, page: () => import('./pages/reviews-page') }` in `index.ts` and, if it needs one, a nav entry.
5. Add strings to both `i18n/en.json` and `i18n/es.json`; a test fails if their keys differ.

**Change the data.** Seed lists (departments, names, plans, onboarding template) sit at the top of each section in the mock handler file. Department and benefit-category colours are in `DEPARTMENT_COLOR` (model/hr.ts) and `BENEFIT_COLOR` (model/workforce.ts) and use theme tokens only.

**Rules of thumb.** Colours come from theme tokens (`bg-primary/10`, `var(--chart-2)`), never palette classes or hex. Every visible string goes through `t()`. The feature imports only from `core` and `shared`, never from another feature.

## Tests

```
npx vitest run src/features/hr
```

Covers the overview, org chart, time-off approval, timesheet approval, onboarding task toggle, benefit plan sheet, candidate stage move, the training status filter, the engagement dashboard and document reminders.
