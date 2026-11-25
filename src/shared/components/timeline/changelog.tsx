import type { ReactNode } from 'react';

import { Tag } from '@/shared/components/display/tag';
import type { Tone } from '@/shared/components/display/tone';
import { cn } from '@/shared/lib/cn';

export type ChangeType = 'new' | 'improved' | 'fixed' | 'deprecated' | 'security';

export type Release = {
  version: string;
  date: ReactNode;
  title?: ReactNode;
  /** Short paragraph above the entries. */
  summary?: ReactNode;
  entries: Array<{ type: ChangeType; text: ReactNode }>;
};

const TYPE_TONE: Record<ChangeType, Tone> = {
  new: 'primary',
  improved: 'blue',
  fixed: 'success',
  deprecated: 'warning',
  security: 'danger',
};

/**
 * Release notes: a sticky version column on the left, tagged entries on the
 * right. The newest release gets a "Latest" marker.
 */
export function Changelog({
  releases,
  typeLabels = {
    new: 'New',
    improved: 'Improved',
    fixed: 'Fixed',
    deprecated: 'Deprecated',
    security: 'Security',
  },
  latestLabel = 'Latest',
  className,
}: {
  releases: Release[];
  typeLabels?: Record<ChangeType, string>;
  latestLabel?: string;
  className?: string;
}) {
  return (
    <ol className={cn('divide-y', className)}>
      {releases.map((release, i) => (
        <li
          key={release.version}
          className="grid gap-4 py-6 first:pt-0 last:pb-0 md:grid-cols-[10rem_1fr]"
        >
          <div className="md:sticky md:top-20 md:self-start">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold">v{release.version}</span>
              {i === 0 && (
                <Tag tone="primary" size="sm" pill>
                  {latestLabel}
                </Tag>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{release.date}</p>
          </div>
          <div className="min-w-0 space-y-3">
            {release.title && <p className="text-base font-semibold">{release.title}</p>}
            {release.summary && <p className="text-sm text-muted-foreground">{release.summary}</p>}
            <ul className="space-y-2">
              {release.entries.map((entry, j) => (
                <li key={j} className="flex items-start gap-3 text-sm">
                  <Tag
                    tone={TYPE_TONE[entry.type]}
                    size="sm"
                    className="mt-0.5 w-[5.5rem] shrink-0 justify-center"
                  >
                    {typeLabels[entry.type]}
                  </Tag>
                  <span className="min-w-0">{entry.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </li>
      ))}
    </ol>
  );
}
