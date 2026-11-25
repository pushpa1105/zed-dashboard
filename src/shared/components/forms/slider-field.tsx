import { Slider as SliderPrimitive } from 'radix-ui';

import { cn } from '@/shared/lib/cn';

import { useControllableState } from './use-controllable-state';

export type SliderMark = { value: number; label?: string };

export type SliderFieldProps = {
  value?: number[];
  defaultValue?: number[];
  onChange?: (value: number[]) => void;
  /** Fires on release (good for expensive updates). */
  onCommit?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Ticks on the track, optionally labelled; with `snapToMarks`, only these values are allowed. */
  marks?: SliderMark[];
  /** `always` shows value bubbles above the thumbs; `active` only while dragging/focused. */
  tooltip?: 'always' | 'active' | 'none';
  formatValue?: (value: number) => string;
  orientation?: 'horizontal' | 'vertical';
  /** Height of the vertical slider in px. */
  height?: number;
  disabled?: boolean;
  /** Accessible names per thumb (e.g. ["Minimum", "Maximum"]). */
  thumbLabels?: string[];
  className?: string;
};

/**
 * Slider with tick marks, labelled stops and value bubbles. One value or a
 * range (pass two values). Horizontal or vertical.
 */
export function SliderField({
  value: valueProp,
  defaultValue = [50],
  onChange,
  onCommit,
  min = 0,
  max = 100,
  step = 1,
  marks,
  tooltip = 'active',
  formatValue = String,
  orientation = 'horizontal',
  height = 180,
  disabled,
  thumbLabels,
  className,
}: SliderFieldProps) {
  const [value, setValue] = useControllableState({ value: valueProp, defaultValue, onChange });
  const vertical = orientation === 'vertical';
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  const hasLabels = marks?.some((m) => m.label);

  return (
    <div
      className={cn(
        'relative',
        vertical ? 'inline-flex' : 'w-full',
        !vertical && tooltip === 'always' && 'pt-8',
        !vertical && hasLabels && 'pb-6',
        className,
      )}
      style={vertical ? { height } : undefined}
    >
      <SliderPrimitive.Root
        value={value}
        onValueChange={setValue}
        onValueCommit={onCommit}
        min={min}
        max={max}
        step={step}
        orientation={orientation}
        disabled={disabled}
        className={cn(
          'relative flex touch-none items-center select-none data-disabled:opacity-50',
          vertical ? 'h-full w-5 flex-col' : 'h-5 w-full',
        )}
      >
        <SliderPrimitive.Track
          className={cn(
            'relative grow overflow-hidden rounded-full bg-muted',
            vertical ? 'w-1.5' : 'h-1.5',
          )}
        >
          <SliderPrimitive.Range
            className={cn('absolute bg-primary', vertical ? 'w-full' : 'h-full')}
          />
        </SliderPrimitive.Track>
        {marks?.map((mark) => (
          <span
            key={mark.value}
            aria-hidden
            className={cn(
              'pointer-events-none absolute size-1.5 rounded-full',
              value.length === 1
                ? mark.value <= value[0]!
                  ? 'bg-primary-foreground/80'
                  : 'bg-muted-foreground/40'
                : mark.value >= value[0]! && mark.value <= value[value.length - 1]!
                  ? 'bg-primary-foreground/80'
                  : 'bg-muted-foreground/40',
            )}
            style={
              vertical
                ? { bottom: `calc(${pct(mark.value)}% - 3px)`, left: 'calc(50% - 3px)' }
                : { left: `calc(${pct(mark.value)}% - 3px)`, top: 'calc(50% - 3px)' }
            }
          />
        ))}
        {value.map((v, i) => (
          <SliderPrimitive.Thumb
            key={i}
            aria-label={thumbLabels?.[i]}
            className="group/thumb relative block size-4 rounded-full border-2 border-primary bg-background shadow-sm ring-ring/40 transition-[box-shadow] outline-none hover:ring-4 focus-visible:ring-4"
          >
            {tooltip !== 'none' && (
              <span
                className={cn(
                  'pointer-events-none absolute rounded-md bg-foreground px-1.5 py-0.5 text-xs font-medium whitespace-nowrap text-background tabular-nums transition-opacity',
                  vertical
                    ? 'top-1/2 left-6 -translate-y-1/2'
                    : 'bottom-6 left-1/2 -translate-x-1/2',
                  tooltip === 'active' &&
                    'opacity-0 group-hover/thumb:opacity-100 group-focus-visible/thumb:opacity-100 group-active/thumb:opacity-100',
                )}
              >
                {formatValue(v)}
              </span>
            )}
          </SliderPrimitive.Thumb>
        ))}
      </SliderPrimitive.Root>
      {!vertical && hasLabels && (
        <div className="absolute inset-x-0 bottom-0 h-5">
          {marks!
            .filter((m) => m.label)
            .map((mark) => (
              <span
                key={mark.value}
                className="absolute -translate-x-1/2 text-xs text-muted-foreground tabular-nums"
                style={{ left: `${pct(mark.value)}%` }}
              >
                {mark.label}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
