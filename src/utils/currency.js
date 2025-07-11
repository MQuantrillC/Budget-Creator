const API_BASE = 'https://api.frankfurter.app';

export async function getLatestRates(baseCurrency = 'USD') {
  try {
    const response = await fetch(`${API_BASE}/latest?from=${baseCurrency}`);
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates.');
    }
    const data = await response.json();
    return data.rates;
  } catch (error) {
    console.error('Currency API Error:', error);
    return null;
  }
} 