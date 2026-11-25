import { format } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';
import { useState } from 'react';
import type { Matcher } from 'react-day-picker';

import { cn } from '@/shared/lib/cn';
import { Calendar } from '@/shared/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';

import { pickerTriggerClass } from './picker-utils';
import { useControllableState } from './use-controllable-state';

export type DatePickerProps = {
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (value: Date | null) => void;
  placeholder?: string;
  /** date-fns format string. */
  displayFormat?: string;
  /** Days that can't be picked, e.g. `{ before: new Date() }` or `{ dayOfWeek: [0, 6] }`. */
  disabledDays?: Matcher | Matcher[];
  /** Month/year dropdowns in the caption (good for birthdays). */
  dropdowns?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  className?: string;
};

/** Single date in a popover calendar. */
export function DatePicker({
  value: valueProp,
  defaultValue = null,
  onChange,
  placeholder = 'Pick a date',
  displayFormat = 'PP',
  disabledDays,
  dropdowns,
  clearable = true,
  disabled,
  invalid,
  id,
  className,
}: DatePickerProps) {
  const [value, setValue] = useControllableState<Date | null>({
    value: valueProp,
    defaultValue,
    onChange,
  });
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          id={id}
          type="button"
          aria-invalid={invalid}
          className={cn(pickerTriggerClass, className)}
        >
          <CalendarIcon className="size-4 text-muted-foreground" />
          <span className={cn('flex-1 truncate', !value && 'text-muted-foreground')}>
            {value ? format(value, displayFormat) : placeholder}
          </span>
          {clearable && value && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Clear date"
              className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
              onPointerDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                setValue(null);
              }}
            >
              <X className="size-3.5" />
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ?? undefined}
          defaultMonth={value ?? undefined}
          captionLayout={dropdowns ? 'dropdown' : 'label'}
          disabled={disabledDays}
          onSelect={(date) => {
            setValue(date ?? null);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
