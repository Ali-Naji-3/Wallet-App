import { getPool } from '../config/db.js';

export const ensureFxRateTable = async () => {
  const pool = getPool();
  const sql = `
    CREATE TABLE IF NOT EXISTS fx_rates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      base_currency VARCHAR(10) NOT NULL,
      quote_currency VARCHAR(10) NOT NULL,
      rate DECIMAL(18, 8) NOT NULL,
      fetched_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_fx_pair_time (base_currency, quote_currency, fetched_at),
      INDEX idx_fx_pair (base_currency, quote_currency)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  await pool.query(sql);
};

export const saveFxRatesBatch = async (baseCurrency, rates) => {
  const pool = getPool();
  const fetchedAt = new Date();
  const entries = Object.entries(rates).map(([quote, rate]) => [
    baseCurrency,
    quote,
    rate,
    fetchedAt,
  ]);

  if (!entries.length) return;

  const sql = `
    INSERT INTO fx_rates (base_currency, quote_currency, rate, fetched_at)
    VALUES ?
  `;
  await pool.query(sql, [entries]);
};

export const getLatestRatesForBase = async (baseCurrency) => {
  const pool = getPool();
  // Get most recent fetched_at per pair
  const sql = `
    SELECT r.base_currency,
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
    ORDER BY r.quote_currency ASC
  `;
  const [rows] = await pool.query(sql, [baseCurrency]);
  return rows;
};


