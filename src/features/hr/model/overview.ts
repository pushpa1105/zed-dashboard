import { z } from 'zod';

export const HR_RANGES = ['7d', '14d', '30d', '90d'] as const;
export type HrRange = (typeof HR_RANGES)[number];

export const HR_COMPARE = ['previous', 'lastYear'] as const;
export type HrCompare = (typeof HR_COMPARE)[number];

export type HrFilters = { range: HrRange; compare: HrCompare };

const statSchema = z.object({ value: z.number(), change: z.number() });

export const openingSchema = z.object({
  id: z.string(),
  title: z.string(),
  department: z.string(),
  publishedAt: z.string(),
  candidates: z.array(z.string()),
  total: z.number(),
});
export type Opening = z.infer<typeof openingSchema>;

export const hrOverviewSchema = z.object({
  stats: z.object({
    newCandidates: statSchema,
    applications: statSchema,
    totalCandidates: statSchema,
    employees: statSchema,
  }),
  series: z.array(z.object({ date: z.string(), current: z.number(), previous: z.number() })),
  interviews: z.array(
    z.object({
      id: z.string(),
      date: z.string(),
      candidate: z.string(),
      start: z.string(),
      end: z.string(),
      role: z.string(),
      stage: z.string(),
    }),
  ),
  openings: z.array(openingSchema),
  headcount: z.array(z.object({ department: z.string(), count: z.number() })),
  pipeline: z.array(z.object({ stage: z.string(), count: z.number() })),
  onboarding: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      role: z.string(),
      startDate: z.string(),
      progress: z.number(),
    }),
  ),
  activity: z.array(
    z.object({
      id: z.string(),
      actor: z.string(),
      action: z.string(),
      target: z.string(),
      at: z.string(),
    }),
  ),
});
export type HrOverview = z.infer<typeof hrOverviewSchema>;

export const DEPARTMENTS = [
  'Engineering',
  'Design',
  'Sales',
  'Marketing',
  'Support',
  'Finance',
  'People',
] as const;
export const EMPLOYMENT_TYPES = ['fullTime', 'partTime', 'contract'] as const;

export const newJobSchema = z.object({
  title: z.string().trim().min(1, 'validation.required').max(80, 'validation.tooLong'),
  department: z.enum(DEPARTMENTS),
  location: z.string().trim().min(1, 'validation.required').max(60, 'validation.tooLong'),
  type: z.enum(EMPLOYMENT_TYPES),
});
export type NewJobInput = z.infer<typeof newJobSchema>;
