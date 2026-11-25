import { CalendarRange, X } from 'lucide-react';

import { formatDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Calendar } from '@/shared/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';

/** ISO dates (`YYYY-MM-DD`); either side may be open. */
export type DateRangeValue = { from?: string; to?: string };

const toIso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const fromIso = (iso?: string) => (iso ? new Date(`${iso}T00:00:00`) : undefined);

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toIso(d);
};

export type DateRangePreset = { label: string; days: number };

const DEFAULT_PRESETS: DateRangePreset[] = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'Last 12 months', days: 365 },
];

/** Date range filter: quick presets plus a two-month range calendar. */
export function DataTableDateRangeFilter({
  title,
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  clearLabel = 'Clear',
}: {
  title: string;
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  presets?: DateRangePreset[];
  clearLabel?: string;
}) {
  const active = !!(value.from || value.to);
  const summary = active
    ? `${value.from ? formatDate(value.from, 'MMM D') : '…'} – ${value.to ? formatDate(value.to, 'MMM D, YYYY') : '…'}`
    : null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="border-dashed">
          <CalendarRange /> {title}
          {summary && <span className="font-normal text-muted-foreground">· {summary}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="flex w-auto gap-0 p-0">
        <div className="flex w-36 flex-col gap-0.5 border-r p-2">
          {presets.map((preset) => (
            <Button
              key={preset.label}
              variant="ghost"
              size="sm"
              className="justify-start font-normal"
              onClick={() => onChange({ from: daysAgo(preset.days), to: toIso(new Date()) })}
            >
              {preset.label}
            </Button>
          ))}
          {active && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-auto justify-start font-normal text-muted-foreground"
              onClick={() => onChange({})}
            >
              <X /> {clearLabel}
            </Button>
          )}
        </div>
        <Calendar
          mode="range"
          numberOfMonths={2}
          defaultMonth={fromIso(value.from)}
          selected={{ from: fromIso(value.from), to: fromIso(value.to) }}
          onSelect={(range) =>
            onChange({
              from: range?.from ? toIso(range.from) : undefined,
              to: range?.to ? toIso(range.to) : undefined,
            })
          }
        />
      </PopoverContent>
    </Popover>
  );
}
