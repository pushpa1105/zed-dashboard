import { NumberInput, type NumberInputProps } from './number-input';

export type CurrencyInputProps = Omit<NumberInputProps, 'format' | 'steppers' | 'prefix'> & {
  currency?: string;
};

/**
 * Money amount: formatted with the locale's currency style when blurred,
 * plain number while typing, two decimals, never negative unless `min` allows.
 */
export function CurrencyInput({ min = 0, step = 1, ...props }: CurrencyInputProps) {
  return (
    <NumberInput
      {...props}
      min={min}
      step={step}
      precision={2}
      format="currency"
      steppers={false}
      className={props.className}
    />
  );
}
