import { useCallback, useEffect, useRef, useState } from 'react';

import {
  countActiveRules,
  createFilterGroup,
  pruneFilterTree,
  type FilterField,
  type FilterGroup,
} from '@/shared/components/data-table/filter-tree';

export const parseFilterTree = (raw: string): FilterGroup | null => {
  if (!raw) return null;
  try {
    const tree = JSON.parse(raw) as FilterGroup;
    return tree?.kind === 'group' ? tree : null;
  } catch {
    return null;
  }
};

const serialize = (tree: FilterGroup, fields: FilterField[]) =>
  countActiveRules(tree, fields) ? JSON.stringify(pruneFilterTree(tree, fields)) : '';

/**
 * Two-way binding between the filter builder and a URL param. The builder
 * edits a local draft (half-typed rules aren't lost); the pruned tree is
 * written after a short pause, and external URL changes (saved views, reset,
 * back button) replace the draft.
 */
export function useFilterTreeParam(
  value: string,
  onChange: (serialized: string) => void,
  fields: FilterField[],
  delay = 400,
) {
  const [tree, setTree] = useState<FilterGroup>(
    () => parseFilterTree(value) ?? createFilterGroup(),
  );
  const [synced, setSynced] = useState(value);
  const timer = useRef<number | undefined>(undefined);

  if (value !== synced) {
    setSynced(value);
    if (value !== serialize(tree, fields)) setTree(parseFilterTree(value) ?? createFilterGroup());
  }

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const edit = useCallback(
    (next: FilterGroup) => {
      setTree(next);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => onChange(serialize(next, fields)), delay);
    },
    [onChange, fields, delay],
  );

  return [tree, edit] as const;
}
