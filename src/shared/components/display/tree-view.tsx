import { ChevronRight, type LucideIcon } from 'lucide-react';
import { useState, type KeyboardEvent, type ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

export type TreeNode = {
  id: string;
  label: ReactNode;
  icon?: LucideIcon;
  /** Trailing text (counts, sizes…). */
  meta?: ReactNode;
  children?: TreeNode[];
};

export type TreeViewProps = {
  nodes: TreeNode[];
  selectedId?: string | null;
  onSelect?: (node: TreeNode) => void;
  /** Ids expanded on first render. */
  defaultExpanded?: string[];
  className?: string;
};

/** Flattens the visible part of the tree (used for arrow-key navigation). */
function visibleIds(nodes: TreeNode[], expanded: Set<string>): string[] {
  return nodes.flatMap((n) => [
    n.id,
    ...(n.children && expanded.has(n.id) ? visibleIds(n.children, expanded) : []),
  ]);
}

/**
 * Hierarchical list (folders, categories, org charts). Keyboard: ↑/↓ move,
 * → expands, ← collapses, Enter/Space selects.
 */
export function TreeView({
  nodes,
  selectedId,
  onSelect,
  defaultExpanded = [],
  className,
}: TreeViewProps) {
  const [expanded, setExpanded] = useState(() => new Set(defaultExpanded));
  const [focused, setFocused] = useState<string | null>(nodes[0]?.id ?? null);

  const toggle = (id: string, open?: boolean) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (open ?? !next.has(id)) next.add(id);
      else next.delete(id);
      return next;
    });

  const find = (list: TreeNode[], id: string): TreeNode | undefined => {
    for (const n of list) {
      if (n.id === id) return n;
      const hit = n.children && find(n.children, id);
      if (hit) return hit;
    }
  };

  const focusItem = (id: string) => {
    setFocused(id);
    document.getElementById(`tree-${id}`)?.focus();
  };

  const onKeyDown = (event: KeyboardEvent, node: TreeNode) => {
    const ids = visibleIds(nodes, expanded);
    const index = ids.indexOf(node.id);
    switch (event.key) {
      case 'ArrowDown':
        if (ids[index + 1]) focusItem(ids[index + 1]!);
        break;
      case 'ArrowUp':
        if (index > 0) focusItem(ids[index - 1]!);
        break;
      case 'ArrowRight':
        if (node.children) toggle(node.id, true);
        break;
      case 'ArrowLeft':
        if (node.children) toggle(node.id, false);
        break;
      case 'Enter':
      case ' ':
        onSelect?.(find(nodes, node.id)!);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  const renderNodes = (list: TreeNode[], depth: number): ReactNode =>
    list.map((node) => {
      const isOpen = expanded.has(node.id);
      const hasChildren = !!node.children?.length;
      const Icon = node.icon;
      return (
        <li key={node.id} role="none">
          <div
            id={`tree-${node.id}`}
            role="treeitem"
            aria-expanded={hasChildren ? isOpen : undefined}
            aria-selected={selectedId === node.id}
            tabIndex={focused === node.id ? 0 : -1}
            onKeyDown={(e) => onKeyDown(e, node)}
            onFocus={() => setFocused(node.id)}
            onClick={() => {
              if (hasChildren) toggle(node.id);
              onSelect?.(node);
            }}
            className={cn(
              'flex h-8 cursor-pointer items-center gap-1.5 rounded-md pr-2 text-sm outline-none select-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring',
              selectedId === node.id && 'bg-accent font-medium text-accent-foreground',
            )}
            style={{ paddingLeft: depth * 16 + 6 }}
          >
            <ChevronRight
              className={cn(
                'size-3.5 shrink-0 text-muted-foreground transition-transform',
                isOpen && 'rotate-90',
                !hasChildren && 'invisible',
              )}
            />
            {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}
            <span className="truncate">{node.label}</span>
            {node.meta && (
              <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                {node.meta}
              </span>
            )}
          </div>
          {hasChildren && isOpen && <ul role="group">{renderNodes(node.children!, depth + 1)}</ul>}
        </li>
      );
    });

  return (
    <ul role="tree" className={cn('space-y-0.5', className)}>
      {renderNodes(nodes, 0)}
    </ul>
  );
}
