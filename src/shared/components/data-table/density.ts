export const DENSITIES = ['compact', 'default', 'comfortable'] as const;
export type Density = (typeof DENSITIES)[number];

/** Cell padding per density (rows stay a fixed height, which virtualization relies on). */
export const DENSITY_CELL: Record<Density, string> = {
  compact: 'h-9 py-1.5 text-[0.8125rem]',
  default: 'h-12 py-2.5',
  comfortable: 'h-14 py-3',
};

/** Estimated row height in px per density (for the virtualizer). */
export const DENSITY_ROW_HEIGHT: Record<Density, number> = {
  compact: 37,
  default: 49,
  comfortable: 57,
};
