import { Star } from 'lucide-react';

import { cn } from '@/shared/lib/cn';

export type RatingStarsProps = {
  /** 0 – max, halves allowed (4.5). */
  value: number;
  max?: number;
  size?: 'sm' | 'md';
  /** Show the numeric value and optional review count. */
  showValue?: boolean;
  count?: number;
  className?: string;
};

/** Read-only star rating with partial fills. */
export function RatingStars({
  value,
  max = 5,
  size = 'sm',
  showValue,
  count,
  className,
}: RatingStarsProps) {
  const iconSize = size === 'sm' ? 'size-3.5' : 'size-5';

  return (
    <span
      className={cn('inline-flex items-center gap-1.5', className)}
      role="img"
      aria-label={`${value} out of ${max}`}
    >
      <span className="inline-flex">
        {Array.from({ length: max }, (_, i) => {
          const fill = Math.max(0, Math.min(1, value - i));
          return (
            <span key={i} className="relative">
              <Star
                className={cn(iconSize, 'text-muted-foreground/30')}
                fill="currentColor"
                strokeWidth={0}
              />
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star
                  className={cn(iconSize, 'text-warning')}
                  fill="currentColor"
                  strokeWidth={0}
                />
              </span>
            </span>
          );
        })}
      </span>
      {showValue && (
        <span className="text-sm font-medium tabular-nums">
          {value.toFixed(1)}
          {count !== undefined && (
            <span className="ml-1 font-normal text-muted-foreground">
              ({count.toLocaleString()})
            </span>
          )}
        </span>
      )}
    </span>
  );
}
