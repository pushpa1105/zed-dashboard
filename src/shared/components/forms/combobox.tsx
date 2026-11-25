import { ChevronsUpDown, Plus, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { cn } from '@/shared/lib/cn';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';

import { groupOptions, type SelectOption } from './options';
import { useControllableState } from './use-controllable-state';

export type ComboboxProps = {
  options: SelectOption[];
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  clearable?: boolean;
  /** Offer "Create …" for search text that matches no option. */
  creatable?: boolean;
  onCreate?: (label: string) => SelectOption | void;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  className?: string;
};

/** Single-value searchable select (a.k.a. combobox). */
export function Combobox({
  options: initialOptions,
  value: valueProp,
  defaultValue = null,
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyText = 'No results.',
  clearable,
  creatable,
  onCreate,
  disabled,
  invalid,
  id,
  className,
}: ComboboxProps) {
  const [value, setValue] = useControllableState<string | null>({
    value: valueProp,
    defaultValue,
    onChange,
  });
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [created, setCreated] = useState<SelectOption[]>([]);
  const options = useMemo(() => [...initialOptions, ...created], [initialOptions, created]);
  const selected = options.find((o) => o.value === value);
  const trimmed = search.trim();
  const canCreate =
    creatable &&
    trimmed.length > 0 &&
    !options.some((o) => o.label.toLowerCase() === trimmed.toLowerCase());

  const pick = (v: string | null) => {
    setValue(v);
    setOpen(false);
    setSearch('');
  };

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
            'flex h-9 w-full items-center gap-2 rounded-lg border border-input bg-transparent px-3 text-left text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 [&_svg:not([class*=size-])]:size-4',
            className,
          )}
        >
          {selected?.icon}
          <span className={cn('flex-1 truncate', !selected && 'text-muted-foreground')}>
            {selected?.label ?? placeholder}
          </span>
          {clearable && selected && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Clear"
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
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-56 p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            {groupOptions(options).map(([group, items]) => (
              <CommandGroup key={group || '_'} heading={group || undefined}>
                {items.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.value}`}
                    disabled={option.disabled}
                    data-checked={option.value === value}
                    onSelect={() => pick(option.value === value ? null : option.value)}
                  >
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
                ))}
              </CommandGroup>
            ))}
            {canCreate && (
              <CommandGroup>
                <CommandItem
                  value={`__create ${trimmed}`}
                  onSelect={() => {
                    const option = onCreate?.(trimmed) ?? {
                      value: trimmed.toLowerCase(),
                      label: trimmed,
                    };
                    setCreated((prev) => [...prev, option]);
                    pick(option.value);
                  }}
                >
                  <Plus /> Create “{trimmed}”
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
