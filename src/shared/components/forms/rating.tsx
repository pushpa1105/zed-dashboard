import { Star } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';

import { cn } from '@/shared/lib/cn';

import { useControllableState } from './use-controllable-state';

export type RatingProps = {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  max?: number;
  /** Allow half-star values. */
  allowHalf?: boolean;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** Show the numeric value after the stars. */
  showValue?: boolean;
  'aria-label'?: string;
  className?: string;
};

const SIZES = { sm: 'size-3.5', md: 'size-5', lg: 'size-6' };

/** Star rating with hover preview, half steps and arrow-key control. */
export function Rating({
  value: valueProp,
  defaultValue = 0,
  onChange,
  max = 5,
  allowHalf,
  readOnly,
  size = 'md',
  showValue,
  'aria-label': ariaLabel = 'Rating',
  className,
}: RatingProps) {
  const [value, setValue] = useControllableState({ value: valueProp, defaultValue, onChange });
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value;
  const step = allowHalf ? 0.5 : 1;

  const onKeyDown = (e: KeyboardEvent) => {
    if (readOnly) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      setValue(Math.min(max, value + step));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      setValue(Math.max(0, value - step));
    }
  };

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <div
        role="slider"
        tabIndex={readOnly ? -1 : 0}
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-readonly={readOnly}
        onKeyDown={onKeyDown}
        onMouseLeave={() => setHover(null)}
        className="flex rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {Array.from({ length: max }, (_, i) => {
          const fill = Math.max(0, Math.min(1, shown - i));
          return (
            <span key={i} className="relative">
              <Star
                className={cn(SIZES[size], 'text-muted-foreground/30')}
                fill="currentColor"
                strokeWidth={0}
              />
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star
                  className={cn(SIZES[size], 'text-warning')}
                  fill="currentColor"
                  strokeWidth={0}
                />
              </span>
              {!readOnly && (
                <span className="absolute inset-0 flex">
                  {(allowHalf ? [0.5, 1] : [1]).map((part) => (
                    <span
                      key={part}
                      className="h-full flex-1 cursor-pointer"
                      onMouseEnter={() => setHover(i + part)}
                      onClick={() => setValue(value === i + part ? 0 : i + part)}
                    />
                  ))}
                </span>
              )}
            </span>
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm text-muted-foreground tabular-nums">
          {shown.toFixed(allowHalf ? 1 : 0)} / {max}
        </span>
      )}
    </div>
  );
}
