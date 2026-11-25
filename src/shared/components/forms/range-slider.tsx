import { cn } from '@/shared/lib/cn';
import { Slider } from '@/shared/ui/slider';

import { NumberInput } from './number-input';
import { useControllableState } from './use-controllable-state';

export type RangeSliderProps = {
  value?: [number, number];
  defaultValue?: [number, number];
  onChange?: (value: [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Show min/max number fields under the track. */
  inputs?: boolean;
  format?: 'plain' | 'currency' | 'percent' | 'grouped';
  /** Labels for the two fields. */
  labels?: [string, string];
  disabled?: boolean;
  className?: string;
};

/** Two-thumb range (price, age, size) synced with editable min/max fields. */
export function RangeSlider({
  value: valueProp,
  defaultValue = [20, 80],
  onChange,
  min = 0,
  max = 100,
  step = 1,
  inputs = true,
  format = 'plain',
  labels = ['Min', 'Max'],
  disabled,
  className,
}: RangeSliderProps) {
  const [value, setValue] = useControllableState({ value: valueProp, defaultValue, onChange });
  const [low, high] = value;

  return (
    <div className={cn('space-y-4', className)}>
      <Slider
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        minStepsBetweenThumbs={1}
        onValueChange={(v) => setValue([v[0] ?? min, v[1] ?? max])}
      />
      {inputs && (
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-xs text-muted-foreground">
            {labels[0]}
            <NumberInput
              value={low}
              min={min}
              max={high}
              step={step}
              format={format}
              steppers={false}
              disabled={disabled}
              onChange={(n) => setValue([n ?? min, high])}
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            {labels[1]}
            <NumberInput
              value={high}
              min={low}
              max={max}
              step={step}
              format={format}
              steppers={false}
              disabled={disabled}
              onChange={(n) => setValue([low, n ?? max])}
            />
          </label>
        </div>
      )}
    </div>
  );
}
