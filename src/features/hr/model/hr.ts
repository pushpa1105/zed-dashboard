import { z } from 'zod';

/** Schemas for the HR workspace pages (the home dashboard lives in ./overview.ts). */

export const EMPLOYEE_STATUSES = ['active', 'onLeave', 'onboarding'] as const;
export const EMPLOYMENT_KINDS = ['fullTime', 'partTime', 'contract'] as const;

export const employeeSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
  department: z.string(),
  location: z.string(),
  email: z.string(),
  managerId: z.string().nullable(),
  startDate: z.string(),
  status: z.enum(EMPLOYEE_STATUSES),
  employmentType: z.enum(EMPLOYMENT_KINDS),
});
export type Employee = z.infer<typeof employeeSchema>;

export const LEAVE_TYPES = ['vacation', 'sick', 'parental', 'personal'] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

export const timeOffSchema = z.object({
  id: z.string(),
  personId: z.string(),
  name: z.string(),
  department: z.string(),
  type: z.enum(LEAVE_TYPES),
  start: z.string(),
  end: z.string(),
  days: z.number(),
  status: z.enum(['pending', 'approved', 'declined']),
  note: z.string(),
});
export type TimeOffRequest = z.infer<typeof timeOffSchema>;

export const goalSchema = z.object({
  id: z.string(),
  title: z.string(),
  owner: z.string(),
  progress: z.number(),
  due: z.string(),
  status: z.enum(['onTrack', 'atRisk', 'offTrack']),
});
export type Goal = z.infer<typeof goalSchema>;

export const profileSchema = z.object({
  person: employeeSchema.extend({
    phone: z.string(),
    level: z.number(),
    salary: z.number(),
    rating: z.number(),
  }),
  manager: employeeSchema.nullable(),
  reports: z.array(employeeSchema),
  balances: z.array(z.object({ type: z.enum(LEAVE_TYPES), used: z.number(), total: z.number() })),
  timeOff: z.array(timeOffSchema),
  jobHistory: z.array(
    z.object({ id: z.string(), title: z.string(), from: z.string(), to: z.string().nullable() }),
  ),
  documents: z.array(
    z.object({ id: z.string(), name: z.string(), size: z.number(), at: z.string() }),
  ),
  reviews: z.array(
    z.object({ id: z.string(), cycle: z.string(), rating: z.number(), summary: z.string() }),
  ),
  goals: z.array(goalSchema),
});
export type EmployeeProfile = z.infer<typeof profileSchema>;

export const jobSchema = z.object({
  id: z.string(),
  title: z.string(),
  department: z.string(),
  location: z.string(),
  publishedAt: z.string(),
  status: z.enum(['open', 'paused']),
  applicants: z.number(),
  inInterview: z.number(),
});
export type Job = z.infer<typeof jobSchema>;

export const CANDIDATE_STAGES = ['applied', 'screening', 'interview', 'offer', 'hired'] as const;
export type CandidateStage = (typeof CANDIDATE_STAGES)[number];

export const candidateSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  name: z.string(),
  email: z.string(),
  stage: z.enum(CANDIDATE_STAGES),
  rating: z.number(),
  source: z.string(),
  appliedAt: z.string(),
  location: z.string(),
});
export type Candidate = z.infer<typeof candidateSchema>;

export const jobBoardSchema = z.object({ job: jobSchema, candidates: z.array(candidateSchema) });

const RECOMMENDATIONS = ['strongYes', 'yes', 'no', 'strongNo'] as const;
const SCORE_CRITERIA = ['technical', 'communication', 'problemSolving', 'cultureAdd'] as const;

const scorecardSchema = z.object({
  id: z.string(),
  interviewer: z.string(),
  interviewerTitle: z.string(),
  stage: z.enum(CANDIDATE_STAGES),
  date: z.string(),
  recommendation: z.enum(RECOMMENDATIONS),
  notes: z.string(),
  scores: z.array(z.object({ criterion: z.enum(SCORE_CRITERIA), score: z.number() })),
});
export type Scorecard = z.infer<typeof scorecardSchema>;

export const candidateProfileSchema = z.object({
  candidate: candidateSchema.extend({ phone: z.string(), expectedSalary: z.number() }),
  job: jobSchema.pick({ id: true, title: true, department: true }),
  resume: z.object({
    headline: z.string(),
    summary: z.string(),
    skills: z.array(z.string()),
    experience: z.array(
      z.object({
        id: z.string(),
        company: z.string(),
        role: z.string(),
        from: z.string(),
        to: z.string().nullable(),
      }),
    ),
    education: z.array(z.object({ id: z.string(), school: z.string(), degree: z.string() })),
  }),
  scorecards: z.array(scorecardSchema),
});
export type CandidateProfile = z.infer<typeof candidateProfileSchema>;

export const payRunSchema = z.object({
  id: z.string(),
  period: z.string(),
  payDate: z.string(),
  employees: z.number(),
  gross: z.number(),
  taxes: z.number(),
  deductions: z.number(),
  net: z.number(),
  status: z.enum(['draft', 'pendingApproval', 'paid']),
});
export type PayRun = z.infer<typeof payRunSchema>;

export const payRunDetailSchema = z.object({
  run: payRunSchema,
  departments: z.array(
    z.object({
      department: z.string(),
      employees: z.number(),
      gross: z.number(),
      net: z.number(),
      color: z.number(),
    }),
  ),
  components: z.array(
    z.object({ key: z.enum(['base', 'overtime', 'bonus', 'allowances']), amount: z.number() }),
  ),
  lines: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      title: z.string(),
      gross: z.number(),
      taxes: z.number(),
      net: z.number(),
    }),
  ),
});
export type PayRunDetail = z.infer<typeof payRunDetailSchema>;

export const performanceSchema = z.object({
  cycles: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      status: z.enum(['inProgress', 'scheduled', 'closed']),
      due: z.string(),
      completed: z.number(),
      total: z.number(),
      stage: z.string(),
    }),
  ),
  goals: z.array(goalSchema),
  distribution: z.array(z.object({ score: z.string(), people: z.number() })),
  pending: z.array(employeeSchema.extend({ reviewer: z.string() })),
});
export type Performance = z.infer<typeof performanceSchema>;

/** One colour per department, shared by the directory, org chart and calendar. */
export const DEPARTMENT_COLOR: Record<string, string> = {
  Executive: 'var(--foreground)',
  Engineering: 'var(--chart-1)',
  Design: 'var(--chart-5)',
  Sales: 'var(--chart-3)',
  Marketing: 'var(--chart-4)',
  Support: 'var(--chart-2)',
  Finance: 'var(--warning)',
  People: 'var(--info)',
};
export const departmentColor = (department: string) =>
  DEPARTMENT_COLOR[department] ?? 'var(--muted-foreground)';

export const LEAVE_COLOR: Record<LeaveType, string> = {
  vacation: 'var(--chart-1)',
  sick: 'var(--chart-3)',
  parental: 'var(--chart-2)',
  personal: 'var(--chart-4)',
};

export const PAY_STATUS_TONE: Record<PayRun['status'], 'neutral' | 'warning' | 'success'> = {
  draft: 'neutral',
  pendingApproval: 'warning',
  paid: 'success',
};

export const STAGE_COLOR: Record<CandidateStage, string> = {
  applied: 'var(--chart-4)',
  screening: 'var(--chart-2)',
  interview: 'var(--chart-1)',
  offer: 'var(--chart-3)',
  hired: 'var(--success)',
};
