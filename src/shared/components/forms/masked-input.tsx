import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import { applyMask, slotCount, type MaskPattern } from './masks';
import { useControllableState } from './use-controllable-state';

export type MaskedInputProps = Omit<
  ComponentProps<'input'>,
  'value' | 'defaultValue' | 'onChange' | 'size'
> & {
  /** `9` digit, `a` letter, `*` alphanumeric; other characters are literals. See MASKS. */
  mask: MaskPattern;
  value?: string;
  defaultValue?: string;
  /** Receives the formatted value. Use `unmask()` to store raw characters. */
  onChange?: (value: string) => void;
  uppercase?: boolean;
  /** Content inside the field, before / after the text (icons, brand marks). */
  leading?: ReactNode;
  trailing?: ReactNode;
  size?: 'sm' | 'default' | 'lg';
  invalid?: boolean;
};

const SIZE = { sm: 'h-8 text-[0.8125rem]', default: 'h-9 text-sm', lg: 'h-10 text-sm' } as const;

/**
 * Text input that formats as you type (card numbers, IBAN, phone, dates).
 * The placeholder defaults to the mask itself so the format is visible.
 */
export function MaskedInput({
  mask,
  value: valueProp,
  defaultValue = '',
  onChange,
  uppercase,
  leading,
  trailing,
  size = 'default',
  invalid,
  className,
  placeholder,
  ...props
}: MaskedInputProps) {
  const [value, setValue] = useControllableState({
    value: valueProp,
    // Format a raw default ("4155550142") so it shows like typed input.
    defaultValue: applyMask(mask, defaultValue, uppercase),
    onChange,
  });
  const complete = value.replace(/[^a-z\d]/gi, '').length === slotCount(mask);

  return (
    <div
      data-complete={complete || undefined}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg border border-input bg-transparent px-3 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-[input:disabled]:opacity-50 dark:bg-input/30',
        invalid && 'border-destructive ring-3 ring-destructive/20',
        SIZE[size],
        className,
      )}
    >
      {leading && <span className="flex shrink-0 text-muted-foreground">{leading}</span>}
      <input
        {...props}
        aria-invalid={invalid || undefined}
        inputMode={/^[9\W]+$/.test(mask) ? 'numeric' : undefined}
        value={value}
        placeholder={placeholder ?? mask.replace(/9/g, '0').replace(/[a*]/g, 'X')}
        onChange={(e) => setValue(applyMask(mask, e.target.value, uppercase))}
        className="h-full w-full min-w-0 flex-1 bg-transparent font-mono tracking-wide tabular-nums outline-none placeholder:text-muted-foreground/70"
      />
      {trailing && <span className="flex shrink-0 text-muted-foreground">{trailing}</span>}
    </div>
  );
}
