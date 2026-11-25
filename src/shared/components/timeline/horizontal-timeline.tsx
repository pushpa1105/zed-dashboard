import { Check } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

export type Milestone = {
  id: string;
  date: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  status: 'done' | 'current' | 'upcoming';
};

/**
 * Milestones on a horizontal line that scrolls sideways when it runs out of
 * room. Done segments are filled; the current milestone pulses.
 */
export function HorizontalTimeline({
  items,
  className,
}: {
  items: Milestone[];
  className?: string;
}) {
  return (
    <div className={cn('overflow-x-auto pb-2', className)}>
      <ol className="flex w-full min-w-max snap-x">
        {items.map((m, i) => {
          const last = i === items.length - 1;
          const nextDone = items[i + 1] && items[i + 1]!.status !== 'upcoming';
          return (
            <li key={m.id} className="relative min-w-52 flex-1 snap-start pr-6 last:flex-none">
              <div className="flex items-center">
                <span
                  className={cn(
                    'relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 bg-card',
                    m.status === 'done' && 'border-primary bg-primary text-primary-foreground',
                    m.status === 'current' && 'border-primary text-primary',
                    m.status === 'upcoming' && 'border-border text-muted-foreground',
                  )}
                >
                  {m.status === 'done' ? (
                    <Check className="size-3.5" />
                  ) : (
                    <span
                      className={cn(
                        'size-2 rounded-full bg-current',
                        m.status === 'current' && 'animate-pulse',
                      )}
                    />
                  )}
                </span>
                {!last && (
                  <span
                    aria-hidden
                    className={cn('-mr-6 h-0.5 flex-1', nextDone ? 'bg-primary' : 'bg-border')}
                  />
                )}
              </div>
              <p className="mt-3 text-xs font-medium text-muted-foreground tabular-nums">
                {m.date}
              </p>
              <p
                className={cn(
                  'mt-0.5 text-sm font-semibold',
                  m.status === 'upcoming' && 'text-muted-foreground',
                )}
              >
                {m.title}
              </p>
              {m.description && (
                <p className="mt-1 text-xs text-muted-foreground">{m.description}</p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
