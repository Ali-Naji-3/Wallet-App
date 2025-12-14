import { getPool } from './db';

/**
 * Get latest FX rates for a base currency from database
 */
export async function getLatestRatesForBase(baseCurrency) {
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

