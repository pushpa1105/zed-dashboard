export function groupBy<T>(list: readonly T[], keyOf: (item: T) => string) {
  const groups = new Map<string, T[]>();
  for (const item of list) {
    const key = keyOf(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return groups;
}
