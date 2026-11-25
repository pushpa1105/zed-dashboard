import { z } from 'zod';

export const SURVEY_QUESTIONS = [
  'recommend',
  'growth',
  'manager',
  'recognition',
  'workload',
  'mission',
  'tools',
  'belonging',
] as const;
export const SENTIMENTS = ['positive', 'neutral', 'negative'] as const;

const surveySchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(['scheduled', 'active', 'closed']),
  opensAt: z.string(),
  closesAt: z.string(),
  invited: z.number(),
  responses: z.number(),
  remindedAt: z.string().nullable(),
});
export type Survey = z.infer<typeof surveySchema>;

const commentSchema = z.object({
  id: z.string(),
  sentiment: z.enum(SENTIMENTS),
  topic: z.enum(SURVEY_QUESTIONS),
  text: z.string(),
  department: z.string(),
  date: z.string(),
});
export type SurveyComment = z.infer<typeof commentSchema>;

export const engagementSchema = z.object({
  surveys: z.array(surveySchema),
  /** Monthly eNPS; promoters, passives and detractors are percentages. */
  enps: z.array(
    z.object({
      month: z.string(),
      promoters: z.number(),
      passives: z.number(),
      detractors: z.number(),
      score: z.number(),
    }),
  ),
  /** Average answer (1–5) per question for the latest closed survey. */
  scores: z.array(
    z.object({
      department: z.string(),
      values: z.record(z.enum(SURVEY_QUESTIONS), z.number()),
    }),
  ),
  comments: z.array(commentSchema),
});
export type DepartmentScores = z.infer<typeof engagementSchema>['scores'][number];

export const SURVEY_TONE = { scheduled: 'neutral', active: 'info', closed: 'success' } as const;
export const SENTIMENT_TONE = {
  positive: 'success',
  neutral: 'neutral',
  negative: 'danger',
} as const;
