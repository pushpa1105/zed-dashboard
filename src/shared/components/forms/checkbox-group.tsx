import { useId } from 'react';

import { cn } from '@/shared/lib/cn';
import { Checkbox } from '@/shared/ui/checkbox';
import { Label } from '@/shared/ui/label';

import type { SelectOption } from './options';
import { useControllableState } from './use-controllable-state';

export type CheckboxGroupProps = {
  options: SelectOption[];
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  /** Adds a parent "select all" checkbox with an indeterminate state. */
  selectAllLabel?: string;
  orientation?: 'vertical' | 'horizontal';
  disabled?: boolean;
  className?: string;
};

/** A list of checkboxes with an optional tri-state "select all" parent. */
export function CheckboxGroup({
  options,
  value: valueProp,
  defaultValue = [],
  onChange,
  selectAllLabel,
  orientation = 'vertical',
  disabled,
  className,
}: CheckboxGroupProps) {
  const id = useId();
  const [value, setValue] = useControllableState({ value: valueProp, defaultValue, onChange });
  const enabled = options.filter((o) => !o.disabled).map((o) => o.value);
  const count = enabled.filter((v) => value.includes(v)).length;
  const all = count === 0 ? false : count === enabled.length ? true : 'indeterminate';

  return (
    <div role="group" className={cn('space-y-3', className)}>
      {selectAllLabel && (
        <div className="flex items-center gap-2 border-b pb-3">
          <Checkbox
            id={`${id}-all`}
            checked={all}
            disabled={disabled}
            onCheckedChange={() => setValue(all === true ? [] : enabled)}
          />
          <Label htmlFor={`${id}-all`} className="font-medium">
            {selectAllLabel}
          </Label>
          <span className="ml-auto text-xs text-muted-foreground tabular-nums">
            {count}/{enabled.length}
          </span>
        </div>
      )}
      <div
        className={cn(
          orientation === 'horizontal' ? 'flex flex-wrap gap-x-5 gap-y-2' : 'space-y-2.5',
          selectAllLabel && orientation === 'vertical' && 'pl-6',
        )}
      >
        {options.map((o) => (
          <div key={o.value} className="flex items-start gap-2">
            <Checkbox
              id={`${id}-${o.value}`}
              checked={value.includes(o.value)}
              disabled={disabled || o.disabled}
              onCheckedChange={(c) =>
                setValue((prev) =>
                  c === true ? [...prev, o.value] : prev.filter((v) => v !== o.value),
                )
              }
            />
            <div className="grid gap-0.5 leading-none">
              <Label htmlFor={`${id}-${o.value}`} className="font-normal">
                {o.label}
              </Label>
              {o.description && <p className="text-xs text-muted-foreground">{o.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
