import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import { InitialsAvatar } from './initials-avatar';

export type ActivityEntry = {
  key: string;
  actor: string;
  /** What happened, e.g. "commented on". */
  action: ReactNode;
  /** The object acted on, e.g. "Q4 roadmap". */
  target?: ReactNode;
  time: ReactNode;
  /** Quoted comment or extra detail. */
  detail?: ReactNode;
  unread?: boolean;
};

/** "Who did what, when" list with avatars; the newest-first activity stream. */
export function ActivityFeed({
  entries,
  className,
}: {
  entries: ActivityEntry[];
  className?: string;
}) {
  return (
    <ul className={cn('divide-y', className)}>
      {entries.map((entry) => (
        <li key={entry.key} className="flex gap-3 py-3 first:pt-0 last:pb-0">
          <InitialsAvatar name={entry.actor} size="sm" />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm leading-snug">
              <span className="font-medium">{entry.actor}</span>{' '}
              <span className="text-muted-foreground">{entry.action}</span>{' '}
              {entry.target && <span className="font-medium">{entry.target}</span>}
            </p>
            {entry.detail && (
              <p className="rounded-md bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                {entry.detail}
              </p>
            )}
            <p className="text-xs text-muted-foreground">{entry.time}</p>
          </div>
          {entry.unread && (
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
          )}
        </li>
      ))}
    </ul>
  );
}
