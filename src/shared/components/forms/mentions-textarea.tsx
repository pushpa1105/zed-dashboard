import { useRef, useState, type KeyboardEvent } from 'react';

import { cn } from '@/shared/lib/cn';
import { Textarea } from '@/shared/ui/textarea';

import { Highlight } from './highlight';
import type { SelectOption } from './options';
import { useControllableState } from './use-controllable-state';

export type MentionsTextareaProps = {
  /** People (or anything) that can be mentioned. `value` is inserted after the trigger. */
  suggestions: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Character that opens suggestions. */
  trigger?: string;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  id?: string;
  className?: string;
};

/**
 * Textarea with "@" mentions: typing the trigger opens a filtered list;
 * ↑/↓ and Enter/Tab insert the handle.
 */
export function MentionsTextarea({
  suggestions,
  value: valueProp,
  defaultValue = '',
  onChange,
  trigger = '@',
  placeholder,
  rows = 3,
  disabled,
  id,
  className,
}: MentionsTextareaProps) {
  const [value, setValue] = useControllableState({ value: valueProp, defaultValue, onChange });
  const ref = useRef<HTMLTextAreaElement>(null);
  const [query, setQuery] = useState<{ text: string; start: number } | null>(null);
  const [active, setActive] = useState(0);

  const matches = query
    ? suggestions
        .filter((s) => `${s.label} ${s.value}`.toLowerCase().includes(query.text.toLowerCase()))
        .slice(0, 6)
    : [];

  const detect = (text: string, caret: number) => {
    const before = text.slice(0, caret);
    const at = before.lastIndexOf(trigger);
    if (at < 0 || (at > 0 && !/\s/.test(before[at - 1]!))) return setQuery(null);
    const fragment = before.slice(at + trigger.length);
    if (/\s/.test(fragment)) return setQuery(null);
    setQuery({ text: fragment, start: at });
    setActive(0);
  };

  const insert = (option: SelectOption) => {
    if (!query || !ref.current) return;
    const caret = ref.current.selectionStart;
    const next = `${value.slice(0, query.start)}${trigger}${option.value} ${value.slice(caret)}`;
    setValue(next);
    setQuery(null);
    const pos = query.start + trigger.length + option.value.length + 1;
    requestAnimationFrame(() => ref.current?.setSelectionRange(pos, pos));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!matches.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % matches.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i - 1 + matches.length) % matches.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      insert(matches[active]!);
    } else if (e.key === 'Escape') {
      setQuery(null);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <Textarea
        ref={ref}
        id={id}
        rows={rows}
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          detect(e.target.value, e.target.selectionStart);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => setTimeout(() => setQuery(null), 120)}
        aria-autocomplete="list"
        aria-expanded={matches.length > 0}
      />
      {matches.length > 0 && (
        <ul
          role="listbox"
          className="absolute top-full left-0 z-50 mt-1 w-64 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {matches.map((option, i) => (
            <li
              key={option.value}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                insert(option);
              }}
              onMouseEnter={() => setActive(i)}
              className={cn(
                'flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm',
                i === active && 'bg-muted',
              )}
            >
              {option.icon}
              <span className="truncate">
                <Highlight text={option.label} query={query?.text ?? ''} />
              </span>
              <span className="ml-auto truncate text-xs text-muted-foreground">
                {trigger}
                {option.value}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
