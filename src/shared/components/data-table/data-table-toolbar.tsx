import { Search, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

import { useDebounce } from '@/shared/hooks/use-debounce';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

export type FilterChip = { id: string; label: ReactNode; onRemove: () => void };

/**
 * Toolbar row above a table: debounced search, filter controls (children),
 * actions on the right and a second row of removable chips for active filters.
 */
export function DataTableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  debounceMs = 300,
  children,
  actions,
  chips = [],
  onReset,
  resetLabel = 'Reset',
  className,
}: {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  debounceMs?: number;
  /** Filter controls (faceted filters, date range…). */
  children?: ReactNode;
  /** Right-aligned controls (view options, density, export…). */
  actions?: ReactNode;
  chips?: FilterChip[];
  /** Shown when there are chips or a search term. */
  onReset?: () => void;
  resetLabel?: string;
  className?: string;
}) {
  const [draft, setDraft] = useState(search ?? '');
  const debounced = useDebounce(draft, debounceMs);

  // Push the debounced value up; pull external changes (reset, back button) down.
  useEffect(() => {
    if (onSearchChange && debounced !== (search ?? '')) onSearchChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the debounced draft
  }, [debounced]);
  const [lastSearch, setLastSearch] = useState(search);
  if (search !== lastSearch) {
    setLastSearch(search);
    if ((search ?? '') !== debounced) setDraft(search ?? '');
  }

  const filtered = chips.length > 0 || !!search;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-center gap-2">
        {onSearchChange && (
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="pl-8"
            />
          </div>
        )}
        {children}
        {filtered && onReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDraft('');
              onReset();
            }}
          >
            {resetLabel} <X />
          </Button>
        )}
        {actions && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {chips.length > 0 && (
        <ul className="flex flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <li
              key={chip.id}
              className="inline-flex h-6 items-center gap-1 rounded-full border bg-muted/60 pr-1 pl-2.5 text-xs"
            >
              {chip.label}
              <button
                type="button"
                onClick={chip.onRemove}
                aria-label="Remove filter"
                className="rounded-full p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
