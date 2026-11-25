import { Check, PlusCircle } from 'lucide-react';
import type { ComponentType } from 'react';

import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
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
import { Separator } from '@/shared/ui/separator';

export type FacetOption = {
  label: string;
  value: string;
  icon?: ComponentType<{ className?: string }>;
  /** Count shown on the right; from `column.getFacetedUniqueValues()` or the server. */
  count?: number;
};

/**
 * Multi-select filter for one field (status, channel…). Decoupled from the
 * table: pass the selected values and receive changes, so the same control
 * drives client column filters or server query params.
 */
export function DataTableFacetedFilter({
  title,
  options,
  value,
  onChange,
  searchPlaceholder = 'Search…',
  emptyLabel = 'No results.',
  clearLabel = 'Clear filter',
}: {
  title: string;
  options: FacetOption[];
  value: string[];
  onChange: (value: string[]) => void;
  searchPlaceholder?: string;
  emptyLabel?: string;
  clearLabel?: string;
}) {
  const selected = new Set(value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="border-dashed">
          <PlusCircle /> {title}
          {selected.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-4" />
              {selected.size > 2 ? (
                <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                  {selected.size}
                </Badge>
              ) : (
                options
                  .filter((o) => selected.has(o.value))
                  .map((o) => (
                    <Badge
                      key={o.value}
                      variant="secondary"
                      className="rounded-sm px-1 font-normal"
                    >
                      {o.label}
                    </Badge>
                  ))
              )}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selected.has(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      const next = new Set(selected);
                      if (isSelected) next.delete(option.value);
                      else next.add(option.value);
                      onChange([...next]);
                    }}
                  >
                    <span
                      className={cn(
                        'flex size-4 items-center justify-center rounded-[4px] border',
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input [&_svg]:invisible',
                      )}
                    >
                      <Check className="size-3 text-current" />
                    </span>
                    {option.icon && <option.icon className="size-4 text-muted-foreground" />}
                    <span className="truncate">{option.label}</span>
                    {option.count !== undefined && (
                      <span className="ml-auto font-mono text-xs text-muted-foreground tabular-nums">
                        {option.count.toLocaleString()}
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selected.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem onSelect={() => onChange([])} className="justify-center">
                    {clearLabel}
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
