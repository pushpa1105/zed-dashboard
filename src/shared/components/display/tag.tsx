import { X, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import { TONES, toneStyle, type Tone, type ToneAppearance } from './tone';

export type TagProps = {
  children: ReactNode;
  tone?: Tone;
  appearance?: ToneAppearance;
  size?: 'sm' | 'md' | 'lg';
  /** Leading colored dot. */
  dot?: boolean;
  icon?: LucideIcon;
  /** Shows a remove button and calls this when clicked. */
  onRemove?: () => void;
  removeLabel?: string;
  /** Fully rounded pill instead of a rounded rectangle. */
  pill?: boolean;
  className?: string;
};

/** Label chip for categories, statuses, filters and keywords. */
export function Tag({
  children,
  tone = 'neutral',
  appearance = 'soft',
  size = 'md',
  dot,
  icon: Icon,
  onRemove,
  removeLabel = 'Remove',
  pill,
  className,
}: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 border font-medium whitespace-nowrap',
        pill ? 'rounded-full' : 'rounded-md',
        size === 'sm' && 'h-5 px-1.5 text-[0.7rem]',
        size === 'md' && 'h-6 px-2 text-xs',
        size === 'lg' && 'h-7 px-2.5 text-sm',
        className,
      )}
      style={toneStyle(tone, appearance)}
    >
      {dot && (
        <span
          className="size-1.5 shrink-0 rounded-full"
          style={{ background: appearance === 'solid' ? 'currentColor' : TONES[tone] }}
        />
      )}
      {Icon && <Icon className="size-3.5 shrink-0" aria-hidden />}
      <span className="truncate">{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="-mr-0.5 ml-0.5 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}
