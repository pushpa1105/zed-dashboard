import type { ReactNode } from 'react';

import { TONES, type Tone } from '@/shared/components/display/tone';
import { cn } from '@/shared/lib/cn';

export type HistoryEntry = {
  id: string;
  time: ReactNode;
  text: ReactNode;
  actor?: ReactNode;
  tone?: Tone;
};

/**
 * Dense audit trail: time column, a small tone dot, one line per change.
 * Groups by `day` labels when provided.
 */
export function HistoryList({
  groups,
  className,
}: {
  groups: Array<{ day: ReactNode; entries: HistoryEntry[] }>;
  className?: string;
}) {
  return (
    <div className={cn('space-y-5', className)}>
      {groups.map((group, g) => (
        <section key={g}>
          <h3 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {group.day}
          </h3>
          <ul className="divide-y rounded-lg border">
            {group.entries.map((entry) => (
              <li
                key={entry.id}
                className="grid grid-cols-[4.5rem_0.75rem_1fr] items-center gap-2 px-3 py-2.5 text-sm"
              >
                <time className="text-xs text-muted-foreground tabular-nums">{entry.time}</time>
                <span
                  className="size-2 rounded-full"
                  style={{ background: TONES[entry.tone ?? 'neutral'] }}
                />
                <span className="min-w-0 truncate">
                  {entry.actor && <span className="font-medium">{entry.actor} </span>}
                  <span className="text-muted-foreground">{entry.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
