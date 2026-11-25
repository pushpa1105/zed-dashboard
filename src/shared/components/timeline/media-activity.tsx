import { FileText, ImageIcon, Paperclip } from 'lucide-react';
import type { ReactNode } from 'react';

import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { cn } from '@/shared/lib/cn';

export type ActivityAttachment = {
  name: string;
  size?: string;
  kind: 'file' | 'image';
};

export type MediaActivityItem = {
  id: string;
  actor: string;
  action: ReactNode;
  target?: ReactNode;
  time: ReactNode;
  /** Quoted comment. */
  comment?: ReactNode;
  attachments?: ActivityAttachment[];
};

const IMAGE_TINTS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-4)', 'var(--chart-5)'];

/**
 * Activity stream with rich payloads: comments, file chips and image tiles.
 * Images render as tinted placeholders so no remote assets are needed.
 */
export function MediaActivity({
  items,
  className,
}: {
  items: MediaActivityItem[];
  className?: string;
}) {
  return (
    <ol className={cn('space-y-6', className)}>
      {items.map((item, i) => {
        const images = item.attachments?.filter((a) => a.kind === 'image') ?? [];
        const files = item.attachments?.filter((a) => a.kind === 'file') ?? [];
        const last = i === items.length - 1;
        return (
          <li key={item.id} className="relative flex gap-3">
            {!last && (
              <span aria-hidden className="absolute top-10 -bottom-6 left-4 w-px bg-border" />
            )}
            <InitialsAvatar
              name={item.actor}
              size="sm"
              className="relative z-10 ring-4 ring-card"
            />
            <div className="min-w-0 flex-1 space-y-2.5">
              <p className="text-sm leading-6">
                <span className="font-medium">{item.actor}</span>{' '}
                <span className="text-muted-foreground">{item.action}</span>
                {item.target && (
                  <>
                    {' '}
                    <span className="font-medium">{item.target}</span>
                  </>
                )}
                <span className="ml-2 text-xs text-muted-foreground">{item.time}</span>
              </p>
              {item.comment && (
                <blockquote className="rounded-lg border bg-muted/40 px-3.5 py-2.5 text-sm">
                  {item.comment}
                </blockquote>
              )}
              {images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {images.map((img, j) => (
                    <figure
                      key={img.name}
                      className="flex h-20 w-28 flex-col items-center justify-center gap-1 rounded-lg border text-[0.6875rem] text-muted-foreground"
                      style={{
                        background: `linear-gradient(135deg, color-mix(in srgb, ${IMAGE_TINTS[j % 4]} 22%, var(--card)), color-mix(in srgb, ${IMAGE_TINTS[(j + 1) % 4]} 12%, var(--card)))`,
                      }}
                    >
                      <ImageIcon className="size-4" />
                      <figcaption className="max-w-24 truncate">{img.name}</figcaption>
                    </figure>
                  ))}
                </div>
              )}
              {files.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {files.map((f) => (
                    <span
                      key={f.name}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border bg-card px-3 text-xs"
                    >
                      {f.name.endsWith('.pdf') ? (
                        <FileText className="size-4 text-destructive" />
                      ) : (
                        <Paperclip className="size-4 text-muted-foreground" />
                      )}
                      <span className="font-medium">{f.name}</span>
                      {f.size && <span className="text-muted-foreground">{f.size}</span>}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
