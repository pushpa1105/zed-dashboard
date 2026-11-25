import { Check } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import { useControllableState } from './use-controllable-state';

export type ChoiceCardOption = {
  value: string;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  /** Right-aligned detail (price, badge…). */
  meta?: ReactNode;
  disabled?: boolean;
};

type CardProps = {
  option: ChoiceCardOption;
  checked: boolean;
  role: 'radio' | 'checkbox';
  onToggle: () => void;
};

function ChoiceCard({ option, checked, role, onToggle }: CardProps) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={checked}
      disabled={option.disabled}
      onClick={onToggle}
      className={cn(
        'relative flex w-full items-start gap-3 rounded-xl border bg-card p-4 text-left transition-colors outline-none hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
        checked && 'border-primary bg-primary/[0.03] ring-1 ring-primary',
      )}
    >
      {option.icon && (
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-4',
            checked && 'bg-primary/10 text-primary',
          )}
        >
          {option.icon}
        </span>
      )}
      <span className="min-w-0 flex-1 space-y-0.5">
        <span className="flex items-center justify-between gap-2 text-sm font-medium">
          {option.title}
          {option.meta && (
            <span className="text-xs font-normal text-muted-foreground">{option.meta}</span>
          )}
        </span>
        {option.description && (
          <span className="block text-xs text-muted-foreground">{option.description}</span>
        )}
      </span>
      <span
        aria-hidden
        className={cn(
          'mt-0.5 flex size-4 shrink-0 items-center justify-center border border-input',
          role === 'radio' ? 'rounded-full' : 'rounded-[4px]',
          checked && 'border-primary bg-primary text-primary-foreground',
        )}
      >
        {checked &&
          (role === 'radio' ? (
            <span className="size-1.5 rounded-full bg-current" />
          ) : (
            <Check className="size-3" />
          ))}
      </span>
    </button>
  );
}

type BaseProps = {
  options: ChoiceCardOption[];
  /** Grid columns on wide screens. */
  columns?: 1 | 2 | 3 | 4;
  'aria-label'?: string;
  className?: string;
};

const gridCols = {
  1: '',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
};

/** Single choice shown as rich cards (plans, shipping methods, roles). */
export function RadioCards({
  options,
  value: valueProp,
  defaultValue = null,
  onChange,
  columns = 2,
  'aria-label': ariaLabel,
  className,
}: BaseProps & {
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string) => void;
}) {
  const [value, setValue] = useControllableState<string | null>({
    value: valueProp,
    defaultValue,
    onChange: (v) => v !== null && onChange?.(v),
  });
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('grid gap-3', gridCols[columns], className)}
    >
      {options.map((o) => (
        <ChoiceCard
          key={o.value}
          option={o}
          role="radio"
          checked={o.value === value}
          onToggle={() => setValue(o.value)}
        />
      ))}
    </div>
  );
}

/** Multiple choice shown as rich cards (add-ons, integrations, notification channels). */
export function CheckboxCards({
  options,
  value: valueProp,
  defaultValue = [],
  onChange,
  columns = 2,
  'aria-label': ariaLabel,
  className,
}: BaseProps & {
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
}) {
  const [value, setValue] = useControllableState({ value: valueProp, defaultValue, onChange });
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn('grid gap-3', gridCols[columns], className)}
    >
      {options.map((o) => (
        <ChoiceCard
          key={o.value}
          option={o}
          role="checkbox"
          checked={value.includes(o.value)}
          onToggle={() =>
            setValue((prev) =>
              prev.includes(o.value) ? prev.filter((v) => v !== o.value) : [...prev, o.value],
            )
          }
        />
      ))}
    </div>
  );
}
