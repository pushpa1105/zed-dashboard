import { useMemo } from 'react';

import { cn } from '@/shared/lib/cn';

import { useReducedMotion } from '../hooks/use-reduced-motion';
import { arcPath, landDots, MAP_HEIGHT, MAP_WIDTH } from '../lib/geo';
import type { Hub, Lane } from '../model/logistics';

type NetworkMapProps = {
  hubs: Hub[];
  lanes: Pick<Lane, 'id' | 'from' | 'to' | 'active' | 'shipments'>[];
  /** Zoom to one lane (hub ids) and dim everything else. */
  focus?: { from: string; to: string; progress?: number };
  /** Show hub names. */
  labels?: boolean;
  className?: string;
  ariaLabel?: string;
};

/**
 * Stylised network map: dot-matrix land, curved lanes weighted by volume,
 * animated vehicles on active lanes (static for reduced-motion users), hubs.
 */
export function NetworkMap({
  hubs,
  lanes,
  focus,
  labels = true,
  className,
  ariaLabel,
}: NetworkMapProps) {
  const reduced = useReducedMotion();
  const dots = landDots();
  const byId = useMemo(() => new Map(hubs.map((h) => [h.id, h])), [hubs]);
  const max = Math.max(1, ...lanes.map((l) => l.shipments));

  const viewBox = useMemo(() => {
    if (!focus) return `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`;
    const a = byId.get(focus.from);
    const b = byId.get(focus.to);
    if (!a || !b) return `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`;
    const pad = 90;
    let x = Math.min(a.x, b.x) - pad;
    let y = Math.min(a.y, b.y) - pad;
    let w = Math.abs(a.x - b.x) + pad * 2;
    let h = Math.abs(a.y - b.y) + pad * 2;
    // Keep the canvas aspect so dots stay round and the frame stays filled.
    const ratio = MAP_WIDTH / MAP_HEIGHT;
    if (w / h > ratio) {
      const nh = w / ratio;
      y -= (nh - h) / 2;
      h = nh;
    } else {
      const nw = h * ratio;
      x -= (nw - w) / 2;
      w = nw;
    }
    return `${x.toFixed(0)} ${y.toFixed(0)} ${w.toFixed(0)} ${h.toFixed(0)}`;
  }, [focus, byId]);

  const focusPath =
    focus && byId.get(focus.from) && byId.get(focus.to)
      ? arcPath(byId.get(focus.from)!, byId.get(focus.to)!)
      : null;
  const visibleHubIds = focus ? new Set([focus.from, focus.to]) : null;

  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={ariaLabel}
      className={cn('block h-full w-full', className)}
    >
      <g className="fill-muted-foreground/40 dark:fill-muted-foreground/35">
        {dots.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={2.6} />
        ))}
      </g>

      {!focus &&
        lanes.map((lane) => {
          const a = byId.get(lane.from);
          const b = byId.get(lane.to);
          if (!a || !b) return null;
          const d = arcPath(a, b);
          const weight = 1.2 + (lane.shipments / max) * 2.6;
          return (
            <g key={lane.id}>
              <path
                d={d}
                fill="none"
                stroke="var(--primary)"
                strokeWidth={weight}
                strokeLinecap="round"
                strokeOpacity={lane.active ? 0.55 : 0.25}
                strokeDasharray={lane.active ? undefined : '4 6'}
              />
              {lane.active && !reduced && (
                <circle r={4.5} fill="var(--primary)" stroke="var(--card)" strokeWidth={2}>
                  <animateMotion
                    dur={`${6 + (lane.id.length % 5) * 1.7}s`}
                    repeatCount="indefinite"
                    path={d}
                    begin={`-${(lane.shipments % 7) * 0.9}s`}
                  />
                </circle>
              )}
            </g>
          );
        })}

      {focusPath && (
        <g>
          <path
            d={focusPath}
            fill="none"
            stroke="var(--primary)"
            strokeOpacity={0.25}
            strokeWidth={6}
            strokeLinecap="round"
          />
          <path
            d={focusPath}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={3}
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${Math.round((focus?.progress ?? 0) * 100)} 100`}
          />
          {(focus?.progress ?? 0) > 0 && (focus?.progress ?? 0) < 1 && (
            <circle r={7} fill="var(--primary)" stroke="var(--card)" strokeWidth={3}>
              <animateMotion
                dur="0.001s"
                fill="freeze"
                keyPoints={`${focus!.progress};${focus!.progress}`}
                keyTimes="0;1"
                calcMode="linear"
                path={focusPath}
              />
            </circle>
          )}
        </g>
      )}

      {hubs
        .filter((hub) => !visibleHubIds || visibleHubIds.has(hub.id))
        .map((hub) => (
          <g key={hub.id}>
            <title>{hub.name}</title>
            <circle cx={hub.x} cy={hub.y} r={10} fill="var(--primary)" fillOpacity={0.14} />
            <circle
              cx={hub.x}
              cy={hub.y}
              r={4.5}
              fill="var(--card)"
              stroke="var(--primary)"
              strokeWidth={2.5}
            />
            {labels && (
              <text
                x={hub.x + 12}
                y={hub.y + 4}
                className="fill-foreground text-[13px] font-medium"
                style={{ paintOrder: 'stroke', stroke: 'var(--card)', strokeWidth: 4 }}
              >
                {hub.name}
              </text>
            )}
          </g>
        ))}
    </svg>
  );
}
