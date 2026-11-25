import { Bookmark, Check, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';

import type { SavedView } from './use-saved-views';

export type SavedViewsLabels = {
  trigger: string;
  empty: string;
  namePlaceholder: string;
  save: string;
  remove: string;
};

const DEFAULT_LABELS: SavedViewsLabels = {
  trigger: 'Views',
  empty: 'No saved views yet.',
  namePlaceholder: 'View name',
  save: 'Save',
  remove: 'Delete view',
};

/**
 * Saved-views popover: apply or delete a stored view, or save the current
 * table state under a name. Pair with `useSavedViews`.
 */
export function DataTableSavedViews<TState>({
  views,
  activeId,
  onApply,
  onSave,
  onRemove,
  labels: overrides,
}: {
  views: SavedView<TState>[];
  activeId?: string | null;
  onApply: (view: SavedView<TState>) => void;
  onSave: (name: string) => void;
  onRemove: (id: string) => void;
  labels?: Partial<SavedViewsLabels>;
}) {
  const labels = { ...DEFAULT_LABELS, ...overrides };
  const [name, setName] = useState('');
  const active = views.find((v) => v.id === activeId);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Bookmark /> {active?.name ?? labels.trigger}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-1.5">
        {views.length === 0 ? (
          <p className="px-2 py-3 text-center text-sm text-muted-foreground">{labels.empty}</p>
        ) : (
          <ul className="max-h-60 overflow-y-auto">
            {views.map((view) => (
              <li key={view.id} className="group flex items-center gap-1 rounded-md hover:bg-muted">
                <button
                  type="button"
                  className="flex flex-1 items-center gap-2 truncate px-2 py-1.5 text-left text-sm"
                  onClick={() => onApply(view)}
                >
                  <Check
                    className={
                      view.id === activeId ? 'size-3.5 text-primary' : 'size-3.5 opacity-0'
                    }
                  />
                  <span className="truncate">{view.name}</span>
                </button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                  aria-label={labels.remove}
                  onClick={() => onRemove(view.id)}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <form
          className="mt-1.5 flex gap-1.5 border-t pt-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            onSave(name);
            setName('');
          }}
        >
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={labels.namePlaceholder}
            aria-label={labels.namePlaceholder}
            className="h-9"
          />
          <Button type="submit" size="sm" disabled={!name.trim()}>
            {labels.save}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
