import { cn } from '@/shared/lib/cn';

import { STATUS_TONES } from './status-tones';
import { TONES, type Tone } from './tone';

export type StatusBadgeProps = {
  status: string;
  /** Visible text; defaults to the status with underscores replaced. */
  label?: string;
  tone?: Tone;
  /** `badge` = tinted pill, `dot` = dot + text only (dense tables). */
  variant?: 'badge' | 'dot';
  className?: string;
};

/** Status indicator: always a dot plus a text label, never color alone. */
export function StatusBadge({
  status,
  label,
  tone,
  variant = 'badge',
  className,
}: StatusBadgeProps) {
  const resolved = tone ?? STATUS_TONES[status.toLowerCase()] ?? 'neutral';
  const color = TONES[resolved];
  const text = label ?? status.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap',
        variant === 'badge' && 'h-6 rounded-full px-2',
        className,
      )}
      style={
        variant === 'badge'
          ? {
              background: `color-mix(in srgb, ${color} 12%, transparent)`,
              color: `color-mix(in srgb, ${color} 80%, var(--foreground))`,
            }
          : undefined
      }
    >
      <span className="size-1.5 shrink-0 rounded-full" style={{ background: color }} />
      {text}
    </span>
  );
}
