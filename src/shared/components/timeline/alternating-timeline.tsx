import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { TONES, type Tone } from '@/shared/components/display/tone';
import { cn } from '@/shared/lib/cn';

export type AlternatingTimelineItem = {
  id: string;
  date: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  tone?: Tone;
};

/**
 * Center-line timeline with events alternating left and right — company
 * history, product milestones. Collapses to a single left line on mobile.
 */
export function AlternatingTimeline({
  items,
  className,
}: {
  items: AlternatingTimelineItem[];
  className?: string;
}) {
  return (
    <ol className={cn('relative', className)}>
      <span
        aria-hidden
        className="absolute top-2 bottom-2 left-4 w-px bg-gradient-to-b from-border via-primary/40 to-border md:left-1/2"
      />
      {items.map((item, i) => {
        const color = TONES[item.tone ?? 'primary'];
        const Icon = item.icon;
        const right = i % 2 === 1;
        return (
          <li
            key={item.id}
            className="relative grid grid-cols-[2rem_1fr] gap-4 pb-8 last:pb-0 md:grid-cols-[1fr_2.5rem_1fr] md:gap-6"
          >
            <div
              className={cn(
                'hidden md:block',
                right ? 'md:order-1' : 'md:order-3',
                !right && 'text-left',
              )}
            >
              <p
                className={cn(
                  'pt-2 text-sm font-medium text-muted-foreground tabular-nums',
                  right && 'text-right',
                )}
              >
                {item.date}
              </p>
            </div>
            <span
              className="relative z-10 flex size-8 items-center justify-center self-start justify-self-center rounded-full border-2 bg-card md:order-2 md:size-10"
              style={{ borderColor: color, color }}
            >
              {Icon ? (
                <Icon className="size-4" />
              ) : (
                <span className="size-2 rounded-full bg-current" />
              )}
            </span>
            <div className={cn('min-w-0', right ? 'md:order-3' : 'md:order-1')}>
              <div
                className={cn('rounded-xl border bg-card p-4 shadow-xs', !right && 'md:text-right')}
              >
                <p className="mb-1 text-xs font-medium text-muted-foreground tabular-nums md:hidden">
                  {item.date}
                </p>
                <p className="text-sm font-semibold">{item.title}</p>
                {item.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
