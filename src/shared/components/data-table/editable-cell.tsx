import { Pencil } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

type Base = {
  /** Read-only rendering. Defaults to the raw value. */
  display?: ReactNode;
  className?: string;
  label?: string;
};

export type EditableCellProps = Base &
  (
    | { type: 'text'; value: string; onCommit: (value: string) => void }
    | { type: 'number'; value: number; onCommit: (value: number) => void; step?: number }
    | {
        type: 'select';
        value: string;
        onCommit: (value: string) => void;
        options: Array<{ label: string; value: string }>;
      }
  );

/**
 * Click-to-edit cell. Text/number: Enter or blur commits, Escape cancels.
 * Select: commits on choice. Commit is skipped when the value is unchanged.
 */
export function EditableCell(props: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const start = () => {
    setDraft(String(props.value));
    setEditing(true);
  };

  if (props.type === 'select') {
    return (
      <Select value={props.value} onValueChange={(v) => v !== props.value && props.onCommit(v)}>
        <SelectTrigger
          size="sm"
          aria-label={props.label}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'h-7 w-full border-transparent bg-transparent px-1.5 shadow-none hover:border-input',
            props.className,
          )}
        >
          {props.display ?? <SelectValue />}
        </SelectTrigger>
        <SelectContent>
          {props.options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  const commit = () => {
    setEditing(false);
    if (props.type === 'number') {
      const n = Number(draft);
      if (draft.trim() !== '' && !Number.isNaN(n) && n !== props.value) props.onCommit(n);
    } else if (draft !== props.value) {
      props.onCommit(draft);
    }
  };

  if (editing) {
    return (
      <input
        autoFocus
        aria-label={props.label}
        type={props.type}
        step={props.type === 'number' ? (props.step ?? 'any') : undefined}
        value={draft}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setEditing(false);
        }}
        className={cn(
          '-mx-1.5 h-7 w-[calc(100%+0.75rem)] rounded-md border border-ring bg-background px-1.5 text-sm ring-2 ring-ring/30 outline-none',
          props.type === 'number' && 'text-right tabular-nums',
          props.className,
        )}
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={props.label}
      onClick={(e) => {
        e.stopPropagation();
        start();
      }}
      className={cn(
        'group/edit -mx-1.5 flex h-7 w-[calc(100%+0.75rem)] items-center gap-1 rounded-md px-1.5 text-left hover:bg-background hover:ring-1 hover:ring-input',
        props.type === 'number' && 'justify-end tabular-nums',
        props.className,
      )}
    >
      <span className="truncate">{props.display ?? String(props.value)}</span>
      <Pencil className="size-3 shrink-0 text-muted-foreground opacity-0 group-hover/edit:opacity-100" />
    </button>
  );
}
