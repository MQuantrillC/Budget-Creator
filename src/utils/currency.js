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
    console.warn("Could not fetch PEN rate:", error.message);
    return null;
  }
}

export async function getLatestRates(base = 'EUR') {
  try {
    // Validate base currency
    if (!base || typeof base !== 'string') {
      console.warn('Invalid base currency, using EUR as fallback:', base);
      base = 'EUR';
    }
    
    // Handle PEN as base currency (not supported by Frankfurter)
    const originalBase = base;
    if (base === 'PEN') {
      base = 'USD'; // Use USD as proxy since we get PEN rates in USD
    }
    
    // First, get the main rates from Frankfurter (this should always work)
    const response = await fetch(`${FRANKFURTER_API_URL}/latest?from=${base}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch rates: ${response.status} for base currency: ${base}`);
    }
    const data = await response.json();
    let rates = { ...data.rates };

    // Handle PEN rates and special case when PEN is the original base
    try {
      const usdToPen = await getPENRate();
      
      if (usdToPen && typeof usdToPen === 'number') {
        if (originalBase === 'PEN') {
          // Special case: PEN is the original base currency
          // Convert all rates from USD base to PEN base
          const penRates = {};
          
          // Add USD rate (1 USD = X PEN, so 1 PEN = 1/X USD)
          penRates.USD = 1 / usdToPen;
          
          // Convert all other rates from USD to PEN
          for (const [currency, usdRate] of Object.entries(rates)) {
            if (currency !== 'USD') {
              // USD -> currency rate divided by USD -> PEN rate = PEN -> currency rate
              penRates[currency] = usdRate / usdToPen;
            }
          }
          
          return penRates;
        } else {
          // Normal case: add PEN to existing rates
          if (base === 'USD') {
            // If base is USD, use the rate directly
            rates.PEN = usdToPen;
          } else if (rates.USD && typeof rates.USD === 'number') {
            // If base is not USD, convert through USD
            const baseToPen = rates.USD * usdToPen;
            rates.PEN = baseToPen;
          }
        }
      }
    } catch (penError) {
      // Silently continue without PEN - this is optional functionality
      console.warn("PEN integration failed, continuing without it:", penError.message);
    }

    return rates;
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    return null;
  }
} 