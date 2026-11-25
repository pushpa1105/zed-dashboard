import { z } from 'zod';

export const DOCUMENT_KINDS = ['policy', 'employee'] as const;
const DOCUMENT_CATEGORIES = [
  'conduct',
  'security',
  'privacy',
  'workplace',
  'safety',
  'expenses',
  'contract',
  'nda',
  'equity',
] as const;

const acknowledgementSchema = z.object({
  personId: z.string(),
  name: z.string(),
  department: z.string(),
  signedAt: z.string().nullable(),
  remindedAt: z.string().nullable(),
});
export type Acknowledgement = z.infer<typeof acknowledgementSchema>;

export const hrDocumentSchema = z.object({
  id: z.string(),
  title: z.string(),
  kind: z.enum(DOCUMENT_KINDS),
  category: z.enum(DOCUMENT_CATEGORIES),
  owner: z.string(),
  version: z.string(),
  updatedAt: z.string(),
  dueDate: z.string(),
  /** Newest first. */
  versions: z.array(
    z.object({ version: z.string(), date: z.string(), author: z.string(), note: z.string() }),
  ),
  acknowledgements: z.array(acknowledgementSchema),
});
export type HrDocument = z.infer<typeof hrDocumentSchema>;

export const pendingOf = (doc: HrDocument) => doc.acknowledgements.filter((a) => !a.signedAt);
