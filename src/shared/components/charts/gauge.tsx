import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

export type GaugeProps = {
  /** 0 – 100. */
  value: number;
  /** Big number under the arc. Defaults to `value%`. */
  display?: ReactNode;
  label?: ReactNode;
  /** `segmented` draws tick bars (like a speedometer), `arc` a continuous stroke. */
  variant?: 'segmented' | 'arc';
  /** Number of ticks for the segmented variant. */
  segments?: number;
  color?: string;
  className?: string;
};

const polar = (cx: number, cy: number, r: number, angle: number) => {
  const rad = ((angle - 180) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

/** Semicircle progress gauge for a single rate (conversion, uptime, success rate). */
export function Gauge({
  value,
  display,
  label,
  variant = 'segmented',
  segments = 36,
  color = 'var(--primary)',
  className,
}: GaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const cx = 100;
  const cy = 100;

  return (
    <div className={cn('relative mx-auto w-full max-w-64', className)}>
      <svg
        viewBox="0 0 200 112"
        className="w-full"
        role="img"
        aria-label={`${clamped}%${typeof label === 'string' ? ` ${label}` : ''}`}
      >
        {variant === 'segmented' ? (
          Array.from({ length: segments }, (_, i) => {
            const angle = (i / (segments - 1)) * 180;
            const outer = polar(cx, cy, 92, angle);
            const inner = polar(cx, cy, 72, angle);
            const active = (i / (segments - 1)) * 100 <= clamped;
            return (
              <line
                key={i}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                strokeWidth={4}
                strokeLinecap="round"
                stroke={active ? color : 'var(--muted)'}
                opacity={active ? 0.35 + 0.65 * (i / (segments - 1)) : 1}
              />
            );
          })
        ) : (
          <>
            <path
              d="M 14 100 A 86 86 0 0 1 186 100"
              fill="none"
              stroke="var(--muted)"
              strokeWidth={14}
              strokeLinecap="round"
            />
            <path
              d="M 14 100 A 86 86 0 0 1 186 100"
              fill="none"
              stroke={color}
              strokeWidth={14}
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${clamped} 100`}
            />
          </>
        )}
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
        <span className="text-3xl font-semibold tracking-tight tabular-nums">
          {display ?? `${clamped}%`}
        </span>
        {label && <span className="text-xs text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}
