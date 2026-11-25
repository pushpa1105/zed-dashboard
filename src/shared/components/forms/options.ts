import type { ReactNode } from 'react';

/** Option shape shared by every select-like input in this folder. */
export type SelectOption = {
  value: string;
  label: string;
  description?: string;
  /** Leading visual: an icon element, avatar, flag… */
  icon?: ReactNode;
  disabled?: boolean;
  /** Options with the same group are listed under one heading. */
  group?: string;
};

/** Buckets options by `group`, keeping first-seen order. Ungrouped options come first. */
export function groupOptions(options: SelectOption[]): Array<[string, SelectOption[]]> {
  const groups = new Map<string, SelectOption[]>();
  for (const option of options) {
    const key = option.group ?? '';
    groups.set(key, [...(groups.get(key) ?? []), option]);
  }
  return [...groups.entries()];
}
