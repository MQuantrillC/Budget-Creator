const API_URL = 'https://api.frankfurter.app';

export async function getLatestRates(base = 'EUR') {
  try {
    const response = await fetch(`${API_URL}/latest?from=${base}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch rates: ${response.statusText}`);
    }
    const data = await response.json();
    return data.rates;
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    return null;
  }
} 