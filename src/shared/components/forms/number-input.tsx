import { Minus, Plus } from 'lucide-react';
import { useState, type KeyboardEvent, type ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import { useControllableState } from './use-controllable-state';

export type NumberInputProps = {
  value?: number | null;
  defaultValue?: number | null;
  onChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Decimal places kept on blur. */
  precision?: number;
  /** Display formatting when not focused. */
  format?: 'plain' | 'currency' | 'percent' | 'grouped';
  currency?: string;
  locale?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  /** Show −/+ buttons. */
  steppers?: boolean;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  id?: string;
  name?: string;
  className?: string;
  'aria-label'?: string;
};

const clamp = (n: number, min?: number, max?: number) =>
  Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));

/**
 * Numeric field with steppers, min/max/step, arrow-key and Shift+arrow (×10)
 * stepping, and locale formatting (currency, percent, grouping) while blurred.
 * The raw number is what `onChange` receives.
 */
export function NumberInput({
  value: valueProp,
  defaultValue = null,
  onChange,
  min,
  max,
  step = 1,
  precision,
  format = 'plain',
  currency = 'USD',
  locale,
  prefix,
  suffix,
  steppers = true,
  placeholder,
  disabled,
  readOnly,
  invalid,
  id,
  name,
  className,
  'aria-label': ariaLabel,
}: NumberInputProps) {
  const [value, setValue] = useControllableState<number | null>({
    value: valueProp,
    defaultValue,
    onChange,
  });
  const [draft, setDraft] = useState<string | null>(null);

  const decimals = precision ?? (format === 'currency' ? 2 : undefined);
  const formatted =
    value === null || value === undefined
      ? ''
      : format === 'plain'
        ? String(value)
        : new Intl.NumberFormat(locale, {
            style:
              format === 'currency' ? 'currency' : format === 'percent' ? 'percent' : 'decimal',
            currency,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals ?? 2,
          }).format(format === 'percent' ? value / 100 : value);

  const commit = (n: number | null) => {
    if (n === null || Number.isNaN(n)) return setValue(null);
    const rounded = decimals !== undefined ? Number(n.toFixed(decimals)) : n;
    setValue(clamp(rounded, min, max));
  };

  const bump = (dir: 1 | -1, multiplier = 1) =>
    commit(Number(((value ?? min ?? 0) + dir * step * multiplier).toFixed(10)));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      bump(e.key === 'ArrowUp' ? 1 : -1, e.shiftKey ? 10 : 1);
      setDraft(null);
    }
  };

  const stepperClass =
    'flex h-full w-8 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40';

  return (
    <div
      aria-invalid={invalid}
      className={cn(
        'flex h-9 w-full items-center overflow-hidden rounded-lg border border-input bg-transparent text-sm transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30',
        disabled && 'opacity-50',
        className,
      )}
    >
      {steppers && !readOnly && (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Decrease"
          className={cn(stepperClass, 'border-r')}
          disabled={disabled || (min !== undefined && (value ?? min) <= min)}
          onClick={() => bump(-1)}
        >
          <Minus className="size-3.5" />
        </button>
      )}
      {prefix && <span className="pl-2.5 text-muted-foreground">{prefix}</span>}
      <input
        id={id}
        name={name}
        inputMode="decimal"
        role="spinbutton"
        aria-label={ariaLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value ?? undefined}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholder}
        value={draft ?? formatted}
        onFocus={() => setDraft(value === null || value === undefined ? '' : String(value))}
        onChange={(e) => {
          const next = e.target.value.replace(/[^\d.,-]/g, '').replace(',', '.');
          setDraft(next);
          if (next === '' || next === '-') return setValue(null);
          const n = Number(next);
          if (!Number.isNaN(n)) setValue(n);
        }}
        onBlur={() => {
          commit(draft === null || draft === '' ? null : Number(draft));
          setDraft(null);
        }}
        onKeyDown={onKeyDown}
        className={cn(
          'h-full w-full min-w-0 flex-1 bg-transparent px-3 tabular-nums outline-none placeholder:text-muted-foreground',
          steppers && 'text-center',
        )}
      />
      {suffix && <span className="pr-2.5 text-muted-foreground">{suffix}</span>}
      {steppers && !readOnly && (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Increase"
          className={cn(stepperClass, 'border-l')}
          disabled={disabled || (max !== undefined && (value ?? -Infinity) >= max)}
          onClick={() => bump(1)}
        >
          <Plus className="size-3.5" />
        </button>
      )}
    </div>
  );
}
