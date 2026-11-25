import { z } from 'zod';

export const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const memberSchema = z.object({ id: z.string(), name: z.string(), role: z.string() });
export type Member = z.infer<typeof memberSchema>;

export const labelSchema = z.object({
  id: z.string(),
  name: z.string(),
  tone: z.enum(['danger', 'violet', 'magenta', 'blue', 'aqua', 'orange']),
});
export type Label = z.infer<typeof labelSchema>;

export const boardSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  cardCount: z.number(),
});

export const workspaceSchema = z.object({
  boards: z.array(boardSummarySchema),
  members: z.array(memberSchema),
  labels: z.array(labelSchema),
});
export type KanbanWorkspace = z.infer<typeof workspaceSchema>;

export const columnSchema = z.object({
  id: z.string(),
  title: z.string(),
  wipLimit: z.number().nullable(),
});
export type Column = z.infer<typeof columnSchema>;

export const checklistItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  done: z.boolean(),
});
export type ChecklistItem = z.infer<typeof checklistItemSchema>;

export const commentSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  text: z.string(),
  at: z.string(),
});
export type Comment = z.infer<typeof commentSchema>;

export const cardSchema = z.object({
  id: z.string(),
  key: z.string(),
  columnId: z.string(),
  title: z.string(),
  description: z.string(),
  labelIds: z.array(z.string()),
  assigneeIds: z.array(z.string()),
  due: z.string().nullable(),
  priority: z.enum(PRIORITIES),
  checklist: z.array(checklistItemSchema),
  comments: z.array(commentSchema),
});
export type Card = z.infer<typeof cardSchema>;

export const boardSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  columns: z.array(columnSchema),
  /** In display order within each column. */
  cards: z.array(cardSchema),
});
export type Board = z.infer<typeof boardSchema>;

export type CardPatch = Partial<
  Pick<
    Card,
    'title' | 'description' | 'labelIds' | 'assigneeIds' | 'due' | 'priority' | 'checklist'
  >
>;

export type MoveInput = {
  cardId: string;
  columnId: string;
  /** Insert before this card; `null` appends to the column. */
  beforeId: string | null;
  /** Set when a card moves between swimlanes. */
  assigneeIds?: string[];
};
