import {
  FileArchive,
  FileCode2,
  FileImage,
  FileMusic,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Folder,
  Presentation,
  type LucideIcon,
} from 'lucide-react';
import { z } from 'zod';

export const FILE_TYPES = [
  'folder',
  'image',
  'pdf',
  'doc',
  'sheet',
  'slides',
  'video',
  'audio',
  'archive',
  'code',
] as const;
export type FileType = (typeof FILE_TYPES)[number];

export const fileItemSchema = z.object({
  id: z.string(),
  parentId: z.string().nullable(),
  name: z.string(),
  type: z.enum(FILE_TYPES),
  size: z.number(),
  updatedAt: z.number(),
  openedAt: z.number(),
  starred: z.boolean(),
  owner: z.string(),
  childCount: z.number(),
});

export const listingSchema = z.object({
  items: z.array(fileItemSchema),
  breadcrumbs: z.array(z.object({ id: z.string(), name: z.string() })),
});

export type FolderNode = { id: string; name: string; children: FolderNode[] };
export const folderNodeSchema: z.ZodType<FolderNode> = z.lazy(() =>
  z.object({ id: z.string(), name: z.string(), children: z.array(folderNodeSchema) }),
);

export const storageSchema = z.object({
  used: z.number(),
  quota: z.number(),
  byType: z.array(z.object({ id: z.string(), bytes: z.number() })),
});

export type FileItem = z.infer<typeof fileItemSchema>;
export type Listing = z.infer<typeof listingSchema>;
export type Storage = z.infer<typeof storageSchema>;

export type Scope = 'folder' | 'recent' | 'starred';
export type SortKey = 'name' | 'updated' | 'size' | 'type';

export const ROOT_ID = 'root';

/** Icon + tint per type (tint drives the tile background in grid view). */
export const TYPE_STYLE: Record<FileType, { icon: LucideIcon; color: string }> = {
  folder: { icon: Folder, color: 'var(--chart-1)' },
  image: { icon: FileImage, color: 'var(--chart-5)' },
  pdf: { icon: FileText, color: 'var(--destructive)' },
  doc: { icon: FileText, color: 'var(--chart-4)' },
  sheet: { icon: FileSpreadsheet, color: 'var(--chart-2)' },
  slides: { icon: Presentation, color: 'var(--chart-3)' },
  video: { icon: FileVideo, color: 'var(--chart-1)' },
  audio: { icon: FileMusic, color: 'var(--chart-5)' },
  archive: { icon: FileArchive, color: 'var(--muted-foreground)' },
  code: { icon: FileCode2, color: 'var(--chart-4)' },
};

export function formatBytes(bytes: number) {
  if (bytes === 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** i;
  return `${value >= 100 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}
