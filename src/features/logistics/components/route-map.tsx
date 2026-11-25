import { cn } from '@/shared/lib/cn';

import type { PlannedStop } from '../lib/plan';
import type { PlannedRoute } from '../model/logistics';

/**
 * Local delivery map: a quiet street grid, a river, the depot and numbered
 * stops joined in driving order. Late stops are drawn in the danger colour.
 */
export function RouteMap({
  route,
  stops,
  highlight,
  className,
  label,
}: {
  route: PlannedRoute;
  stops: PlannedStop[];
  highlight?: string | null;
  className?: string;
  label: string;
}) {
  const points = [
    { x: route.depotX, y: route.depotY },
    ...stops,
    { x: route.depotX, y: route.depotY },
  ];
  const path = points.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg
      viewBox="0 0 1000 560"
      role="img"
      aria-label={label}
      className={cn('block h-full w-full', className)}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id="street-grid" width="56" height="56" patternUnits="userSpaceOnUse">
          <path d="M 56 0 L 0 0 0 56" fill="none" stroke="var(--border)" strokeWidth="1.5" />
        </pattern>
      </defs>
      <rect width="1000" height="560" fill="url(#street-grid)" />
      {/* Arterial roads and a river give the grid some geography. */}
      <path
        d="M -10 300 C 220 260, 420 380, 640 330 S 900 260, 1010 300"
        fill="none"
        stroke="var(--chart-4)"
        strokeOpacity="0.16"
        strokeWidth="26"
      />
      <path
        d="M 0 160 L 1000 200"
        stroke="var(--muted-foreground)"
        strokeOpacity="0.18"
        strokeWidth="6"
      />
      <path
        d="M 420 0 L 480 560"
        stroke="var(--muted-foreground)"
        strokeOpacity="0.18"
        strokeWidth="6"
      />

      <path
        d={path}
        fill="none"
        stroke="var(--primary)"
        strokeOpacity="0.2"
        strokeWidth="10"
        strokeLinejoin="round"
      />
      <path
        d={path}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="3"
        strokeDasharray="10 7"
        strokeLinejoin="round"
      />

      <g>
        <rect
          x={route.depotX - 16}
          y={route.depotY - 16}
          width="32"
          height="32"
          rx="8"
          fill="var(--foreground)"
        />
        <text
          x={route.depotX}
          y={route.depotY + 5}
          textAnchor="middle"
          className="fill-background text-[14px] font-semibold"
        >
          D
        </text>
      </g>

      {stops.map((stop, i) => {
        const active = highlight === stop.id;
        return (
          <g key={stop.id}>
            <title>{stop.name}</title>
            {active && (
              <circle cx={stop.x} cy={stop.y} r={26} fill="var(--primary)" fillOpacity={0.18} />
            )}
            <circle
              cx={stop.x}
              cy={stop.y}
              r={15}
              fill={stop.late ? 'var(--destructive)' : 'var(--primary)'}
              stroke="var(--card)"
              strokeWidth="3"
            />
            <text
              x={stop.x}
              y={stop.y + 5}
              textAnchor="middle"
              className="fill-overlay-foreground text-[13px] font-semibold"
            >
              {i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
