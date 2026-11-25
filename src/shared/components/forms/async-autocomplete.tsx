import { AlertCircle, Loader2, Search, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

import { useDebounce } from '@/shared/hooks/use-debounce';
import { cn } from '@/shared/lib/cn';
import { Popover, PopoverAnchor, PopoverContent } from '@/shared/ui/popover';

import { Highlight } from './highlight';
import type { SelectOption } from './options';
import { useControllableState } from './use-controllable-state';

type Fetcher = (query: string, signal: AbortSignal) => Promise<SelectOption[]>;

type BaseProps = {
  /** Loads options for a query. Abort with `signal` when a newer query starts. */
  fetchOptions: Fetcher;
  debounceMs?: number;
  /** Characters required before searching. */
  minChars?: number;
  placeholder?: string;
  emptyText?: string;
  errorText?: string;
  hintText?: string;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  className?: string;
};

export type AsyncAutocompleteProps = BaseProps &
  (
    | {
        multiple?: false;
        value?: SelectOption | null;
        defaultValue?: SelectOption | null;
        onChange?: (value: SelectOption | null) => void;
      }
    | {
        multiple: true;
        value?: SelectOption[];
        defaultValue?: SelectOption[];
        onChange?: (value: SelectOption[]) => void;
      }
  );

type Status = 'idle' | 'loading' | 'success' | 'error';

/**
 * Server-backed autocomplete: debounced queries, cancellation of stale
 * requests, loading/empty/error states, match highlighting and full
 * keyboard navigation (↑ ↓ Enter Esc). Values are option objects because
 * results are not known up front.
 */
export function AsyncAutocomplete(props: AsyncAutocompleteProps) {
  const {
    fetchOptions,
    debounceMs = 250,
    minChars = 1,
    placeholder = 'Search…',
    emptyText = 'No matches.',
    errorText = 'Could not load results.',
    hintText = 'Type to search',
    disabled,
    invalid,
    id,
    className,
  } = props;
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [selected, setSelected] = useControllableState<SelectOption[]>({
    value: props.value === undefined ? undefined : toArray(props.value),
    defaultValue: toArray(props.defaultValue),
    onChange: (next) =>
      props.multiple ? props.onChange?.(next) : props.onChange?.(next[0] ?? null),
  });

  const [query, setQuery] = useState(props.multiple ? '' : (selected[0]?.label ?? ''));
  const [open, setOpen] = useState(false);
  const [response, setResponse] = useState<{
    query: string;
    options: SelectOption[];
    failed: boolean;
  } | null>(null);
  const [active, setActive] = useState(0);
  const debounced = useDebounce(query, debounceMs);
  // Keep the latest fetcher without re-running the effect for inline functions.
  const fetchRef = useRef(fetchOptions);
  useEffect(() => {
    fetchRef.current = fetchOptions;
  });

  const term = debounced.trim();
  const tooShort = term.length < minChars;

  useEffect(() => {
    if (!open || tooShort) return;
    const controller = new AbortController();
    fetchRef
      .current(term, controller.signal)
      .then((options) => setResponse({ query: term, options, failed: false }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.warn(error);
        setResponse({ query: term, options: [], failed: true });
      });
    return () => controller.abort();
  }, [term, open, tooShort]);

  // Status is derived from the last response, so nothing is set synchronously in the effect.
  const status: Status =
    query.trim().length < minChars
      ? 'idle'
      : response?.query !== term || query !== debounced
        ? 'loading'
        : response.failed
          ? 'error'
          : 'success';
  const results = status === 'idle' ? [] : (response?.options ?? []);

  const choose = (option: SelectOption) => {
    if (props.multiple) {
      setSelected((prev) =>
        prev.some((o) => o.value === option.value)
          ? prev.filter((o) => o.value !== option.value)
          : [...prev, option],
      );
      setQuery('');
      inputRef.current?.focus();
    } else {
      setSelected([option]);
      setQuery(option.label);
      setOpen(false);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter' && open && results[active]) {
      event.preventDefault();
      choose(results[active]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    } else if (event.key === 'Backspace' && props.multiple && !query && selected.length) {
      setSelected((prev) => prev.slice(0, -1));
    }
  };

  const showPanel = open && (status !== 'idle' || query.length > 0);

  return (
    <Popover open={showPanel} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div
          aria-invalid={invalid}
          className={cn(
            'flex min-h-9 w-full flex-wrap items-center gap-1 rounded-lg border border-input bg-transparent px-2 py-1 text-sm transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30',
            disabled && 'pointer-events-none opacity-50',
            className,
          )}
          onClick={() => inputRef.current?.focus()}
        >
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          {props.multiple &&
            selected.map((option) => (
              <span
                key={option.value}
                className="inline-flex h-5 items-center gap-1 rounded-md bg-secondary pr-0.5 pl-1.5 text-xs font-medium text-secondary-foreground"
              >
                {option.label}
                <button
                  type="button"
                  aria-label={`Remove ${option.label}`}
                  className="rounded-sm p-0.5 hover:bg-foreground/10"
                  onClick={() => choose(option)}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          <input
            ref={inputRef}
            id={id}
            role="combobox"
            aria-expanded={showPanel}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showPanel && results[active] ? `${listId}-${active}` : undefined}
            disabled={disabled}
            value={query}
            placeholder={selected.length && props.multiple ? '' : placeholder}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
              setOpen(true);
              if (!props.multiple && selected.length) setSelected([]);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            className="h-6 min-w-24 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          />
          {status === 'loading' && (
            <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
          )}
          {!props.multiple && query && status !== 'loading' && (
            <button
              type="button"
              aria-label="Clear"
              className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setQuery('');
                setSelected([]);
              }}
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) min-w-64 p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          if (inputRef.current?.parentElement?.contains(e.target as Node)) e.preventDefault();
        }}
      >
        {status === 'error' ? (
          <p className="flex items-center gap-2 px-2 py-3 text-sm text-destructive">
            <AlertCircle className="size-4" /> {errorText}
          </p>
        ) : status === 'idle' ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">{hintText}</p>
        ) : status === 'loading' && results.length === 0 ? (
          <div className="space-y-1 p-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-7 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          <ul id={listId} role="listbox" className="max-h-72 overflow-y-auto">
            {results.map((option, index) => {
              const isSelected = selected.some((o) => o.value === option.value);
              return (
                <li
                  key={option.value}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActive(index)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(option)}
                  className={cn(
                    'flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm',
                    index === active && 'bg-muted',
                    isSelected && 'font-medium',
                  )}
                >
                  {option.icon}
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">
                      <Highlight text={option.label} query={query} />
                    </span>
                    {option.description && (
                      <span className="truncate text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    )}
                  </span>
                  {isSelected && <span className="ml-auto size-1.5 rounded-full bg-primary" />}
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

function toArray(value: SelectOption | SelectOption[] | null | undefined): SelectOption[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}
