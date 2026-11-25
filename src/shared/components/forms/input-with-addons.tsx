import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

export type InputWithAddonsProps = Omit<ComponentProps<'input'>, 'prefix'> & {
  /** Inside the field, before the text (icon, "$"). */
  leading?: ReactNode;
  /** Inside the field, after the text (unit, spinner, button). */
  trailing?: ReactNode;
  /** Attached block before the field ("https://"). */
  prepend?: ReactNode;
  /** Attached block after the field (".acme.com", a button). */
  append?: ReactNode;
  invalid?: boolean;
  containerClassName?: string;
};

/** Text input with inline icons/units and attached addons on either side. */
export function InputWithAddons({
  leading,
  trailing,
  prepend,
  append,
  invalid,
  className,
  containerClassName,
  disabled,
  ...props
}: InputWithAddonsProps) {
  const addon =
    'flex h-full items-center bg-muted/60 px-2.5 text-sm text-muted-foreground whitespace-nowrap';
  return (
    <div
      aria-invalid={invalid}
      className={cn(
        'flex h-9 w-full items-center overflow-hidden rounded-lg border border-input bg-transparent text-sm transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30',
        disabled && 'opacity-50',
        containerClassName,
      )}
    >
      {prepend && <span className={cn(addon, 'border-r')}>{prepend}</span>}
      {leading && (
        <span className="flex pl-2.5 text-muted-foreground [&_svg]:size-4">{leading}</span>
      )}
      <input
        {...props}
        disabled={disabled}
        aria-invalid={invalid}
        className={cn(
          'h-full w-full min-w-0 flex-1 bg-transparent px-3 outline-none placeholder:text-muted-foreground',
          className,
        )}
      />
      {trailing && (
        <span className="flex pr-2.5 text-muted-foreground [&_svg]:size-4">{trailing}</span>
      )}
      {append && <span className={cn(addon, 'border-l')}>{append}</span>}
    </div>
  );
}
