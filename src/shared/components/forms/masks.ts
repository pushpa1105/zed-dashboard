/**
 * Tiny input-mask engine (no dependency). A pattern uses:
 *   `9` → digit, `a` → letter, `*` → letter or digit; anything else is a literal.
 * `applyMask` takes raw user text, keeps the characters that fit the slots in
 * order and inserts literals as the user reaches them.
 */
export type MaskPattern = string;

const SLOT: Record<string, RegExp> = {
  '9': /\d/,
  a: /[a-z]/i,
  '*': /[a-z\d]/i,
};

export function applyMask(pattern: MaskPattern, input: string, uppercase = false): string {
  const chars = [...input].filter((c) => /[a-z\d]/i.test(c));
  let out = '';
  let i = 0;
  for (const token of pattern) {
    if (i >= chars.length) break;
    const slot = SLOT[token];
    if (!slot) {
      out += token;
      continue;
    }
    // Skip characters that cannot fill this slot.
    while (i < chars.length && !slot.test(chars[i]!)) i++;
    if (i >= chars.length) break;
    out += uppercase ? chars[i]!.toUpperCase() : chars[i];
    i++;
  }
  return out;
}

/** Characters of the value that fill slots (what you would store). */
export const unmask = (value: string) => value.replace(/[^a-z\d]/gi, '');

/** Number of input slots in a pattern. */
export const slotCount = (pattern: MaskPattern) =>
  [...pattern].filter((token) => token in SLOT).length;

/** Common presets. */
export const MASKS = {
  card: '9999 9999 9999 9999',
  expiry: '99/99',
  cvc: '999',
  phoneUs: '(999) 999-9999',
  date: '99/99/9999',
  time: '99:99',
  iban: 'aa99 **** **** **** **** **',
  zipUs: '99999',
  postcodeUk: '*** ***',
} as const;

/** Card brand from the first digits (enough for UI hints, not validation). */
export function cardBrand(digits: string): 'visa' | 'mastercard' | 'amex' | 'discover' | null {
  if (/^4/.test(digits)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mastercard';
  if (/^3[47]/.test(digits)) return 'amex';
  if (/^6(011|5)/.test(digits)) return 'discover';
  return null;
}

/** Luhn checksum for card numbers. */
export function luhnValid(digits: string): boolean {
  if (digits.length < 12) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}
