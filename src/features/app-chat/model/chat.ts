import { z } from 'zod';

export const attachmentSchema = z.object({
  name: z.string(),
  size: z.number(),
  kind: z.enum(['image', 'pdf', 'doc', 'sheet', 'zip']),
});

export const memberSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  online: z.boolean(),
});

export const conversationSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(['direct', 'group']),
  topic: z.string(),
  pinned: z.boolean(),
  muted: z.boolean(),
  unread: z.number(),
  online: z.boolean(),
  typing: z.string().nullable(),
  members: z.array(memberSchema),
  lastMessage: z
    .object({ body: z.string(), authorName: z.string(), createdAt: z.number() })
    .nullable(),
});

export const messageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  authorId: z.string(),
  body: z.string(),
  createdAt: z.number(),
  replyToId: z.string().nullable(),
  reactions: z.array(z.object({ label: z.string(), count: z.number(), mine: z.boolean() })),
  attachments: z.array(attachmentSchema),
  read: z.boolean(),
});

export const threadSchema = z.object({
  conversation: conversationSchema,
  messages: z.array(messageSchema),
});

export type Attachment = z.infer<typeof attachmentSchema>;
export type Member = z.infer<typeof memberSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
export type Message = z.infer<typeof messageSchema>;
export type Thread = z.infer<typeof threadSchema>;

/** The signed-in user's author id in the chat API. */
export const ME = 'me';

/** Quick reactions offered on every message (text chips, no emoji). */
export const QUICK_REACTIONS = ['+1', 'thanks', 'nice', 'agreed'] as const;
