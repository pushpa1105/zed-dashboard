import { useSearchParams } from './router';

/**
 * A value kept in the URL query, so filters survive reloads and links such as
 * `?status=overdue` open pre-filtered. The fallback is never written.
 */
export function useSearchParam(key: string, fallback: string) {
  const [params, setParams] = useSearchParams();
  const setValue = (value: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === fallback) next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true },
    );
  return [params.get(key) ?? fallback, setValue] as const;
}

/** Same, limited to known values: anything else in the URL reads as the fallback. */
export function useEnumParam<T extends string>(key: string, values: readonly T[], fallback: T) {
  const [raw, setValue] = useSearchParam(key, fallback);
  return [values.find((v) => v === raw) ?? fallback, setValue as (value: T) => void] as const;
}
