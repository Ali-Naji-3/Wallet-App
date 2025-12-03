/**
 * ISR Example - Incremental Static Regeneration
 * This page is pre-built but can update every 60 seconds
 * Perfect for FX rates that change but don't need real-time updates
 */

import { getPool } from '@/lib/db';

export const revalidate = 60; // Revalidate every 60 seconds

export const metadata = {
  title: 'FX Rates',
  description: 'Latest foreign exchange rates',
};

export default async function FxRatesPage() {
  const pool = getPool();
  
  // Fetch latest rates from database
  const [rates] = await pool.query(
    `SELECT quote_currency, rate, fetched_at
     FROM fx_rates
     WHERE base_currency = 'USD'
     AND fetched_at = (
       SELECT MAX(fetched_at) FROM fx_rates WHERE base_currency = 'USD'
     )
     ORDER BY quote_currency ASC
     LIMIT 20`
  );

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">FX Rates (ISR)</h1>
        <p className="mb-4 text-gray-600">
          This page uses ISR - updates every 60 seconds automatically
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rates.map((rate) => (
            <div key={rate.quote_currency} className="p-4 border rounded-lg">
              <div className="font-bold text-xl">{rate.quote_currency}</div>
              <div className="text-2xl">{Number(rate.rate).toFixed(4)}</div>
              <div className="text-sm text-gray-500">
                Updated: {new Date(rate.fetched_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

