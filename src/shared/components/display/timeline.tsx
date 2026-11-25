import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import { TONES, type Tone } from './tone';

export type TimelineItem = {
  key: string;
  title: ReactNode;
  description?: ReactNode;
  time?: ReactNode;
  icon?: LucideIcon;
  tone?: Tone;
  /** Extra content under the description (attachments, quotes…). */
  content?: ReactNode;
};

/** Vertical timeline with icon markers and a connecting line. */
export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <ol className={cn('relative', className)}>
      {items.map((item, index) => {
        const color = TONES[item.tone ?? 'primary'];
        const Icon = item.icon;
        const last = index === items.length - 1;
        return (
          <li key={item.key} className="relative flex gap-3 pb-6 last:pb-0">
            {!last && (
              <span className="absolute top-8 bottom-0 left-[15px] w-px bg-border" aria-hidden />
            )}
            <span
              className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-card"
              style={{ background: `color-mix(in srgb, ${color} 14%, var(--card))`, color }}
            >
              {Icon ? (
                <Icon className="size-4" />
              ) : (
                <span className="size-2 rounded-full" style={{ background: color }} />
              )}
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="text-sm font-medium">{item.title}</p>
                {item.time && (
                  <time className="text-xs text-muted-foreground tabular-nums">{item.time}</time>
                )}
              </div>
              {item.description && (
                <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>
              )}
              {item.content && <div className="mt-2">{item.content}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
