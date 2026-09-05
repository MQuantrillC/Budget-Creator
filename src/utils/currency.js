const FRANKFURTER_API_URL = 'https://api.frankfurter.app';
const OPEN_EXCHANGE_API_URL = 'https://open.er-api.com/v6/latest';

// Fetch PEN rate from Open Exchange Rates API (USD base)
async function getPENRate() {
  try {
    const response = await fetch(`${OPEN_EXCHANGE_API_URL}/USD`);
    if (!response.ok) {
      console.warn(`PEN rate fetch failed: ${response.status}`);
      return null;
    }
    const data = await response.json();
    return data.rates?.PEN || null;
  } catch (error) {
    console.warn('Could not fetch PEN rate:', error.message);
    return null;
  }
}

// Fallback provider: Open Exchange Rates supports every base currency we
// offer (including PEN) and returns the full rates table directly.
async function getRatesFromOpenExchange(base) {
  const response = await fetch(`${OPEN_EXCHANGE_API_URL}/${base}`);
  if (!response.ok) {
    throw new Error(`Fallback rates fetch failed: ${response.status}`);
  }
  const data = await response.json();
  if (!data.rates) {
    throw new Error('Fallback rates response missing rates');
  }
  return data.rates;
}

async function getRatesFromFrankfurter(originalBase) {
  // Frankfurter doesn't support PEN as a base; use USD as a proxy
  const base = originalBase === 'PEN' ? 'USD' : originalBase;

  const response = await fetch(`${FRANKFURTER_API_URL}/latest?from=${base}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch rates: ${response.status} for base currency: ${base}`);
  }
  const data = await response.json();
  let rates = { ...data.rates };

  // Merge in the PEN rate (not provided by Frankfurter)
  try {
    const usdToPen = await getPENRate();

    if (usdToPen && typeof usdToPen === 'number') {
      if (originalBase === 'PEN') {
        // Convert all rates from USD base to PEN base
        const penRates = {};
        penRates.USD = 1 / usdToPen;
        for (const [currency, usdRate] of Object.entries(rates)) {
          if (currency !== 'USD') {
            penRates[currency] = usdRate / usdToPen;
          }
        }
        return penRates;
      } else if (base === 'USD') {
        rates.PEN = usdToPen;
      } else if (rates.USD && typeof rates.USD === 'number') {
        rates.PEN = rates.USD * usdToPen;
      }
    }
  } catch (penError) {
    // PEN is optional — continue without it
    console.warn('PEN integration failed, continuing without it:', penError.message);
  }

  return rates;
}

/**
 * Fetch the latest exchange rates for the given base currency.
 * Tries Frankfurter first, falls back to Open Exchange Rates, and finally
 * returns an empty table so the app still works (amounts just stay
 * unconverted) when no provider is reachable.
 */
export async function getLatestRates(base = 'EUR') {
  if (!base || typeof base !== 'string') {
    console.warn('Invalid base currency, using EUR as fallback:', base);
    base = 'EUR';
  }

  try {
    return await getRatesFromFrankfurter(base);
  } catch (frankfurterError) {
    console.warn('Frankfurter unavailable, trying fallback provider:', frankfurterError.message);
  }

  try {
    return await getRatesFromOpenExchange(base);
  } catch (fallbackError) {
    console.error('All exchange rate providers failed:', fallbackError.message);
  }

  // No provider reachable — return an empty table so the UI can still load.
  return {};
}
