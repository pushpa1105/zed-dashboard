import {
  Archive,
  File,
  Inbox,
  OctagonAlert,
  Send,
  Star,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { z } from 'zod';

const person = z.object({ name: z.string(), email: z.string() });

export const mailPreviewSchema = z.object({
  id: z.string(),
  folder: z.string(),
  from: person,
  to: z.array(person),
  subject: z.string(),
  snippet: z.string(),
  date: z.number(),
  read: z.boolean(),
  starred: z.boolean(),
  labels: z.array(z.string()),
  hasAttachments: z.boolean(),
  threadCount: z.number(),
});

export const mailSchema = mailPreviewSchema.extend({
  cc: z.array(person),
  body: z.string(),
  attachments: z.array(z.object({ name: z.string(), size: z.number() })),
});

export const summarySchema = z.object({
  folders: z.array(z.object({ id: z.string(), total: z.number(), unread: z.number() })),
  starred: z.number(),
  labels: z.array(
    z.object({ id: z.string(), name: z.string(), tone: z.string(), count: z.number() }),
  ),
});

export type MailPreview = z.infer<typeof mailPreviewSchema>;
export type Mail = z.infer<typeof mailSchema>;
export type MailSummary = z.infer<typeof summarySchema>;

/** A mailbox view: a folder, the virtual "starred" folder, or a label. */
export type MailView = { kind: 'folder'; id: string } | { kind: 'label'; id: string };

export const FOLDERS: Array<{ id: string; icon: LucideIcon }> = [
  { id: 'inbox', icon: Inbox },
  { id: 'starred', icon: Star },
  { id: 'sent', icon: Send },
  { id: 'drafts', icon: File },
  { id: 'archive', icon: Archive },
  { id: 'spam', icon: OctagonAlert },
  { id: 'trash', icon: Trash2 },
];

export const FOLDER_IDS = [
  'inbox',
  'starred',
  'sent',
  'drafts',
  'archive',
  'spam',
  'trash',
] as const;
export type FolderId = (typeof FOLDER_IDS)[number];

/** Label tones come from the mock API; these map to theme chart colors. */
export const TONE_COLOR: Record<string, string> = {
  violet: 'var(--chart-1)',
  aqua: 'var(--chart-2)',
  orange: 'var(--chart-3)',
  blue: 'var(--chart-4)',
  magenta: 'var(--chart-5)',
};
