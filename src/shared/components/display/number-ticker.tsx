import { useEffect, useRef, useState } from 'react';

import { cn } from '@/shared/lib/cn';

export type NumberTickerProps = {
  value: number;
  /** Animation length in ms. */
  duration?: number;
  format?: (value: number) => string;
  className?: string;
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Counts up/down to `value` with an ease-out. Jumps straight there with reduced motion. */
export function NumberTicker({
  value,
  duration = 900,
  format = (v) => Math.round(v).toLocaleString(),
  className,
}: NumberTickerProps) {
  const [display, setDisplay] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    const start = from.current;
    if (prefersReducedMotion() || start === value) {
      from.current = value;
      setDisplay(value);
      return;
    }
    let frame = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - (1 - p) ** 3;
      setDisplay(start + (value - start) * eased);
      if (p < 1) frame = requestAnimationFrame(tick);
      else from.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      from.current = value;
    };
  }, [value, duration]);

  return <span className={cn('tabular-nums', className)}>{format(display)}</span>;
}
