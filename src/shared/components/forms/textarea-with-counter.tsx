import { useState, type ComponentProps } from 'react';

import { cn } from '@/shared/lib/cn';
import { Textarea } from '@/shared/ui/textarea';

export type TextareaWithCounterProps = ComponentProps<typeof Textarea> & {
  /** Soft limit shown in the counter; the counter turns red past it. */
  maxLength?: number;
  /** Prevent typing past `maxLength` (default) or only warn. */
  hardLimit?: boolean;
  /** Max height before scrolling, in rows. Grows with content until then. */
  maxRows?: number;
};

/** Auto-growing textarea with a live character counter. */
export function TextareaWithCounter({
  maxLength,
  hardLimit = true,
  maxRows = 10,
  className,
  value,
  defaultValue,
  onChange,
  ...props
}: TextareaWithCounterProps) {
  const [internal, setInternal] = useState(String(defaultValue ?? ''));
  const text = value !== undefined ? String(value) : internal;
  const over = maxLength !== undefined && text.length > maxLength;

  return (
    <div className="relative">
      <Textarea
        {...props}
        value={text}
        maxLength={hardLimit ? maxLength : undefined}
        aria-invalid={props['aria-invalid'] ?? (over || undefined)}
        onChange={(e) => {
          if (value === undefined) setInternal(e.target.value);
          onChange?.(e);
        }}
        className={cn('pb-6', className)}
        style={{ maxHeight: `calc(${maxRows} * 1.5em + 2rem)` }}
      />
      {maxLength !== undefined && (
        <span
          aria-live="polite"
          className={cn(
            'pointer-events-none absolute right-2.5 bottom-1.5 text-[11px] tabular-nums',
            over ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {text.length}/{maxLength}
        </span>
      )}
    </div>
  );
}
