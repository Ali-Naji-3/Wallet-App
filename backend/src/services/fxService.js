import fetch from 'node-fetch';
import { saveFxRatesBatch, getLatestRatesForBase } from '../models/fxRateModel.js';

const DEFAULT_BASE = 'USD';

// Fallback static rates in case API fails
const FALLBACK_RATES = {
  USD: { EUR: 0.92, GBP: 0.79, JPY: 149.50, CHF: 0.88, CAD: 1.36, AUD: 1.53 },
  EUR: { USD: 1.09, GBP: 0.86, JPY: 162.50, CHF: 0.96, CAD: 1.48, AUD: 1.66 },
  GBP: { USD: 1.27, EUR: 1.16, JPY: 189.00, CHF: 1.11, CAD: 1.72, AUD: 1.93 },
};

export const fetchAndStoreLatestRates = async (baseCurrency = DEFAULT_BASE) => {
  try {
    // Try free API: frankfurter.app (European Central Bank rates)
    const url = `https://api.frankfurter.app/latest?from=${encodeURIComponent(baseCurrency)}`;
    const res = await fetch(url, { timeout: 5000 });
    
    if (!res.ok) {
      throw new Error(`API returned ${res.status}`);
    }
    
    const data = await res.json();
    
    if (!data || !data.rates) {
      throw new Error('Invalid FX response structure');
    }
    
    // Add the base currency with rate 1
    const rates = { ...data.rates, [baseCurrency]: 1 };
    
    await saveFxRatesBatch(baseCurrency, rates);
    return { base: baseCurrency, rates };
    
  } catch (err) {
    console.warn('FX API fetch failed, using fallback rates:', err.message);
    
    // Use fallback static rates
    const fallback = FALLBACK_RATES[baseCurrency] || FALLBACK_RATES.USD;
    const rates = { ...fallback, [baseCurrency]: 1 };
    
    // Try to save fallback rates
    try {
      await saveFxRatesBatch(baseCurrency, rates);
    } catch (saveErr) {
      console.warn('Could not save fallback rates:', saveErr.message);
    }
    
    return { base: baseCurrency, rates };
  }
};

// Get rates - first from DB, fetch fresh if needed
export const getLatestRates = async (baseCurrency = DEFAULT_BASE) => {
  // Check if we have recent rates (last 5 minutes)
  const stored = await getLatestRatesForBase(baseCurrency);
  
  if (stored && stored.length > 0) {
    const lastFetch = new Date(stored[0].fetched_at);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    if (lastFetch > fiveMinutesAgo) {
      // Return cached rates
      return {
        base: baseCurrency,
        rates: stored.reduce((acc, r) => {
          acc[r.quote_currency] = parseFloat(r.rate);
          return acc;
        }, {}),
      };
    }
  }
  
  // Fetch fresh rates
  return fetchAndStoreLatestRates(baseCurrency);
};
