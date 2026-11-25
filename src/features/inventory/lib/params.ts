/** Narrows a search param to one of `options`, or returns `fallback`. */
export const oneOf = <T extends string, F>(
  options: readonly T[],
  value: string | null,
  fallback: F,
) => (options.includes(value as T) ? (value as T) : fallback);
