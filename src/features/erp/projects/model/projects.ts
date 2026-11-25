import { z } from 'zod';

export const operationSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  owner: z.string(),
  progress: z.number(),
  value: z.number(),
  dueDate: z.string(),
});
export type Operation = z.infer<typeof operationSchema>;

export const TASK_KEYS = ['done', 'new', 'inProgress', 'late'] as const;

export const projectsOverviewSchema = z.object({
  sales: z.object({
    total: z.number(),
    previous: z.number(),
    delta: z.number(),
    months: z.array(z.object({ month: z.string(), amount: z.number(), pct: z.number() })),
  }),
  target: z.number(),
  projects: z.array(
    z.object({ year: z.string(), done: z.number(), created: z.number(), late: z.number() }),
  ),
  tasks: z.array(z.object({ key: z.enum(TASK_KEYS), label: z.string(), value: z.number() })),
  capacity: z.object({ used: z.number(), total: z.number() }),
  analysis: z.array(z.object({ day: z.string(), hours: z.number(), planned: z.number() })),
  deadlines: z.array(z.string()),
  clients: z.array(
    z.object({ id: z.string(), name: z.string(), company: z.string(), since: z.string() }),
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
export type ProjectsOverview = z.infer<typeof projectsOverviewSchema>;
