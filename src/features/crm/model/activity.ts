import { z } from 'zod';

import type { Tone } from '@/shared/components/display/tone';

import { DEAL_STAGES } from './crm';

export const ACTIVITY_TYPES = ['call', 'email', 'meeting', 'note', 'stage'] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];
/** Types a rep can log by hand (stage changes come from the pipeline). */
export const LOGGABLE_TYPES = ['call', 'email', 'meeting', 'note'] as const;

export const ACTIVITY_TONE: Record<ActivityType, Tone> = {
  call: 'aqua',
  email: 'blue',
  meeting: 'violet',
  note: 'orange',
  stage: 'success',
};

export const feedItemSchema = z.object({
  id: z.string(),
  type: z.enum(ACTIVITY_TYPES),
  title: z.string(),
  detail: z.string().nullable(),
  owner: z.string(),
  at: z.string(),
  dealId: z.string(),
  dealName: z.string(),
  company: z.string(),
  stage: z.object({ from: z.enum(DEAL_STAGES), to: z.enum(DEAL_STAGES) }).nullable(),
});
export type FeedItem = z.infer<typeof feedItemSchema>;

export const logActivitySchema = z.object({
  type: z.enum(LOGGABLE_TYPES),
  dealId: z.string().min(1, 'validation.required'),
  title: z.string().trim().min(1, 'validation.required').max(100, 'validation.tooLong'),
  detail: z.string().trim().max(500, 'validation.tooLong'),
});
export type LogActivityInput = z.infer<typeof logActivitySchema>;
