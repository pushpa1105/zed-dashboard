import { Check, ChevronsUpDown, Plus, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { cn } from '@/shared/lib/cn';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/shared/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';

import { groupOptions, type SelectOption } from './options';
import { useControllableState } from './use-controllable-state';

export type MultiSelectProps = {
  options: SelectOption[];
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  /** Chips shown in the trigger before collapsing into "+N". */
  maxVisible?: number;
  /** Maximum number of selected values. */
  maxSelected?: number;
  /** Adds a "Select all" row. */
  selectAll?: boolean;
  clearable?: boolean;
  /** Lets the user add the typed text as a new option. */
  creatable?: boolean;
  onCreate?: (label: string) => SelectOption | void;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  className?: string;
};

/**
 * Searchable multi-select with chips. Supports groups, per-option icons and
 * descriptions, disabled options, select-all, a selection cap and creating
 * new options from the search text.
 */
export function MultiSelect({
  options: initialOptions,
  value: valueProp,
  defaultValue = [],
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyText = 'No results.',
  maxVisible = 3,
  maxSelected,
  selectAll,
  clearable = true,
  creatable,
  onCreate,
  disabled,
  invalid,
  id,
  className,
}: MultiSelectProps) {
  const [value, setValue] = useControllableState({ value: valueProp, defaultValue, onChange });
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [created, setCreated] = useState<SelectOption[]>([]);
  const options = useMemo(() => [...initialOptions, ...created], [initialOptions, created]);
  const byValue = useMemo(() => new Map(options.map((o) => [o.value, o])), [options]);

  const full = maxSelected !== undefined && value.length >= maxSelected;
  const selectable = options.filter((o) => !o.disabled);
  const allSelected = selectable.length > 0 && selectable.every((o) => value.includes(o.value));

  const toggle = (v: string) =>
    setValue((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : full ? prev : [...prev, v],
    );

  const trimmed = search.trim();
  const canCreate =
    creatable &&
    trimmed.length > 0 &&
    !options.some((o) => o.label.toLowerCase() === trimmed.toLowerCase());

  const create = () => {
    const option = onCreate?.(trimmed) ?? { value: trimmed.toLowerCase(), label: trimmed };
    setCreated((prev) => [...prev, option]);
    if (!full) setValue((prev) => [...prev, option.value]);
    setSearch('');
  };

  const visible = value.slice(0, maxVisible);
  const hidden = value.length - visible.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid}
          className={cn(
            'flex min-h-9 w-full items-center gap-1.5 rounded-lg border border-input bg-transparent px-2 py-1 text-left text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30',
            className,
          )}
        >
          <span className="flex flex-1 flex-wrap gap-1">
            {value.length === 0 && (
              <span className="px-0.5 text-muted-foreground">{placeholder}</span>
            )}
            {visible.map((v) => (
              <span
                key={v}
                className="inline-flex h-5 items-center gap-1 rounded-md bg-secondary pr-0.5 pl-1.5 text-xs font-medium text-secondary-foreground"
              >
                {byValue.get(v)?.label ?? v}
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label={`Remove ${byValue.get(v)?.label ?? v}`}
                  className="rounded-sm p-0.5 hover:bg-foreground/10"
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(v);
                  }}
                >
                  <X className="size-3" />
                </span>
              </span>
            ))}
            {hidden > 0 && (
              <span className="inline-flex h-5 items-center rounded-md border px-1.5 text-xs text-muted-foreground">
                +{hidden}
              </span>
            )}
          </span>
          {clearable && value.length > 0 && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Clear selection"
              className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
              onPointerDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                setValue([]);
              }}
            >
              <X className="size-3.5" />
            </span>
          )}
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-60 p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            {selectAll && !trimmed && (
              <>
                <CommandGroup>
                  <CommandItem
                    onSelect={() =>
                      setValue(
                        allSelected ? [] : selectable.map((o) => o.value).slice(0, maxSelected),
                      )
                    }
                  >
                    <CheckMark checked={allSelected} partial={!allSelected && value.length > 0} />
                    Select all
                    <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                      {value.length}/{selectable.length}
                    </span>
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
              </>
            )}
            {groupOptions(options).map(([group, items]) => (
              <CommandGroup key={group || '_'} heading={group || undefined}>
                {items.map((option) => {
                  const checked = value.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      value={`${option.label} ${option.value}`}
                      disabled={option.disabled || (full && !checked)}
                      onSelect={() => toggle(option.value)}
                    >
                      <CheckMark checked={checked} />
                      {option.icon}
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate">{option.label}</span>
                        {option.description && (
                          <span className="truncate text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        )}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
            {canCreate && (
              <CommandGroup>
                <CommandItem value={`__create ${trimmed}`} onSelect={create}>
                  <Plus /> Create “{trimmed}”
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
          {maxSelected !== undefined && (
            <p className="border-t px-3 py-2 text-xs text-muted-foreground">
              {value.length} of {maxSelected} selected
            </p>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Checkbox-looking indicator used inside command items. */
export function CheckMark({ checked, partial }: { checked: boolean; partial?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input',
        (checked || partial) && 'border-primary bg-primary text-primary-foreground',
      )}
    >
      {checked ? (
        <Check className="size-3 text-current" />
      ) : partial ? (
        <span className="h-0.5 w-2 rounded bg-current" />
      ) : null}
    </span>
  );
}
