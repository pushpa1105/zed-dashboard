import type { ReactNode } from 'react';

import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { cn } from '@/shared/lib/cn';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

export type RoadmapStatus = 'shipped' | 'in_progress' | 'planned' | 'at_risk';

export type RoadmapItem = {
  id: string;
  title: string;
  /** Index of the first period it covers (0-based). */
  start: number;
  /** Index of the last period it covers (inclusive). */
  end: number;
  status: RoadmapStatus;
  owner?: string;
};

export type RoadmapLane = { id: string; label: ReactNode; items: RoadmapItem[] };

const STATUS_STYLE: Record<RoadmapStatus, string> = {
  shipped: 'border-success/40 bg-success/12 text-foreground',
  in_progress: 'border-primary/40 bg-primary/12 text-foreground',
  planned: 'border-dashed border-border bg-muted/50 text-muted-foreground',
  at_risk: 'border-destructive/40 bg-destructive/10 text-foreground',
};
const STATUS_DOT: Record<RoadmapStatus, string> = {
  shipped: 'bg-success',
  in_progress: 'bg-primary',
  planned: 'bg-muted-foreground',
  at_risk: 'bg-destructive',
};

/**
 * Lanes × periods grid; each initiative is a bar spanning its periods.
 * Items in a lane stack in rows so overlapping bars never collide.
 */
export function Roadmap({
  periods,
  lanes,
  currentPeriod,
  statusLabels = {
    shipped: 'Shipped',
    in_progress: 'In progress',
    planned: 'Planned',
    at_risk: 'At risk',
  },
  className,
}: {
  periods: string[];
  lanes: RoadmapLane[];
  /** Highlights a column (e.g. this quarter). */
  currentPeriod?: number;
  statusLabels?: Record<RoadmapStatus, string>;
  className?: string;
}) {
  const cols = `10rem repeat(${periods.length}, minmax(9rem, 1fr))`;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {(Object.keys(STATUS_DOT) as RoadmapStatus[]).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className={cn('size-2 rounded-full', STATUS_DOT[s])} /> {statusLabels[s]}
          </span>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border">
        <div className="min-w-max">
          <div className="grid border-b bg-muted/40" style={{ gridTemplateColumns: cols }}>
            <div className="px-4 py-2.5" />
            {periods.map((p, i) => (
              <div
                key={p}
                className={cn(
                  'border-l px-3 py-2.5 text-xs font-medium text-muted-foreground',
                  i === currentPeriod && 'bg-primary/8 text-primary',
                )}
              >
                {p}
              </div>
            ))}
          </div>
          {lanes.map((lane) => {
            // Greedy row packing: put each bar on the first row where it fits.
            const rows: RoadmapItem[][] = [];
            for (const item of [...lane.items].sort((a, b) => a.start - b.start)) {
              const row = rows.find((r) =>
                r.every((x) => x.end < item.start || x.start > item.end),
              );
              if (row) row.push(item);
              else rows.push([item]);
            }
            return (
              <div
                key={lane.id}
                className="relative grid border-b last:border-b-0"
                style={{ gridTemplateColumns: cols }}
              >
                <div className="row-span-full flex items-start px-4 py-3 text-sm font-medium">
                  {lane.label}
                </div>
                {periods.map((p, i) => (
                  <div
                    key={p}
                    aria-hidden
                    className={cn('border-l', i === currentPeriod && 'bg-primary/4')}
                    style={{ gridColumn: i + 2, gridRow: `1 / span ${Math.max(rows.length, 1)}` }}
                  />
                ))}
                {rows.map((row, r) =>
                  row.map((item) => (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            'relative z-10 mx-1.5 my-1.5 flex h-9 items-center gap-2 overflow-hidden rounded-lg border px-2.5 text-xs font-medium',
                            STATUS_STYLE[item.status],
                          )}
                          style={{
                            gridColumn: `${item.start + 2} / ${item.end + 3}`,
                            gridRow: r + 1,
                          }}
                        >
                          <span
                            className={cn(
                              'size-1.5 shrink-0 rounded-full',
                              STATUS_DOT[item.status],
                            )}
                          />
                          <span className="truncate">{item.title}</span>
                          {item.owner && (
                            <InitialsAvatar name={item.owner} size="xs" className="ml-auto" />
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {item.title} · {statusLabels[item.status]} · {periods[item.start]}
                        {item.end !== item.start && `–${periods[item.end]}`}
                      </TooltipContent>
                    </Tooltip>
                  )),
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
