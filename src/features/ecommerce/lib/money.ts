/** Store currency formatting (USD), localized to the UI language. */
export const formatMoney = (value: number, locale?: string, fractionDigits = 2) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
