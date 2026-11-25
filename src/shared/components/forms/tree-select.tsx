import { Check, ChevronRight, ChevronsUpDown, Loader2, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { cn } from '@/shared/lib/cn';
import { Checkbox } from '@/shared/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';

import { useControllableState } from './use-controllable-state';

export type TreeNode = {
  value: string;
  label: string;
  children?: TreeNode[];
  /** For lazy trees: the node has children that `loadChildren` will fetch. */
  hasChildren?: boolean;
  disabled?: boolean;
};

export type TreeSelectProps = {
  data: TreeNode[];
  /**
   * `multiple` (default): checkboxes; parents toggle all their leaves and show
   * an indeterminate state. `single`: pick one node (any level) by clicking it.
   */
  mode?: 'multiple' | 'single';
  /** Selected values (leaves in `multiple` mode; at most one value in `single`). */
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  /** Show a filter box; matching nodes stay visible with their ancestors. */
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
  /** Fetch children of a node flagged `hasChildren` on first expand. */
  loadChildren?: (node: TreeNode) => Promise<TreeNode[]>;
  /** Render inline (no popover). */
  inline?: boolean;
  /** Expanded by default (defaults to the top level). */
  defaultExpanded?: string[];
  /** Allow clearing the selection from the trigger. */
  clearable?: boolean;
  size?: 'sm' | 'default' | 'lg';
  invalid?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
};

const TRIGGER_SIZE = {
  sm: 'h-8 px-2.5 text-[0.8125rem]',
  default: 'h-9 px-3 text-sm',
  lg: 'h-10 px-3.5 text-sm',
} as const;

/** Applies lazily loaded children to the tree (immutably). */
function withChildren(nodes: TreeNode[], loaded: Map<string, TreeNode[]>): TreeNode[] {
  return nodes.map((node) => {
    const children = loaded.get(node.value) ?? node.children;
    return children ? { ...node, children: withChildren(children, loaded) } : node;
  });
}

const leavesOf = (node: TreeNode): string[] =>
  node.children?.length ? node.children.flatMap(leavesOf) : [node.value];

/** Keeps nodes whose label matches, plus their ancestors (with all matching descendants). */
function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return nodes;
  return nodes.flatMap((node) => {
    if (node.label.toLowerCase().includes(q)) return [node];
    const children = node.children ? filterTree(node.children, q) : [];
    return children.length ? [{ ...node, children }] : [];
  });
}

/**
 * Hierarchical select (departments → teams, regions → cities, folders,
 * permission trees). Multi mode checks leaves with tri-state parents; single
 * mode picks one node. Optional search and lazy-loaded branches.
 */
