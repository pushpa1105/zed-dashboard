import { CircleAlert, CircleCheck, Loader2, X } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

export type InputStatus = 'idle' | 'validating' | 'valid' | 'invalid';

export type StatusInputProps = Omit<ComponentProps<'input'>, 'size' | 'onChange' | 'value'> & {
  value: string;
  onChange: (value: string) => void;
  /** Icon on the right: spinner, check or alert. */
  status?: InputStatus;
  /** Shows a clear button when there is text. */
  clearable?: boolean;
  clearLabel?: string;
  leading?: ReactNode;
  size?: 'sm' | 'default' | 'lg';
};

const SIZE = { sm: 'h-8 text-[0.8125rem]', default: 'h-9 text-sm', lg: 'h-10 text-sm' } as const;

/**
 * Input with an inline validation state and an optional clear button, for
 * live checks (username availability, coupon codes, URLs). The status icon
 * always comes with the field's own message, never color alone.
 */
export function StatusInput({
  value,
  onChange,
  status = 'idle',
  clearable,
  clearLabel = 'Clear',
  leading,
  size = 'default',
  className,
  ...props
}: StatusInputProps) {
  return (
    <div
      className={cn(
        'flex w-full items-center gap-2 rounded-lg border border-input bg-transparent px-3 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30',
        status === 'invalid' && 'border-destructive focus-within:ring-destructive/20',
        status === 'valid' && 'border-success/60',
        SIZE[size],
        className,
      )}
    >
      {leading && (
        <span className="flex shrink-0 text-muted-foreground [&>svg]:size-4">{leading}</span>
      )}
      <input
        {...props}
        value={value}
        aria-invalid={status === 'invalid' || undefined}
        onChange={(e) => onChange(e.target.value)}
        className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
      />
      {clearable && value && (
        <button
          type="button"
          aria-label={clearLabel}
          onClick={() => onChange('')}
          className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}
      {status === 'validating' && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
      {status === 'valid' && <CircleCheck className="size-4 text-success" aria-hidden />}
      {status === 'invalid' && <CircleAlert className="size-4 text-destructive" aria-hidden />}
    </div>
  );
}
