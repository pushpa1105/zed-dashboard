import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/** A node in any of the tree components. */
export type TreeItem = {
  id: string;
  /** Plain text label: used for filtering and highlighting. */
  label: string;
  icon?: LucideIcon;
  /** Trailing text: counts, sizes, owners… */
  meta?: ReactNode;
  disabled?: boolean;
  children?: TreeItem[];
  /**
   * Lazy children: called the first time the node expands. The node shows a
   * spinner until it resolves. Set `children` to `undefined` when using it.
   */
  loadChildren?: () => Promise<TreeItem[]>;
};

export type CheckState = 'checked' | 'unchecked' | 'indeterminate';

/** Every id in a subtree (the node itself included). */
export function collectIds(item: TreeItem): string[] {
  return [item.id, ...(item.children ?? []).flatMap(collectIds)];
}

/** Ids of every leaf (node without children) in a subtree. */
export function leafIds(item: TreeItem): string[] {
  return item.children?.length ? item.children.flatMap(leafIds) : [item.id];
}

/**
 * Tri-state value of a node given the set of checked leaves: checked when all
 * its leaves are, unchecked when none are, indeterminate otherwise.
 */
export function checkStateOf(item: TreeItem, checkedLeaves: ReadonlySet<string>): CheckState {
  const leaves = leafIds(item);
  const hits = leaves.filter((id) => checkedLeaves.has(id)).length;
  if (hits === 0) return 'unchecked';
  return hits === leaves.length ? 'checked' : 'indeterminate';
}

/** Toggles a node: checks every leaf below it, or clears them all if it was fully checked. */
export function toggleChecked(item: TreeItem, checkedLeaves: ReadonlySet<string>): Set<string> {
  const next = new Set(checkedLeaves);
  const leaves = leafIds(item);
  const fullyChecked = checkStateOf(item, checkedLeaves) === 'checked';
  for (const id of leaves) {
    if (fullyChecked) next.delete(id);
    else next.add(id);
  }
  return next;
}

/**
 * Keeps nodes whose label matches `query` (case-insensitive) plus their
 * ancestors, and returns the ancestors' ids so the caller can expand them.
 */
export function filterTree(
  items: TreeItem[],
  query: string,
): { items: TreeItem[]; expand: Set<string> } {
  const q = query.trim().toLowerCase();
  const expand = new Set<string>();
  if (!q) return { items, expand };

  const visit = (nodes: TreeItem[]): TreeItem[] =>
    nodes.flatMap((node) => {
      const kids = node.children ? visit(node.children) : [];
      const self = node.label.toLowerCase().includes(q);
      if (kids.length) expand.add(node.id);
      if (self || kids.length) return [{ ...node, children: kids.length ? kids : node.children }];
      return [];
    });

  return { items: visit(items), expand };
}

/** Moves a node one step up or down among its siblings. Returns a new tree. */
export function moveSibling(items: TreeItem[], id: string, direction: -1 | 1): TreeItem[] {
  const index = items.findIndex((n) => n.id === id);
  if (index >= 0) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return items;
    const next = [...items];
    [next[index], next[target]] = [next[target]!, next[index]!];
    return next;
  }
  return items.map((n) =>
    n.children ? { ...n, children: moveSibling(n.children, id, direction) } : n,
  );
}

/** Replaces the children of one node (used after a lazy load). */
export function setChildren(items: TreeItem[], id: string, children: TreeItem[]): TreeItem[] {
  return items.map((n) =>
    n.id === id
      ? { ...n, children, loadChildren: undefined }
      : n.children
        ? { ...n, children: setChildren(n.children, id, children) }
        : n,
  );
}
