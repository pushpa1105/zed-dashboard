import { X, type LucideIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

export type BannerProps = {
  children: ReactNode;
  icon?: LucideIcon;
  /** A link or button at the end of the message. */
  action?: ReactNode;
  /** `brand` filled with the primary color, `muted` subtle, `warning` attention. */
  tone?: 'brand' | 'muted' | 'warning';
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
};

/** Full-width announcement strip for the top of a page or app. */
export function Banner({
  children,
  icon: Icon,
  action,
  tone = 'brand',
  dismissible = true,
  onDismiss,
  className,
}: BannerProps) {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 text-sm',
        tone === 'brand' && 'bg-primary text-primary-foreground',
        tone === 'muted' && 'border bg-muted/60 text-foreground',
        tone === 'warning' && 'bg-warning/15 text-foreground',
        className,
      )}
    >
      {Icon && <Icon className="size-4 shrink-0" aria-hidden />}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
        <span>{children}</span>
        {action}
      </div>
      {dismissible && (
        <button
          type="button"
          aria-label="Dismiss"
          className="rounded p-1 opacity-75 hover:opacity-100"
          onClick={() => {
            setOpen(false);
            onDismiss?.();
          }}
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
