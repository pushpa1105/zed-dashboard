import { z } from 'zod';

const COURSE_CATEGORIES = [
  'compliance',
  'leadership',
  'technical',
  'product',
  'wellbeing',
] as const;
export const ASSIGNMENT_STATUSES = ['notStarted', 'inProgress', 'overdue', 'completed'] as const;

const courseSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.enum(COURSE_CATEGORIES),
  format: z.enum(['online', 'workshop', 'video']),
  hours: z.number(),
  provider: z.string(),
  required: z.boolean(),
  rating: z.number(),
});
export type Course = z.infer<typeof courseSchema>;

const assignmentSchema = z.object({
  id: z.string(),
  personId: z.string(),
  name: z.string(),
  department: z.string(),
  courseId: z.string(),
  due: z.string(),
  progress: z.number(),
  status: z.enum(ASSIGNMENT_STATUSES),
});
export type Assignment = z.infer<typeof assignmentSchema>;

export const trainingSchema = z.object({
  courses: z.array(courseSchema),
  assignments: z.array(assignmentSchema),
});

export const assignTrainingSchema = z.object({
  courseId: z.string().min(1, 'validation.required'),
  personIds: z.array(z.string()).min(1, 'validation.required'),
  due: z.date({ error: 'validation.required' }),
});
export type AssignTrainingInput = z.infer<typeof assignTrainingSchema>;

export const COURSE_COLOR: Record<Course['category'], string> = {
  compliance: 'var(--chart-3)',
  leadership: 'var(--chart-1)',
  technical: 'var(--chart-4)',
  product: 'var(--chart-2)',
  wellbeing: 'var(--success)',
};

export const ASSIGNMENT_TONE = {
  notStarted: 'neutral',
  inProgress: 'info',
  overdue: 'danger',
  completed: 'success',
} as const;
