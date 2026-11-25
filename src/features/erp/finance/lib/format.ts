const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const usdWhole = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const usdCompact = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const money = (value: number) => usd.format(value);
export const moneyWhole = (value: number) => usdWhole.format(value);
export const moneyCompact = (value: number) => usdCompact.format(value);
export const count = (value: number) => value.toLocaleString('en-US');
