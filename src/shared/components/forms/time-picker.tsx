import { Clock } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/shared/lib/cn';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';

import { formatTime, pad, pickerTriggerClass } from './picker-utils';
import { useControllableState } from './use-controllable-state';

export type TimePickerProps = {
  /** "HH:mm" in 24h format. */
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string | null) => void;
  /** Minute granularity. */
  step?: 1 | 5 | 10 | 15 | 30;
  /** Display in 12h with AM/PM (value stays 24h). */
  hour12?: boolean;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  className?: string;
};

/** Hour and minute columns in a popover. Stores "HH:mm". */
export function TimePicker({
  value: valueProp,
  defaultValue = null,
  onChange,
  step = 5,
  hour12,
  placeholder = 'Pick a time',
  disabled,
  invalid,
  id,
  className,
}: TimePickerProps) {
  const [value, setValue] = useControllableState<string | null>({
    value: valueProp,
    defaultValue,
    onChange,
  });
  const [open, setOpen] = useState(false);
  const [h, m] = (value ?? '').split(':').map(Number);
  const minutes = Array.from({ length: 60 / step }, (_, i) => i * step);

  const set = (hour: number, minute: number) => setValue(`${pad(hour)}:${pad(minute)}`);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          id={id}
          type="button"
          aria-invalid={invalid}
          className={cn(pickerTriggerClass, className)}
        >
          <Clock className="size-4 text-muted-foreground" />
          <span className={cn('flex-1 tabular-nums', !value && 'text-muted-foreground')}>
            {value ? formatTime(value, hour12) : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="flex w-auto gap-1 p-1" align="start">
        <Column
          label="Hour"
          items={Array.from({ length: 24 }, (_, i) => i)}
          selected={h}
          render={(i) => (hour12 ? `${i % 12 || 12} ${i < 12 ? 'AM' : 'PM'}` : pad(i))}
          onPick={(i) => set(i, Number.isNaN(m) || m === undefined ? 0 : m)}
        />
        <Column
          label="Minute"
          items={minutes}
          selected={m}
          render={pad}
          onPick={(i) => {
            set(Number.isNaN(h) || h === undefined ? 9 : h, i);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function Column({
  label,
  items,
  selected,
  render,
  onPick,
}: {
  label: string;
  items: number[];
  selected?: number;
  render: (n: number) => string;
  onPick: (n: number) => void;
}) {
  return (
    <ul aria-label={label} role="listbox" className="h-56 w-20 overflow-y-auto">
      {items.map((i) => (
        <li key={i}>
          <button
            type="button"
            role="option"
            aria-selected={selected === i}
            onClick={() => onPick(i)}
            ref={(el) => {
              if (el && selected === i) el.scrollIntoView({ block: 'center' });
            }}
            className={cn(
              'w-full rounded-md px-2 py-1 text-center text-sm tabular-nums hover:bg-muted',
              selected === i && 'bg-primary text-primary-foreground hover:bg-primary',
            )}
          >
            {render(i)}
          </button>
        </li>
      ))}
    </ul>
  );
}
