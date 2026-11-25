import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/**
 * State that is controlled when `value` is passed and uncontrolled otherwise.
 * Every input in this folder uses it, so each works standalone or with
 * react-hook-form (`value` + `onChange`).
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: {
  value?: T;
  defaultValue: T;
  onChange?: (value: T) => void;
}): [T, (next: T | ((prev: T) => T)) => void] {
  const [internal, setInternal] = useState<T>(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value : internal;
  const currentRef = useRef(current);
  useLayoutEffect(() => {
    currentRef.current = current;
  });

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved =
        typeof next === 'function' ? (next as (prev: T) => T)(currentRef.current) : next;
      currentRef.current = resolved;
      if (!controlled) setInternal(resolved);
      onChange?.(resolved);
    },
    [controlled, onChange],
  );

  return [current, setValue];
}
