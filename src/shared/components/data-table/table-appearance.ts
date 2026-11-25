import { useCallback, useState } from 'react';

import { storage } from '@/shared/lib/storage';

import type { Density } from './density';

/** Presentation settings a user can change for one table. */
export type TableAppearance = {
  density: Density;
  striped: boolean;
  bordered: boolean;
  stickyHeader: boolean;
  /** Column id → visible. Missing ids are visible. */
  columnVisibility: Record<string, boolean>;
};

export const DEFAULT_APPEARANCE: TableAppearance = {
  density: 'default',
  striped: false,
  bordered: false,
  stickyHeader: true,
  columnVisibility: {},
};

/**
 * Appearance settings persisted per table (and per browser) in localStorage,
 * so each user keeps their own density, zebra rows, borders and columns.
 */
export function useTableAppearance(storageKey: string, defaults: Partial<TableAppearance> = {}) {
  const key = `table-appearance:${storageKey}`;
  const [appearance, setAppearance] = useState<TableAppearance>(() => ({
    ...DEFAULT_APPEARANCE,
    ...defaults,
    ...storage.get<Partial<TableAppearance>>(key),
  }));

  const update = useCallback(
    (patch: Partial<TableAppearance>) => {
      setAppearance((prev) => {
        const next = { ...prev, ...patch };
        storage.set(key, next);
        return next;
      });
    },
    [key],
  );

  const reset = useCallback(() => {
    storage.remove(key);
    setAppearance({ ...DEFAULT_APPEARANCE, ...defaults });
    // `defaults` is read once per reset; callers pass literals.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { appearance, update, reset };
}
