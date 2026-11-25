/** Number formatting shared by the table pages (USD amounts, compact counts). */
export const formatCurrency = (value: number, locale?: string) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(value);

export const formatNumber = (value: number, locale?: string) =>
  new Intl.NumberFormat(locale).format(value);
