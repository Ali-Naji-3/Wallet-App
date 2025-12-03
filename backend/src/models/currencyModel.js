import { getPool } from '../config/db.js';

export const ensureCurrencyTable = async () => {
  const pool = getPool();
  const sql = `
    CREATE TABLE IF NOT EXISTS currencies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(10) NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL,
      symbol VARCHAR(10) DEFAULT NULL,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  await pool.query(sql);
};

export const seedDefaultCurrencies = async () => {
  const pool = getPool();
  const defaults = [
    ['USD', 'US Dollar', '$'],
    ['EUR', 'Euro', '€'],
    ['GBP', 'British Pound', '£'],
    ['JPY', 'Japanese Yen', '¥'],
    ['CHF', 'Swiss Franc', 'CHF'],
    ['CAD', 'Canadian Dollar', '$'],
    ['AUD', 'Australian Dollar', '$'],
  ];

  // Insert if not exists
  const insertSql = `
    INSERT IGNORE INTO currencies (code, name, symbol)
    VALUES ?
  `;
  await pool.query(insertSql, [defaults]);
};

export const listActiveCurrencies = async () => {
  const pool = getPool();
  const [rows] = await pool.query(
    'SELECT id, code, name, symbol FROM currencies WHERE is_active = 1 ORDER BY code ASC',
  );
  return rows;
};


