import { Check } from 'lucide-react';

import { cn } from '@/shared/lib/cn';

import type { SelectOption } from './options';
import { useControllableState } from './use-controllable-state';

export type ChipGroupProps = {
  options: SelectOption[];
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  /** Allow several chips (default) or exactly one. */
  multiple?: boolean;
  /** `soft` tinted (default), `outline`, or `solid` when selected. */
  variant?: 'soft' | 'outline' | 'solid';
  size?: 'sm' | 'default';
  /** Accessible group name. */
  label?: string;
  className?: string;
};

/**
 * Selectable chips for filters and preferences ("Remote", "Full-time"…).
 * Selected chips show a check, so state never depends on color alone.
 */
export function ChipGroup({
  options,
  value: valueProp,
  defaultValue = [],
  onChange,
  multiple = true,
  variant = 'soft',
  size = 'default',
  label,
  className,
}: ChipGroupProps) {
  const [value, setValue] = useControllableState({ value: valueProp, defaultValue, onChange });

  return (
    <div role="group" aria-label={label} className={cn('flex flex-wrap gap-2', className)}>
      {options.map((option) => {
        const selected = value.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            disabled={option.disabled}
            onClick={() =>
              setValue(
                multiple
                  ? selected
                    ? value.filter((v) => v !== option.value)
                    : [...value, option.value]
                  : selected
                    ? []
                    : [option.value],
              )
            }
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-3.5',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-sm',
              !selected && 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
              selected && variant === 'soft' && 'border-primary/30 bg-primary/10 text-primary',
              selected && variant === 'outline' && 'border-primary text-foreground',
              selected &&
                variant === 'solid' &&
                'border-primary bg-primary text-primary-foreground',
            )}
          >
            {selected ? <Check /> : option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
