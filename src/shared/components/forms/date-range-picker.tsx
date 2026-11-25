import { format, isSameDay, subDays } from 'date-fns';
import { CalendarRange } from 'lucide-react';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Calendar } from '@/shared/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';

import { DEFAULT_RANGE_PRESETS, type DateRangePreset } from './date-presets';
import { pickerTriggerClass } from './picker-utils';
import { useControllableState } from './use-controllable-state';

export type { DateRange };
export type { DateRangePreset };

export type DateRangePickerProps = {
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  onChange?: (value: DateRange | null) => void;
  presets?: DateRangePreset[] | false;
  placeholder?: string;
  /** Months shown side by side (2 on wide screens by default). */
  numberOfMonths?: number;
  applyLabel?: string;
  cancelLabel?: string;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  className?: string;
};

const sameRange = (a?: DateRange | null, b?: DateRange | null) =>
  !!a?.from && !!b?.from && !!a.to && !!b.to && isSameDay(a.from, b.from) && isSameDay(a.to, b.to);

/**
 * Date range with presets and a two-month calendar. Changes are staged and
 * committed with "Apply", so half-picked ranges never reach the query.
 */
export function DateRangePicker({
  value: valueProp,
  defaultValue = null,
  onChange,
  presets = DEFAULT_RANGE_PRESETS,
  placeholder = 'Pick a date range',
  numberOfMonths = 2,
  applyLabel = 'Apply',
  cancelLabel = 'Cancel',
  disabled,
  invalid,
  id,
  className,
}: DateRangePickerProps) {
  const [value, setValue] = useControllableState<DateRange | null>({
    value: valueProp,
    defaultValue,
    onChange,
  });
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>(value ?? undefined);

  const label = value?.from
    ? value.to && !isSameDay(value.from, value.to)
      ? `${format(value.from, 'MMM d, yyyy')} – ${format(value.to, 'MMM d, yyyy')}`
      : format(value.from, 'MMM d, yyyy')
    : placeholder;
  const activePreset = presets ? presets.find((p) => sameRange(p.range(), value)) : undefined;

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setDraft(value ?? undefined);
      }}
    >
      <PopoverTrigger asChild disabled={disabled}>
        <button
          id={id}
          type="button"
          aria-invalid={invalid}
          className={cn(pickerTriggerClass, className)}
        >
          <CalendarRange className="size-4 text-muted-foreground" />
          <span className={cn('flex-1 truncate', !value?.from && 'text-muted-foreground')}>
            {activePreset ? activePreset.label : label}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col sm:flex-row">
          {presets && (
            <ul className="flex gap-1 overflow-x-auto border-b p-2 sm:w-40 sm:flex-col sm:border-r sm:border-b-0">
              {presets.map((preset) => {
                const active = sameRange(preset.range(), draft);
                return (
                  <li key={preset.key}>
                    <button
                      type="button"
                      onClick={() => setDraft(preset.range())}
                      className={cn(
                        'w-full rounded-md px-2.5 py-1.5 text-left text-sm whitespace-nowrap hover:bg-muted',
                        active && 'bg-accent font-medium text-accent-foreground',
                      )}
                    >
                      {preset.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div>
            <Calendar
              mode="range"
              selected={draft}
              onSelect={setDraft}
              numberOfMonths={numberOfMonths}
              defaultMonth={draft?.from ? subDays(draft.from, 0) : undefined}
            />
            <div className="flex items-center justify-between gap-2 border-t p-2">
              <span className="text-xs text-muted-foreground tabular-nums">
                {draft?.from ? format(draft.from, 'MMM d') : '—'} →{' '}
                {draft?.to ? format(draft.to, 'MMM d, yyyy') : '—'}
              </span>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  {cancelLabel}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!draft?.from}
                  onClick={() => {
                    setValue(draft?.from ? { from: draft.from, to: draft.to ?? draft.from } : null);
                    setOpen(false);
                  }}
                >
                  {applyLabel}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
