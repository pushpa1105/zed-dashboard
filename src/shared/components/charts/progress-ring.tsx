import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

export type ProgressRingProps = {
  /** 0 – 100. */
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  /** Content in the middle. Defaults to the percentage. */
  children?: ReactNode;
  className?: string;
};

/** Compact circular progress for tiles, lists and avatars. */
export function ProgressRing({
  value,
  size = 56,
  strokeWidth = 6,
  color = 'var(--primary)',
  children,
  className,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const r = (size - strokeWidth) / 2;

  return (
    <div
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${clamped} 100`}
          className="transition-[stroke-dasharray] duration-500"
        />
      </svg>
      <span className="absolute text-xs font-semibold tabular-nums">
        {children ?? `${Math.round(clamped)}%`}
      </span>
    </div>
  );
}
