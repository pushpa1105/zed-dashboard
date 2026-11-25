import { Loader2, Search, X } from 'lucide-react';
import { useEffect, useRef, type ComponentProps } from 'react';

import { Kbd } from '@/shared/components/kbd';
import { cn } from '@/shared/lib/cn';

import { useControllableState } from './use-controllable-state';

export type SearchInputProps = Omit<
  ComponentProps<'input'>,
  'value' | 'defaultValue' | 'onChange'
> & {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Shows a spinner instead of the clear button. */
  loading?: boolean;
  /** Focus the field with "/" and show the hint. */
  shortcut?: boolean;
  containerClassName?: string;
};

/** Search field with icon, clear button, loading state and an optional "/" shortcut. */
export function SearchInput({
  value: valueProp,
  defaultValue = '',
  onChange,
  loading,
  shortcut,
  placeholder = 'Search…',
  className,
  containerClassName,
  ...props
}: SearchInputProps) {
  const [value, setValue] = useControllableState({ value: valueProp, defaultValue, onChange });
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!shortcut) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        e.key === '/' &&
        !/input|textarea|select/i.test(target.tagName) &&
        !target.isContentEditable
      ) {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [shortcut]);

  return (
    <div
      className={cn(
        'flex h-9 w-full items-center gap-2 rounded-lg border border-input bg-transparent px-3 text-sm transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30',
        containerClassName,
      )}
    >
      <Search className="size-4 shrink-0 text-muted-foreground" />
      <input
        {...props}
        ref={ref}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && value) {
            e.preventDefault();
            setValue('');
          }
          props.onKeyDown?.(e);
        }}
        className={cn(
          'h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden',
          className,
        )}
      />
      {loading ? (
        <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
      ) : value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setValue('');
            ref.current?.focus();
          }}
          className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      ) : shortcut ? (
        <Kbd>/</Kbd>
      ) : null}
    </div>
  );
}
