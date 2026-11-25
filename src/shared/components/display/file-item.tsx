import {
  File,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import { formatBytes } from './format-bytes';

const TYPES: Array<{ match: RegExp; icon: LucideIcon; color: string }> = [
  { match: /\.(png|jpe?g|gif|webp|svg|avif)$/i, icon: FileImage, color: 'var(--chart-5)' },
  { match: /\.(csv|xlsx?|numbers)$/i, icon: FileSpreadsheet, color: 'var(--chart-2)' },
  { match: /\.(pdf|docx?|txt|md)$/i, icon: FileText, color: 'var(--chart-3)' },
  { match: /\.(mp4|mov|webm)$/i, icon: FileVideo, color: 'var(--chart-4)' },
  { match: /\.(zip|rar|7z|tar|gz)$/i, icon: FileArchive, color: 'var(--chart-1)' },
];

export type FileItemProps = {
  name: string;
  size: number;
  /** 0 – 100 while uploading; omit when done. */
  progress?: number;
  error?: string;
  /** Extra actions (download, open…). */
  action?: ReactNode;
  onRemove?: () => void;
  className?: string;
};

/** Attachment row: type icon, name, size, upload progress or error. */
export function FileItem({
  name,
  size,
  progress,
  error,
  action,
  onRemove,
  className,
}: FileItemProps) {
  const type = TYPES.find((t) => t.match.test(name));
  const Icon = type?.icon ?? File;
  const color = type?.color ?? 'var(--muted-foreground)';
  const uploading = progress !== undefined && progress < 100 && !error;

  return (
    <div className={cn('flex items-center gap-3 rounded-lg border bg-card p-3', className)}>
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-lg"
        style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-medium">{name}</p>
          {uploading && (
            <span className="text-xs text-muted-foreground tabular-nums">{progress}%</span>
          )}
        </div>
        {uploading ? (
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : (
          <p className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}>
            {error ?? formatBytes(size)}
          </p>
        )}
      </div>
      {action}
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${name}`}
          onClick={onRemove}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
