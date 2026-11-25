import { applyMask, cardBrand, luhnValid, MASKS, slotCount, unmask } from '../masks';

describe('input masks', () => {
  it('formats as you type and ignores characters that do not fit', () => {
    expect(applyMask(MASKS.card, '4242424242424242')).toBe('4242 4242 4242 4242');
    expect(applyMask(MASKS.card, '4242-42')).toBe('4242 42');
    expect(applyMask(MASKS.phoneUs, '4155550142')).toBe('(415) 555-0142');
    expect(applyMask(MASKS.date, '3112ab2026')).toBe('31/12/2026');
  });

  it('handles letters for IBAN and upper-cases on request', () => {
    expect(applyMask(MASKS.iban, 'gb82west1234', true)).toBe('GB82 WEST 1234');
  });

  it('unmasks and counts slots', () => {
    expect(unmask('(415) 555-0142')).toBe('4155550142');
    expect(slotCount(MASKS.expiry)).toBe(4);
  });

  it('detects brands and validates card checksums', () => {
    expect(cardBrand('4242')).toBe('visa');
    expect(cardBrand('5555')).toBe('mastercard');
    expect(cardBrand('3782')).toBe('amex');
    expect(luhnValid('4242424242424242')).toBe(true);
    expect(luhnValid('4242424242424241')).toBe(false);
  });
});
