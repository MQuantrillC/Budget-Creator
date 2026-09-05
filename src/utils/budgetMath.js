/**
 * Shared helpers for currency conversion and frequency normalization.
 * Keeping this logic in one place so the dashboard, charts, tables and
 * goals all agree on the numbers.
 */

/**
 * Convert a recurring amount to its monthly equivalent.
 * One-time entries return 0 — they don't recur.
 */
export function toMonthlyAmount(amount, frequency) {
  switch (frequency) {
    case 'monthly': return amount;
    case 'weekly': return (amount * 52) / 12;
    case 'biweekly': return (amount * 26) / 12;
    case 'semiannually': return amount / 6;
    case 'yearly': return amount / 12;
    default: return 0;
  }
}

/**
 * Convert a recurring amount to its yearly equivalent.
 * One-time entries count once.
 */
export function toYearlyAmount(amount, frequency) {
  switch (frequency) {
    case 'monthly': return amount * 12;
    case 'weekly': return amount * 52;
    case 'biweekly': return amount * 26;
    case 'semiannually': return amount * 2;
    case 'yearly': return amount;
    case 'one-time': return amount;
    default: return amount;
  }
}

/**
 * Build currency converters for a given rates table and base currency.
 * Rates are expressed as 1 base = rate * currency.
 */
export function makeConverters(exchangeRates, baseCurrency) {
  const toBase = (amount, currency) => {
    if (!exchangeRates || currency === baseCurrency) return amount;
    const rate = exchangeRates[currency];
    return rate ? amount / rate : amount;
  };

  const toDisplay = (amount, fromCurrency, displayCurrency) => {
    if (!exchangeRates || fromCurrency === displayCurrency) return amount;
    const baseAmount = toBase(amount, fromCurrency);
    if (displayCurrency === baseCurrency) return baseAmount;
    const displayRate = exchangeRates[displayCurrency];
    return displayRate ? baseAmount * displayRate : baseAmount;
  };

  return { toBase, toDisplay };
}

/**
 * Sum the monthly equivalent of all recurring entries, converted with toBase.
 */
export function monthlyRecurringTotal(entries, toBase) {
  return entries
    .filter((e) => e.category !== 'one-time')
    .reduce((acc, e) => acc + toMonthlyAmount(toBase(e.amount, e.currency), e.category), 0);
}

/** Format an amount as currency (en-US locale, used app-wide). */
export function formatMoney(amount, currency, options = {}) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, ...options }).format(amount);
}
