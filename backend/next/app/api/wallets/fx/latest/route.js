import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer, verifyToken } from '@/lib/auth';

// Fallback static rates in case API fails
const FALLBACK_RATES = {
  USD: { EUR: 0.92, GBP: 0.79, JPY: 149.50, CHF: 0.88, CAD: 1.36, AUD: 1.53 },
  EUR: { USD: 1.09, GBP: 0.86, JPY: 162.50, CHF: 0.96, CAD: 1.48, AUD: 1.66 },
  GBP: { USD: 1.27, EUR: 1.16, JPY: 189.00, CHF: 1.11, CAD: 1.72, AUD: 1.93 },
  JPY: { USD: 0.0067, EUR: 0.0062, GBP: 0.0053, CHF: 0.0059, CAD: 0.0091, AUD: 0.0102 },
};

async function fetchAndStoreLatestRates(baseCurrency) {
  const pool = getPool();
  
  try {
    // Try free API: frankfurter.app (European Central Bank rates)
    const url = `https://api.frankfurter.app/latest?from=${encodeURIComponent(baseCurrency)}`;
    const res = await fetch(url, { 
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (!res.ok) {
      throw new Error(`API returned ${res.status}`);
    }
    
    const data = await res.json();
    
    if (!data || !data.rates) {
      throw new Error('Invalid FX response structure');
    }
    
    // Add the base currency with rate 1
    const rates = { ...data.rates, [baseCurrency]: 1 };
    
    // Save to database
    const fetchedAt = new Date();
    const entries = Object.entries(rates).map(([quote, rate]) => [
      baseCurrency,
      quote,
      rate,
      fetchedAt,
    ]);

    if (entries.length > 0) {
      await pool.query(
        `INSERT INTO fx_rates (base_currency, quote_currency, rate, fetched_at)
         VALUES ?`,
        [entries]
      );
    }
    
    return { base: baseCurrency, rates };
    
  } catch (err) {
    console.warn('FX API fetch failed, using fallback rates:', err.message);
    
    // Use fallback static rates
    const fallback = FALLBACK_RATES[baseCurrency] || FALLBACK_RATES.USD;
    const rates = { ...fallback, [baseCurrency]: 1 };
    
    // Try to save fallback rates
    try {
      const fetchedAt = new Date();
      const entries = Object.entries(rates).map(([quote, rate]) => [
        baseCurrency,
        quote,
        rate,
        fetchedAt,
      ]);
      
      if (entries.length > 0) {
        await pool.query(
          `INSERT INTO fx_rates (base_currency, quote_currency, rate, fetched_at)
           VALUES ?`,
          [entries]
        );
      }
    } catch (saveErr) {
      console.warn('Could not save fallback rates:', saveErr.message);
    }
    
    return { base: baseCurrency, rates };
  }
}

async function getLatestRatesForBase(baseCurrency) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT r.base_currency,
            r.quote_currency,
            r.rate,
            r.fetched_at
     FROM fx_rates r
     INNER JOIN (
       SELECT base_currency, quote_currency, MAX(fetched_at) AS max_time
       FROM fx_rates
       WHERE base_currency = ?
       GROUP BY base_currency, quote_currency
     ) latest
       ON r.base_currency = latest.base_currency
      AND r.quote_currency = latest.quote_currency
      AND r.fetched_at = latest.max_time
     ORDER BY r.quote_currency ASC`,
    [baseCurrency]
  );
  return rows;
}

export async function GET(req) {
  try {
    const token = parseBearer(req.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const user = verifyToken(token);
    if (!user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const base = searchParams.get('base') || 'USD';

    // Fetch fresh rates and store them; ignore errors silently in storage
    await fetchAndStoreLatestRates(base).catch((e) => {
      console.error('FX fetch warning:', e);
    });

    const stored = await getLatestRatesForBase(base);
    
    // Format response to match frontend expectations
    const rates = stored.map(r => ({
      quote_currency: r.quote_currency,
      rate: Number(r.rate),
      fetched_at: r.fetched_at,
    }));

    return NextResponse.json({
      baseCurrency: base,
      rates: rates,
    });
  } catch (err) {
    console.error('Get FX rates error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to load FX rates' },
      { status: 500 }
    );
  }
}

