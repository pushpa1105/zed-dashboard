import { Check, Pencil, X } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

export type InlineEditProps = {
  value: string;
  /** Return a message to reject the value; may be async (e.g. a save request). */
  onSave: (value: string) => void | string | Promise<void | string>;
  placeholder?: string;
  /** Text style of the read view (e.g. a heading). */
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
};

/**
 * Click-to-edit text (titles, names, cells). Enter saves, Escape cancels;
 * saving can be async and shows validation errors in place.
 */
export function InlineEdit({
  value,
  onSave,
  placeholder = 'Click to edit',
  className,
  disabled,
  'aria-label': ariaLabel = 'Edit',
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const start = () => {
    if (disabled) return;
    setDraft(value);
    setError(null);
    setEditing(true);
  };

  const save = async () => {
    if (draft === value) return setEditing(false);
    setSaving(true);
    const result = await onSave(draft.trim());
    setSaving(false);
    if (typeof result === 'string') return setError(result);
    setEditing(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') void save();
    if (e.key === 'Escape') setEditing(false);
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={start}
        disabled={disabled}
        aria-label={`${ariaLabel}: ${value || placeholder}`}
        className={cn(
          'group -mx-1.5 inline-flex max-w-full items-center gap-2 rounded-md px-1.5 py-0.5 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
          !value && 'text-muted-foreground',
          className,
        )}
      >
        <span className="truncate">{value || placeholder}</span>
        <Pencil className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
      </button>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <input
          autoFocus
          value={draft}
          aria-label={ariaLabel}
          aria-invalid={!!error}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          className={cn(
            'h-9 min-w-0 flex-1 rounded-lg border border-ring bg-transparent px-2 text-sm ring-3 ring-ring/30 outline-none aria-invalid:border-destructive aria-invalid:ring-destructive/20',
          )}
        />
        <Button
          type="button"
          size="icon-sm"
          aria-label="Save"
          disabled={saving}
          onClick={() => void save()}
        >
          <Check />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Cancel"
          onClick={() => setEditing(false)}
        >
          <X />
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
