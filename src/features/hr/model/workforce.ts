import { z } from 'zod';

/** Schemas for attendance, onboarding and benefits. */

const CLOCK_STATUSES = ['in', 'break', 'out', 'absent'] as const;
const TIMESHEET_STATUSES = ['draft', 'submitted', 'approved'] as const;

const timesheetSchema = z.object({
  id: z.string(),
  personId: z.string(),
  name: z.string(),
  title: z.string(),
  department: z.string(),
  /** Hours per day, Monday first. */
  hours: z.array(z.number()).length(7),
  scheduled: z.number(),
  status: z.enum(TIMESHEET_STATUSES),
  /** Today's clock state; null for past weeks. */
  clock: z.object({ status: z.enum(CLOCK_STATUSES), since: z.string().nullable() }).nullable(),
});
export type Timesheet = z.infer<typeof timesheetSchema>;

export const attendanceSchema = z.object({
  weekStart: z.string(),
  timesheets: z.array(timesheetSchema),
});

/** A day over this many hours, or a week over the schedule, counts as overtime. */
export const DAILY_LIMIT = 10;
export const weekTotal = (sheet: Timesheet) => sheet.hours.reduce((s, h) => s + h, 0);
export const hasOvertime = (sheet: Timesheet) =>
  weekTotal(sheet) > sheet.scheduled || sheet.hours.some((h) => h > DAILY_LIMIT);

export const ONBOARDING_PHASES = ['beforeStart', 'week1', 'month1'] as const;
const TASK_OWNERS = ['hr', 'it', 'manager', 'newHire'] as const;

const onboardingTaskSchema = z.object({
  id: z.string(),
  phase: z.enum(ONBOARDING_PHASES),
  title: z.string(),
  owner: z.enum(TASK_OWNERS),
  due: z.string(),
  done: z.boolean(),
});
type OnboardingTask = z.infer<typeof onboardingTaskSchema>;

export const newHireSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
  department: z.string(),
  location: z.string(),
  startDate: z.string(),
  manager: z.string(),
  buddy: z.string(),
  tasks: z.array(onboardingTaskSchema),
});
export type NewHire = z.infer<typeof newHireSchema>;

export const progressOf = (tasks: OnboardingTask[]) =>
  tasks.length ? Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100) : 0;

export const BENEFIT_CATEGORIES = [
  'health',
  'dental',
  'vision',
  'retirement',
  'life',
  'wellness',
] as const;
type BenefitCategory = (typeof BENEFIT_CATEGORIES)[number];

const benefitPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(BENEFIT_CATEGORIES),
  provider: z.string(),
  description: z.string(),
  /** Monthly cost per enrolled employee. */
  employerCost: z.number(),
  employeeCost: z.number(),
  enrolled: z.number(),
  eligible: z.number(),
  renewal: z.string(),
  coverage: z.array(z.string()),
});
export type BenefitPlan = z.infer<typeof benefitPlanSchema>;

const enrollmentSchema = z.object({
  personId: z.string(),
  name: z.string(),
  department: z.string(),
  planIds: z.array(z.string()),
  status: z.enum(['enrolled', 'pending', 'waived']),
});
export type Enrollment = z.infer<typeof enrollmentSchema>;

export const benefitsSchema = z.object({
  plans: z.array(benefitPlanSchema),
  enrollments: z.array(enrollmentSchema),
});

export const BENEFIT_COLOR: Record<BenefitCategory, string> = {
  health: 'var(--chart-1)',
  dental: 'var(--chart-2)',
  vision: 'var(--chart-4)',
  retirement: 'var(--chart-3)',
  life: 'var(--chart-5)',
  wellness: 'var(--success)',
};
