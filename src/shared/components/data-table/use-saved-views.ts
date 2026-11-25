import { useCallback, useState } from 'react';

import { storage } from '@/shared/lib/storage';

export type SavedView<TState> = { id: string; name: string; state: TState; createdAt: number };

/**
 * Named table views persisted in localStorage under `storageKey`. `TState` is
 * whatever the caller wants to restore (sorting, filters, visibility, order…);
 * keep it JSON-serializable.
 */
export function useSavedViews<TState>(storageKey: string) {
  const key = `views:${storageKey}`;
  const [views, setViews] = useState<SavedView<TState>[]>(
    () => storage.get<SavedView<TState>[]>(key) ?? [],
  );

  const persist = useCallback(
    (next: SavedView<TState>[]) => {
      setViews(next);
      storage.set(key, next);
    },
    [key],
  );

  const save = useCallback(
    (name: string, state: TState) => {
      const view: SavedView<TState> = {
        id: `${Date.now().toString(36)}`,
        name: name.trim() || 'Untitled view',
        state,
        createdAt: Date.now(),
      };
      persist([...views.filter((v) => v.name !== view.name), view]);
      return view;
    },
    [persist, views],
  );

  const remove = useCallback(
    (id: string) => persist(views.filter((v) => v.id !== id)),
    [persist, views],
  );

  return { views, save, remove };
}
