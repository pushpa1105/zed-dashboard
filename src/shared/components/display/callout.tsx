import { CircleCheck, Info, OctagonAlert, TriangleAlert, X, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import { TONES } from './tone';

const KINDS: Record<
  'info' | 'success' | 'warning' | 'danger',
  { icon: LucideIcon; tone: keyof typeof TONES }
> = {
  info: { icon: Info, tone: 'info' },
  success: { icon: CircleCheck, tone: 'success' },
  warning: { icon: TriangleAlert, tone: 'warning' },
  danger: { icon: OctagonAlert, tone: 'danger' },
};

export type CalloutProps = {
  kind?: keyof typeof KINDS;
  title?: ReactNode;
  children?: ReactNode;
  /** Buttons/links under the text. */
  actions?: ReactNode;
  onDismiss?: () => void;
  /** `soft` tinted box (default), `accent` left border only. */
  appearance?: 'soft' | 'accent';
  className?: string;
};

/** Inline message box with an icon: tips, warnings, errors, confirmations. */
export function Callout({
  kind = 'info',
  title,
  children,
  actions,
  onDismiss,
  appearance = 'soft',
  className,
}: CalloutProps) {
  const { icon: Icon, tone } = KINDS[kind];
  const color = TONES[tone];

  return (
    <div
      role={kind === 'danger' ? 'alert' : 'status'}
      className={cn(
        'flex gap-3 rounded-lg p-4 text-sm',
        appearance === 'accent' && 'border-l-[3px] bg-card shadow-xs',
        className,
      )}
      style={
        appearance === 'soft'
          ? {
              background: `color-mix(in srgb, ${color} 9%, var(--card))`,
              border: `1px solid color-mix(in srgb, ${color} 22%, transparent)`,
            }
          : { borderLeftColor: color }
      }
    >
      <Icon className="mt-0.5 size-4 shrink-0" style={{ color }} aria-hidden />
      <div className="min-w-0 flex-1 space-y-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className="text-muted-foreground">{children}</div>}
        {actions && <div className="flex flex-wrap gap-2 pt-2">{actions}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="-m-1 h-fit rounded p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
