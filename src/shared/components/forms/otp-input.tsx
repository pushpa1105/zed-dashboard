import { REGEXP_ONLY_DIGITS, REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp';
import { Fragment } from 'react';

import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/shared/ui/input-otp';

export type OtpInputProps = {
  value?: string;
  onChange?: (value: string) => void;
  /** Called once all slots are filled. */
  onComplete?: (value: string) => void;
  length?: number;
  /** Slots per group; groups are split by a separator (e.g. 3 → "123-456"). */
  groupSize?: number;
  /** `digits` (default) or `alphanumeric`. */
  charset?: 'digits' | 'alphanumeric';
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  autoFocus?: boolean;
};

/** One-time code input with grouped slots, paste support and auto-complete callback. */
export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  groupSize = 3,
  charset = 'digits',
  disabled,
  invalid,
  id,
  autoFocus,
}: OtpInputProps) {
  const groups = Math.ceil(length / groupSize);

  return (
    <InputOTP
      id={id}
      maxLength={length}
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      disabled={disabled}
      autoFocus={autoFocus}
      aria-invalid={invalid}
      pattern={charset === 'digits' ? REGEXP_ONLY_DIGITS : REGEXP_ONLY_DIGITS_AND_CHARS}
    >
      {Array.from({ length: groups }, (_, g) => (
        <Fragment key={g}>
          {g > 0 && <InputOTPSeparator />}
          <InputOTPGroup>
            {Array.from({ length: Math.min(groupSize, length - g * groupSize) }, (_, i) => (
              <InputOTPSlot key={i} index={g * groupSize + i} aria-invalid={invalid} />
            ))}
          </InputOTPGroup>
        </Fragment>
      ))}
    </InputOTP>
  );
}
