import { X } from 'lucide-react';
import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';

import { cn } from '@/shared/lib/cn';

import { useControllableState } from './use-controllable-state';

export type TagInputProps = {
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  /** Maximum number of tags. */
  max?: number;
  /** Return an error message to reject a tag, or nothing to accept it. */
  validate?: (tag: string) => string | void;
  /** Characters that commit the current text as a tag (Enter always does). */
  separators?: string[];
  /** Lowercase tags before adding. */
  lowercase?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  className?: string;
};

/**
 * Free-text chips: Enter or comma commits, pasting "a, b; c" splits,
 * Backspace on empty input removes the last tag. Duplicates are ignored and
 * `validate` can reject values (emails, domains…).
 */
export function TagInput({
  value: valueProp,
  defaultValue = [],
  onChange,
  placeholder = 'Add a tag…',
  max,
  validate,
  separators = [',', ';'],
  lowercase,
  disabled,
  invalid,
  id,
  className,
}: TagInputProps) {
  const [tags, setTags] = useControllableState({ value: valueProp, defaultValue, onChange });
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const full = max !== undefined && tags.length >= max;

  const add = (raw: string[]) => {
    const next = [...tags];
    let problem: string | null = null;
    for (const part of raw) {
      const tag = (lowercase ? part.toLowerCase() : part).trim();
      if (!tag) continue;
      if (next.includes(tag)) {
        problem = `“${tag}” is already added`;
        continue;
      }
      if (max !== undefined && next.length >= max) {
        problem = `Up to ${max} tags`;
        break;
      }
      const message = validate?.(tag);
      if (message) {
        problem = message;
        continue;
      }
      next.push(tag);
    }
    if (next.length !== tags.length) setTags(next);
    setError(problem);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || separators.includes(event.key)) {
      if (!text.trim()) return;
      event.preventDefault();
      add([text]);
      setText('');
    } else if (event.key === 'Backspace' && !text && tags.length) {
      setTags(tags.slice(0, -1));
      setError(null);
    }
  };

  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text');
    const pattern = new RegExp(`[${['\\n', ...separators].join('')}]`);
    if (!pattern.test(pasted)) return;
    event.preventDefault();
    add(pasted.split(pattern));
  };

  return (
    <div className="space-y-1">
      <div
        aria-invalid={invalid || !!error}
        onClick={() => inputRef.current?.focus()}
        className={cn(
          'flex min-h-9 w-full flex-wrap items-center gap-1 rounded-lg border border-input bg-transparent px-2 py-1 text-sm transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30',
          disabled && 'pointer-events-none opacity-50',
          className,
        )}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex h-5 items-center gap-1 rounded-md bg-secondary pr-0.5 pl-1.5 text-xs font-medium text-secondary-foreground"
          >
            {tag}
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              className="rounded-sm p-0.5 hover:bg-foreground/10"
              onClick={() => {
                setTags(tags.filter((t) => t !== tag));
                setError(null);
              }}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={id}
          value={text}
          disabled={disabled || full}
          placeholder={full ? '' : placeholder}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onBlur={() => {
            if (text.trim()) {
              add([text]);
              setText('');
            }
          }}
          className="h-6 min-w-20 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        />
      </div>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
