import { SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';

export type NumberRangeValue = { min?: number; max?: number };

/** Min/max filter for numeric columns (amount, quantity…). Applies on submit. */
export function DataTableNumberRangeFilter({
  title,
  value,
  onChange,
  format = (n) => n.toLocaleString(),
  labels = { min: 'Min', max: 'Max', apply: 'Apply', clear: 'Clear' },
}: {
  title: string;
  value: NumberRangeValue;
  onChange: (value: NumberRangeValue) => void;
  format?: (value: number) => string;
  labels?: { min: string; max: string; apply: string; clear: string };
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ min: '', max: '' });
  const active = value.min !== undefined || value.max !== undefined;

  const parse = (s: string) => (s.trim() === '' || Number.isNaN(Number(s)) ? undefined : Number(s));

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft({ min: value.min?.toString() ?? '', max: value.max?.toString() ?? '' });
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="border-dashed">
          <SlidersHorizontal /> {title}
          {active && (
            <span className="font-normal text-muted-foreground tabular-nums">
              · {value.min !== undefined ? format(value.min) : '…'} –{' '}
              {value.max !== undefined ? format(value.max) : '…'}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            onChange({ min: parse(draft.min), max: parse(draft.max) });
            setOpen(false);
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="nr-min" className="text-xs text-muted-foreground">
                {labels.min}
              </Label>
              <Input
                id="nr-min"
                inputMode="decimal"
                value={draft.min}
                onChange={(e) => setDraft((d) => ({ ...d, min: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nr-max" className="text-xs text-muted-foreground">
                {labels.max}
              </Label>
              <Input
                id="nr-max"
                inputMode="decimal"
                value={draft.max}
                onChange={(e) => setDraft((d) => ({ ...d, max: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange({});
                setOpen(false);
              }}
            >
              {labels.clear}
            </Button>
            <Button type="submit" size="sm">
              {labels.apply}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
