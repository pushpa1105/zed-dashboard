import type { KeyboardEvent, ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import { useControllableState } from './use-controllable-state';

export type SegmentOption<T extends string> = {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
};

export type SegmentedControlProps<T extends string> = {
  options: SegmentOption<T>[];
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
  size?: 'sm' | 'md';
  /** Stretch segments to fill the width. */
  block?: boolean;
  'aria-label'?: string;
  className?: string;
};

/** iOS-style single choice for 2–5 short options (view modes, periods, units). */
export function SegmentedControl<T extends string>({
  options,
  value: valueProp,
  defaultValue,
  onChange,
  size = 'md',
  block,
  'aria-label': ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  const [value, setValue] = useControllableState<T>({
    value: valueProp,
    defaultValue: defaultValue ?? options[0]!.value,
    onChange,
  });
  const enabled = options.filter((o) => !o.disabled);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const i = enabled.findIndex((o) => o.value === value);
    const next = enabled[(i + (e.key === 'ArrowRight' ? 1 : -1) + enabled.length) % enabled.length];
    if (next) setValue(next.value);
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-lg bg-muted p-0.5',
        block && 'flex w-full',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            disabled={option.disabled}
            onClick={() => setValue(option.value)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap text-muted-foreground transition-all outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 [&_svg]:size-3.5',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-sm',
              block && 'flex-1',
              active &&
                'bg-background text-foreground shadow-xs ring-1 ring-border dark:bg-input/60',
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
