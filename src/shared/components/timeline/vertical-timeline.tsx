import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { TONES, type Tone } from '@/shared/components/display/tone';
import { cn } from '@/shared/lib/cn';

export type VerticalTimelineItem = {
  id: string;
  title: ReactNode;
  time: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  tone?: Tone;
  /** Extra content shown inside the event card (tags, buttons, previews…). */
  content?: ReactNode;
};

/**
 * Events as cards hanging off a vertical line, each with a tinted icon
 * bubble. Use for project histories, audit logs and order activity.
 */
export function VerticalTimeline({
  items,
  className,
}: {
  items: VerticalTimelineItem[];
  className?: string;
}) {
  return (
    <ol className={cn('relative', className)}>
      {items.map((item, i) => {
        const color = TONES[item.tone ?? 'primary'];
        const Icon = item.icon;
        const last = i === items.length - 1;
        return (
          <li key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
            {!last && (
              <span
                aria-hidden
                className="absolute top-10 bottom-0 left-5 w-px -translate-x-1/2 bg-border"
              />
            )}
            <span
              className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full ring-4 ring-card"
              style={{
                background: `color-mix(in srgb, ${color} 14%, var(--card))`,
                color,
              }}
            >
              {Icon ? (
                <Icon className="size-[1.1rem]" />
              ) : (
                <span className="size-2.5 rounded-full bg-current" />
              )}
            </span>
            <div className="min-w-0 flex-1 rounded-xl border bg-card p-4 shadow-xs">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="text-sm font-semibold">{item.title}</p>
                <time className="text-xs text-muted-foreground tabular-nums">{item.time}</time>
              </div>
              {item.description && (
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              )}
              {item.content && <div className="mt-3">{item.content}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
