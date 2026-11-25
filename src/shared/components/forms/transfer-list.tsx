import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';

import type { SelectOption } from './options';
import { useControllableState } from './use-controllable-state';

export type TransferListProps = {
  options: SelectOption[];
  /** Values in the right ("chosen") list. */
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  titles?: [string, string];
  searchPlaceholder?: string;
  className?: string;
};

/** Dual list for moving items between "available" and "chosen" (roles, columns, members). */
export function TransferList({
  options,
  value: valueProp,
  defaultValue = [],
  onChange,
  titles = ['Available', 'Selected'],
  searchPlaceholder = 'Filter…',
  className,
}: TransferListProps) {
  const [value, setValue] = useControllableState({ value: valueProp, defaultValue, onChange });
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const left = options.filter((o) => !value.includes(o.value));
  const right = options.filter((o) => value.includes(o.value));

  const move = (values: string[], toRight: boolean) => {
    setValue((prev) =>
      toRight
        ? [...prev, ...values.filter((v) => !prev.includes(v))]
        : prev.filter((v) => !values.includes(v)),
    );
    setChecked((prev) => new Set([...prev].filter((v) => !values.includes(v))));
  };

  const checkedIn = (list: SelectOption[]) =>
    list.filter((o) => checked.has(o.value) && !o.disabled).map((o) => o.value);

  return (
    <div className={cn('grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]', className)}>
      <Pane
        title={titles[0]}
        items={left}
        checked={checked}
        setChecked={setChecked}
        searchPlaceholder={searchPlaceholder}
      />
      <div className="flex justify-center gap-1.5 sm:flex-col">
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          aria-label="Move all right"
          onClick={() =>
            move(
              left.filter((o) => !o.disabled).map((o) => o.value),
              true,
            )
          }
        >
          <ChevronsRight />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          aria-label="Move selected right"
          disabled={!checkedIn(left).length}
          onClick={() => move(checkedIn(left), true)}
        >
          <ChevronRight />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          aria-label="Move selected left"
          disabled={!checkedIn(right).length}
          onClick={() => move(checkedIn(right), false)}
        >
          <ChevronLeft />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          aria-label="Move all left"
          onClick={() =>
            move(
              right.filter((o) => !o.disabled).map((o) => o.value),
              false,
            )
          }
        >
          <ChevronsLeft />
        </Button>
      </div>
      <Pane
        title={titles[1]}
        items={right}
        checked={checked}
        setChecked={setChecked}
        searchPlaceholder={searchPlaceholder}
      />
    </div>
  );
}

function Pane({
  title,
  items,
  checked,
  setChecked,
  searchPlaceholder,
}: {
  title: string;
  items: SelectOption[];
  checked: Set<string>;
  setChecked: (next: Set<string>) => void;
  searchPlaceholder: string;
}) {
  const [filter, setFilter] = useState('');
  const visible = items.filter((o) => o.label.toLowerCase().includes(filter.toLowerCase()));
  const count = items.filter((o) => checked.has(o.value)).length;

  const toggle = (v: string) => {
    const next = new Set(checked);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    setChecked(next);
  };

  return (
    <div className="flex h-72 flex-col overflow-hidden rounded-lg border">
      <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-2 text-xs">
        <span className="font-medium">{title}</span>
        <span className="text-muted-foreground tabular-nums">
          {count}/{items.length}
        </span>
      </div>
      <label className="flex items-center gap-2 border-b px-3">
        <Search className="size-3.5 text-muted-foreground" />
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-8 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </label>
      <ul className="flex-1 overflow-y-auto p-1">
        {visible.map((o) => (
          <li key={o.value}>
            <label
              className={cn(
                'flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-sm hover:bg-muted',
                o.disabled && 'cursor-not-allowed opacity-50',
              )}
            >
              <Checkbox
                checked={checked.has(o.value)}
                disabled={o.disabled}
                onCheckedChange={() => toggle(o.value)}
              />
              {o.icon}
              <span className="truncate">{o.label}</span>
            </label>
          </li>
        ))}
        {visible.length === 0 && (
          <li className="px-2 py-6 text-center text-xs text-muted-foreground">Nothing here</li>
        )}
      </ul>
    </div>
  );
}
