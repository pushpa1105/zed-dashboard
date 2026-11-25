import { ArrowDown, ArrowUp, Check, ChevronRight, Loader2, Minus } from 'lucide-react';
import { useId, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import {
  checkStateOf,
  filterTree,
  moveSibling,
  setChildren,
  toggleChecked,
  type TreeItem,
} from './tree-utils';

export type TreeProps = {
  items: TreeItem[];
  /** `plain` indents only; `lines` draws guide lines for each level. */
  variant?: 'plain' | 'lines';
  /** Tri-state checkboxes. `checked` holds the checked LEAF ids. */
  checkable?: boolean;
  checked?: Set<string>;
  onCheckedChange?: (checked: Set<string>) => void;
  selectedId?: string | null;
  onSelect?: (item: TreeItem) => void;
  /** Filters to matching nodes (and their ancestors) and highlights the match. */
  query?: string;
  /** Shows move up/down buttons on hover; the tree keeps its own order. */
  reorderable?: boolean;
  onItemsChange?: (items: TreeItem[]) => void;
  defaultExpanded?: string[];
  /** Custom icon per node (e.g. open/closed folders). */
  renderIcon?: (item: TreeItem, expanded: boolean) => ReactNode;
  className?: string;
  'aria-label'?: string;
};

function Highlight({ text, query }: { text: string; query?: string }) {
  const q = query?.trim().toLowerCase();
  const at = q ? text.toLowerCase().indexOf(q) : -1;
  if (!q || at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark className="rounded-[3px] bg-primary/15 text-foreground">
        {text.slice(at, at + q.length)}
      </mark>
      {text.slice(at + q.length)}
    </>
  );
}

/**
 * The full-featured tree: guide lines, tri-state checkboxes, single selection,
 * lazy children with a spinner, filtering that auto-expands matches, and
 * move up/down. Keyboard: ↑/↓ move, → expand, ← collapse, Enter select,
 * Space check.
 */
export function Tree({
  items: initialItems,
  variant = 'plain',
  checkable,
  checked: checkedProp,
  onCheckedChange,
  selectedId,
  onSelect,
  query,
  reorderable,
  onItemsChange,
  defaultExpanded = [],
  renderIcon,
  className,
  ...rest
}: TreeProps) {
  const uid = useId();
  const [items, setItems] = useState(initialItems);
  const [expanded, setExpanded] = useState(() => new Set(defaultExpanded));
  const [loading, setLoading] = useState<Set<string>>(() => new Set());
  const [ownChecked, setOwnChecked] = useState<Set<string>>(() => new Set());
  const [focused, setFocused] = useState<string | null>(initialItems[0]?.id ?? null);
  const checked = checkedProp ?? ownChecked;

  const updateItems = (next: TreeItem[]) => {
    setItems(next);
    onItemsChange?.(next);
  };
  const setChecked = (next: Set<string>) => {
    if (!checkedProp) setOwnChecked(next);
    onCheckedChange?.(next);
  };

  const filtered = useMemo(() => filterTree(items, query ?? ''), [items, query]);
  const isOpen = (id: string) => expanded.has(id) || filtered.expand.has(id);

  const expand = async (item: TreeItem, open: boolean) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (open) next.add(item.id);
      else next.delete(item.id);
      return next;
    });
    if (open && item.loadChildren && !item.children) {
      setLoading((prev) => new Set(prev).add(item.id));
      try {
        const children = await item.loadChildren();
        setItems((prev) => setChildren(prev, item.id, children));
      } finally {
        setLoading((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
      }
    }
  };

  const visible = (nodes: TreeItem[]): TreeItem[] =>
    nodes.flatMap((n) => [n, ...(n.children && isOpen(n.id) ? visible(n.children) : [])]);

  const focus = (id: string) => {
    setFocused(id);
    document.getElementById(`${uid}-${id}`)?.focus();
  };

  const onKeyDown = (event: KeyboardEvent, item: TreeItem) => {
    const list = visible(filtered.items);
    const index = list.findIndex((n) => n.id === item.id);
    const expandable = Boolean(item.children?.length || item.loadChildren);
    const keys: Record<string, () => void> = {
      ArrowDown: () => list[index + 1] && focus(list[index + 1]!.id),
      ArrowUp: () => index > 0 && focus(list[index - 1]!.id),
      ArrowRight: () => expandable && void expand(item, true),
      ArrowLeft: () => expandable && void expand(item, false),
      Enter: () => !item.disabled && onSelect?.(item),
      ' ': () => checkable && !item.disabled && setChecked(toggleChecked(item, checked)),
    };
    const action = keys[event.key];
    if (action) {
      event.preventDefault();
      action();
    }
  };

  const renderLevel = (nodes: TreeItem[], depth: number): ReactNode => (
    <ul
      role={depth === 0 ? 'tree' : 'group'}
      aria-label={depth === 0 ? rest['aria-label'] : undefined}
      className={cn(
        depth > 0 && 'space-y-0.5',
        depth > 0 && variant === 'lines' && 'ml-[0.9375rem] border-l pl-2',
        depth > 0 && variant === 'plain' && 'pl-5',
      )}
    >
      {nodes.map((item, i) => {
        const expandable = Boolean(item.children?.length || item.loadChildren);
        const open = isOpen(item.id);
        const state = checkable ? checkStateOf(item, checked) : null;
        const selected = selectedId === item.id;
        const Icon = item.icon;
        return (
          <li key={item.id} role="none">
            <div
              id={`${uid}-${item.id}`}
              role="treeitem"
              aria-expanded={expandable ? open : undefined}
              aria-selected={onSelect ? selected : undefined}
              aria-checked={
                state ? (state === 'indeterminate' ? 'mixed' : state === 'checked') : undefined
              }
              aria-disabled={item.disabled || undefined}
              tabIndex={focused === item.id ? 0 : -1}
              onFocus={() => setFocused(item.id)}
              onKeyDown={(e) => onKeyDown(e, item)}
              onClick={() => {
                if (item.disabled) return;
                if (onSelect) onSelect(item);
                else if (expandable) void expand(item, !open);
              }}
              className={cn(
                'group/item flex h-8 cursor-pointer items-center gap-1.5 rounded-md pr-1.5 pl-1 text-sm outline-none select-none hover:bg-accent/70 focus-visible:ring-2 focus-visible:ring-ring/50',
                selected && 'bg-accent font-medium text-accent-foreground',
                item.disabled && 'cursor-not-allowed opacity-50',
              )}
            >
              <button
                type="button"
                tabIndex={-1}
                aria-hidden
                onClick={(e) => {
                  e.stopPropagation();
                  if (expandable) void expand(item, !open);
                }}
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground',
                  !expandable && 'invisible',
                )}
              >
                {loading.has(item.id) ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <ChevronRight
                    className={cn('size-3.5 transition-transform', open && 'rotate-90')}
                  />
                )}
              </button>
              {state && (
                // Drawn here (not shared/ui Checkbox) so the indeterminate dash shows.
                // The treeitem row carries aria-checked; this box is presentational.
                <span
                  aria-hidden
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!item.disabled) setChecked(toggleChecked(item, checked));
                  }}
                  className={cn(
                    'flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input bg-background shadow-xs transition-colors',
                    state !== 'unchecked' && 'border-primary bg-primary text-primary-foreground',
                    item.disabled && 'opacity-50',
                  )}
                >
                  {state === 'checked' && <Check className="size-3" strokeWidth={3} />}
                  {state === 'indeterminate' && <Minus className="size-3" strokeWidth={3} />}
                </span>
              )}
              {renderIcon
                ? renderIcon(item, open)
                : Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}
              <span className="min-w-0 truncate">
                <Highlight text={item.label} query={query} />
              </span>
              {item.meta !== undefined && (
                <span className="ml-auto pl-2 text-xs text-muted-foreground tabular-nums">
                  {item.meta}
                </span>
              )}
              {reorderable && (
                <span
                  className={cn(
                    'flex gap-0.5 opacity-0 group-hover/item:opacity-100 group-focus-visible/item:opacity-100',
                    item.meta === undefined && 'ml-auto',
                  )}
                >
                  {(
                    [
                      [-1, ArrowUp, i === 0],
                      [1, ArrowDown, i === nodes.length - 1],
                    ] as const
                  ).map(([dir, ArrowIcon, disabled]) => (
                    <button
                      key={dir}
                      type="button"
                      tabIndex={-1}
                      disabled={disabled}
                      aria-label={dir < 0 ? 'Move up' : 'Move down'}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateItems(moveSibling(items, item.id, dir));
                      }}
                      className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-30"
                    >
                      <ArrowIcon className="size-3.5" />
                    </button>
                  ))}
                </span>
              )}
            </div>
            {expandable && open && item.children && renderLevel(item.children, depth + 1)}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className={cn('text-sm', className)}>
      {filtered.items.length ? (
        renderLevel(filtered.items, 0)
      ) : (
        <p className="px-2 py-6 text-center text-sm text-muted-foreground">No matches</p>
      )}
    </div>
  );
}
