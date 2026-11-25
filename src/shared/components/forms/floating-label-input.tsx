import { useId, type ComponentProps } from 'react';

import { cn } from '@/shared/lib/cn';

export type FloatingLabelInputProps = Omit<ComponentProps<'input'>, 'placeholder'> & {
  label: string;
  /** `outlined` (default) floats the label onto the border; `filled` keeps it inside a tinted field. */
  variant?: 'outlined' | 'filled';
  invalid?: boolean;
  /** Message under the field (error text when `invalid`). */
  hint?: string;
};

/**
 * Material-style input whose label sits in the field and floats up on focus
 * or when filled. Pure CSS (peer + placeholder-shown), no state.
 */
export function FloatingLabelInput({
  label,
  variant = 'outlined',
  invalid,
  hint,
  className,
  id: idProp,
  ...props
}: FloatingLabelInputProps) {
  const generated = useId();
  const id = idProp ?? generated;
  const filled = variant === 'filled';

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="relative">
        <input
          {...props}
          id={id}
          placeholder=" "
          aria-invalid={invalid || undefined}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={cn(
            'peer h-12 w-full rounded-lg border border-input bg-transparent px-3 text-sm transition-colors outline-none focus:border-ring focus:ring-3 focus:ring-ring/40 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20',
            filled ? 'border-transparent bg-muted pt-4 focus:bg-background' : 'dark:bg-input/30',
          )}
        />
        <label
          htmlFor={id}
          className={cn(
            'pointer-events-none absolute left-3 origin-left text-sm text-muted-foreground transition-all duration-150',
            'top-1/2 -translate-y-1/2',
            filled
              ? 'peer-focus:top-3 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs'
              : 'px-1 peer-focus:top-0 peer-focus:bg-card peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:bg-card peer-[:not(:placeholder-shown)]:text-xs',
            '-ml-1 peer-aria-invalid:text-destructive',
          )}
        >
          {label}
        </label>
      </div>
      {hint && (
        <p
          id={`${id}-hint`}
          className={cn('text-xs', invalid ? 'text-destructive' : 'text-muted-foreground')}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
