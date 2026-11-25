import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { BRAND, BRAND_STORAGE_KEY, type Brand } from './config';

type BrandStore = {
  /** Runtime overrides from the Brand panel; unset fields use BRAND. */
  overrides: Partial<Brand>;
  set: (patch: Partial<Brand>) => void;
  reset: () => void;
};

export const useBrandStore = create<BrandStore>()(
  persist(
    (set) => ({
      overrides: {},
      set: (patch) => set((s) => ({ overrides: { ...s.overrides, ...patch } })),
      reset: () => set({ overrides: {} }),
    }),
    { name: BRAND_STORAGE_KEY, storage: createJSONStorage(() => localStorage) },
  ),
);

const merge = (overrides: Partial<Brand>): Brand => ({
  ...BRAND,
  ...Object.fromEntries(Object.entries(overrides).filter(([, v]) => v !== undefined && v !== '')),
});

/** The brand in effect (defaults + overrides). */
export const useBrand = () => merge(useBrandStore((s) => s.overrides));

/** Same, outside React. */
export const getBrand = () => merge(useBrandStore.getState().overrides);
