import { format, setHours, setMinutes } from 'date-fns';

import { cn } from '@/shared/lib/cn';

import { DatePicker } from './date-picker';
import { TimePicker } from './time-picker';
import { useControllableState } from './use-controllable-state';

export type DateTimePickerProps = {
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (value: Date | null) => void;
  step?: 1 | 5 | 10 | 15 | 30;
  hour12?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  className?: string;
};

/** Date + time side by side, producing a single `Date`. */
export function DateTimePicker({
  value: valueProp,
  defaultValue = null,
  onChange,
  step,
  hour12,
  disabled,
  invalid,
  id,
  className,
}: DateTimePickerProps) {
  const [value, setValue] = useControllableState<Date | null>({
    value: valueProp,
    defaultValue,
    onChange,
  });

  return (
    <div className={cn('grid grid-cols-[1fr_8.5rem] gap-2', className)}>
      <DatePicker
        id={id}
        value={value}
        clearable={false}
        disabled={disabled}
        invalid={invalid}
        onChange={(date) => {
          if (!date) return setValue(null);
          const base = value ?? setMinutes(setHours(date, 9), 0);
          setValue(setMinutes(setHours(date, base.getHours()), base.getMinutes()));
        }}
      />
      <TimePicker
        step={step}
        hour12={hour12}
        disabled={disabled || !value}
        invalid={invalid}
        value={value ? format(value, 'HH:mm') : null}
        onChange={(time) => {
          if (!value || !time) return;
          const [h = 0, m = 0] = time.split(':').map(Number);
          setValue(setMinutes(setHours(value, h), m));
        }}
      />
    </div>
  );
}
