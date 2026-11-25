import { Check } from 'lucide-react';

import { cn } from '@/shared/lib/cn';

import { fmtDateTime } from '../lib/format';
import type { Checkpoint } from '../model/logistics';

/**
 * Checkpoint timeline: done steps are filled, the current step pulses (or
 * turns red when it is an exception), upcoming steps are hollow and show the
 * planned time.
 */
export function TrackingTimeline({
  checkpoints,
  exception,
  plannedLabel,
}: {
  checkpoints: Checkpoint[];
  exception?: boolean;
  plannedLabel: string;
}) {
  return (
    <ol className="relative">
      {checkpoints.map((cp, i) => {
        const last = i === checkpoints.length - 1;
        const isCurrent = cp.state === 'current';
        const danger = isCurrent && exception;
        return (
          <li key={cp.id} className="relative flex gap-4 pb-7 last:pb-0">
            {!last && (
              <span
                aria-hidden
                className={cn(
                  'absolute top-8 bottom-0 left-[15px] w-0.5 rounded-full',
                  cp.state === 'done' ? 'bg-primary' : 'bg-border',
                )}
              />
            )}
            <span
              className={cn(
                'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full',
                cp.state === 'done' && 'bg-primary text-primary-foreground',
                isCurrent && !danger && 'border-2 border-primary bg-card',
                danger && 'border-2 border-destructive bg-card',
                cp.state === 'upcoming' && 'border-2 border-dashed border-border bg-card',
              )}
            >
              {cp.state === 'done' && <Check className="size-4" />}
              {isCurrent && (
                <span
                  className={cn(
                    'size-2.5 rounded-full motion-safe:animate-pulse',
                    danger ? 'bg-destructive' : 'bg-primary',
                  )}
                />
              )}
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                <p
                  className={cn(
                    'text-sm font-medium',
                    cp.state === 'upcoming' && 'text-muted-foreground',
                    danger && 'text-destructive',
                  )}
                >
                  {cp.event}
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {cp.state === 'upcoming' && `${plannedLabel} `}
                  {fmtDateTime(cp.at)}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">{cp.location}</p>
              {cp.note && (
                <p className="mt-2 rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                  {cp.note}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
