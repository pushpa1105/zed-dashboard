/**
 * Helpers for hierarchical rows (TanStack `getSubRows`): roll numeric fields
 * up from leaves to parents, count leaves, and collect ids for expand-all.
 */
export type TreeRow<T> = T & { id: string; children?: TreeRow<T>[] };

/**
 * Returns a copy of the tree where every parent's `keys` are the sum of its
 * children (recursively). Leaves keep their own values.
 */
export function rollUp<T extends Record<string, unknown>>(
  nodes: TreeRow<T>[],
  keys: Array<Extract<keyof T, string>>,
): TreeRow<T>[] {
  return nodes.map((node) => {
    if (!node.children?.length) return node;
    const children = rollUp(node.children, keys);
    const totals = Object.fromEntries(
      keys.map((key) => [key, children.reduce((sum, child) => sum + (Number(child[key]) || 0), 0)]),
    );
    return { ...node, ...totals, children };
  });
}

/** Number of leaf rows under a node (the node itself when it is a leaf). */
export const countLeaves = <T>(node: TreeRow<T>): number =>
  node.children?.length ? node.children.reduce((n, child) => n + countLeaves(child), 0) : 1;

/** Ids of every row that has children, for "expand all". */
export function parentIds<T>(nodes: TreeRow<T>[]): string[] {
  return nodes.flatMap((node) =>
    node.children?.length ? [node.id, ...parentIds(node.children)] : [],
  );
}