export function TreeSelect({
  data,
  mode = 'multiple',
  value: valueProp,
  defaultValue = [],
  onChange,
  placeholder = 'Select…',
  searchable,
  searchPlaceholder = 'Filter…',
  emptyText = 'No matches',
  loadChildren,
  inline,
  defaultExpanded,
  clearable,
  size = 'default',
  invalid,
  disabled,
  id,
  className,
}: TreeSelectProps) {
  const [value, setValue] = useControllableState({ value: valueProp, defaultValue, onChange });
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(defaultExpanded ?? data.map((n) => n.value)),
  );
  const [loaded, setLoaded] = useState<Map<string, TreeNode[]>>(() => new Map());
  const [loading, setLoading] = useState<Set<string>>(() => new Set());
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const single = mode === 'single';

  const tree = useMemo(() => withChildren(data, loaded), [data, loaded]);
  const visible = useMemo(() => filterTree(tree, query), [tree, query]);
  const labels = useMemo(() => {
    const map = new Map<string, string>();
    const walk = (nodes: TreeNode[]) =>
      nodes.forEach((n) => {
        map.set(n.value, n.label);
        if (n.children) walk(n.children);
      });
    walk(tree);
    return map;
  }, [tree]);

  const selected = new Set(value);
  const searching = query.trim().length > 0;

  const toggleExpanded = async (node: TreeNode) => {
    const isOpen = expanded.has(node.value);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (isOpen) next.delete(node.value);
      else next.add(node.value);
      return next;
    });
    if (!isOpen && node.hasChildren && !node.children && loadChildren && !loaded.has(node.value)) {
      setLoading((prev) => new Set(prev).add(node.value));
      try {
        const children = await loadChildren(node);
        setLoaded((prev) => new Map(prev).set(node.value, children));
      } finally {
        setLoading((prev) => {
          const next = new Set(prev);
          next.delete(node.value);
          return next;
        });
      }
    }
  };

  const toggleNode = (node: TreeNode, checked: boolean) => {
    const leaves = leavesOf(node);
    setValue((prev) =>
      checked ? [...new Set([...prev, ...leaves])] : prev.filter((v) => !leaves.includes(v)),
    );
  };

  const renderNodes = (nodes: TreeNode[], depth: number) => (
    <ul role={depth === 0 ? 'tree' : 'group'} aria-multiselectable={!single || undefined}>
      {nodes.map((node) => {
        const leaves = leavesOf(node);
        const count = leaves.filter((l) => selected.has(l)).length;
        const state = count === 0 ? false : count === leaves.length ? true : 'indeterminate';
        const expandable = !!node.children?.length || !!node.hasChildren;
        const isOpen = searching || expanded.has(node.value);
        const isSelected = single ? selected.has(node.value) : state === true;
        return (
          <li
            key={node.value}
            role="treeitem"
            aria-expanded={expandable ? isOpen : undefined}
            aria-selected={isSelected}
            aria-disabled={node.disabled || undefined}
          >
            <div
              className={cn(
                'flex h-8 items-center gap-1.5 rounded-md pr-2 text-sm hover:bg-muted',
                single && isSelected && 'bg-accent text-accent-foreground hover:bg-accent',
                node.disabled && 'opacity-50',
              )}
              style={{ paddingLeft: depth * 16 + 4 }}
            >
              {expandable ? (
                <button
                  type="button"
                  aria-label={isOpen ? `Collapse ${node.label}` : `Expand ${node.label}`}
                  className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
                  onClick={() => void toggleExpanded(node)}
                >
                  {loading.has(node.value) ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <ChevronRight
                      className={cn('size-3.5 transition-transform', isOpen && 'rotate-90')}
                    />
                  )}
                </button>
              ) : (
                <span className="w-4.5" />
              )}
              {single ? (
                <button
                  type="button"
                  disabled={disabled || node.disabled}
                  className="flex h-full flex-1 items-center gap-2 truncate text-left"
                  onClick={() => {
                    setValue([node.value]);
                    if (!inline) setOpen(false);
                  }}
                >
                  <span className="truncate">{node.label}</span>
                  {isSelected && <Check className="ml-auto size-4 text-primary" />}
                </button>
              ) : (
                <label className="flex flex-1 cursor-pointer items-center gap-2">
                  <Checkbox
                    checked={state}
                    disabled={disabled || node.disabled}
                    onCheckedChange={(c) => toggleNode(node, c === true)}
                  />
                  <span className="truncate">{node.label}</span>
                  {node.children?.length ? (
                    <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                      {count}/{leaves.length}
                    </span>
                  ) : null}
                </label>
              )}
            </div>
            {expandable && isOpen && node.children && renderNodes(node.children, depth + 1)}
          </li>
        );
      })}
    </ul>
  );

  const body = (
    <>
      {searchable && (
        <div className="flex items-center gap-2 border-b px-2 pb-1.5">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="h-8 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      )}
      <div className={cn(searchable && 'pt-1')}>
        {visible.length ? (
          renderNodes(visible, 0)
        ) : (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">{emptyText}</p>
        )}
      </div>
    </>
  );

  if (inline) {
    return <div className={cn('rounded-lg border p-1', className)}>{body}</div>;
  }

  const summary =
    value.length === 0
      ? placeholder
      : value.length <= 2
        ? value.map((v) => labels.get(v) ?? v).join(', ')
        : `${labels.get(value[0]!) ?? value[0]} +${value.length - 1} more`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          id={id}
          type="button"
          aria-invalid={invalid || undefined}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg border border-input bg-transparent text-left outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 aria-invalid:border-destructive dark:bg-input/30',
            TRIGGER_SIZE[size],
            className,
          )}
        >
          <span className={cn('flex-1 truncate', value.length === 0 && 'text-muted-foreground')}>
            {summary}
          </span>
          {clearable && value.length > 0 && (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Clear"
              className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setValue([]);
              }}
            >
              <X className="size-3.5" />
            </span>
          )}
          <ChevronsUpDown className="size-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="max-h-80 w-(--radix-popover-trigger-width) min-w-64 overflow-y-auto p-1"
      >
        {body}
      </PopoverContent>
    </Popover>
  );
}
