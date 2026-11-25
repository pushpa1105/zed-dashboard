import { Check } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/shared/lib/cn';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';

import { useControllableState } from './use-controllable-state';

// theme-exempt: the picker outputs literal colors chosen by the user
const DEFAULT_SWATCHES = [
  '#6250d6',
  '#2a78d6',
  '#0ea5e9',
  '#1baf7a',
  '#16a34a',
  '#84cc16',
  '#eda100',
  '#eb6834',
  '#e34948',
  '#e87ba4',
  '#a855f7',
  '#64748b',
];

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export type ColorPickerProps = {
  /** Hex color: "#rrggbb" or "#rgb". */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  swatches?: string[];
  /** Render the palette inline instead of in a popover. */
  inline?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
};

function Palette({
  value,
  swatches,
  onPick,
}: {
  value: string;
  swatches: string[];
  onPick: (hex: string) => void;
}) {
  const [text, setText] = useState(value);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-6 gap-2">
        {swatches.map((hex) => (
          <button
            key={hex}
            type="button"
            aria-label={hex}
            aria-pressed={hex.toLowerCase() === value.toLowerCase()}
            onClick={() => {
              onPick(hex);
              setText(hex);
            }}
            className="flex size-7 items-center justify-center rounded-md ring-1 ring-foreground/10 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            style={{ background: hex }}
          >
            {hex.toLowerCase() === value.toLowerCase() && (
              <Check className="size-3.5 text-overlay-foreground" />
            )}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label="Custom color"
          // theme-exempt: native input needs a hex fallback
          value={HEX.test(value) && value.length === 7 ? value : '#000000'}
          onChange={(e) => {
            onPick(e.target.value);
            setText(e.target.value);
          }}
          className="size-8 cursor-pointer rounded-md border-0 bg-transparent p-0"
        />
        <input
          aria-label="Hex value"
          value={text}
          onChange={(e) => {
            const next = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`;
            setText(next);
            if (HEX.test(next)) onPick(next);
          }}
          aria-invalid={!HEX.test(text)}
          className="h-9 flex-1 rounded-lg border border-input bg-transparent px-3 font-mono text-sm uppercase outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
        />
      </div>
    </div>
  );
}

/** Brand/label color: curated swatches, native picker and a validated hex field. */
export function ColorPicker({
  value: valueProp,
  // theme-exempt: default brand color value
  defaultValue = '#6250d6',
  onChange,
  swatches = DEFAULT_SWATCHES,
  inline,
  disabled,
  id,
  className,
}: ColorPickerProps) {
  const [value, setValue] = useControllableState({ value: valueProp, defaultValue, onChange });

  if (inline) {
    return (
      <div className={className}>
        <Palette value={value} swatches={swatches} onPick={setValue} />
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          id={id}
          type="button"
          className={cn(
            'flex h-9 w-full items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30',
            className,
          )}
        >
          <span
            className="size-5 rounded-[5px] ring-1 ring-foreground/10"
            style={{ background: value }}
          />
          <span className="font-mono text-xs uppercase">{value}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <Palette value={value} swatches={swatches} onPick={setValue} />
      </PopoverContent>
    </Popover>
  );
}
