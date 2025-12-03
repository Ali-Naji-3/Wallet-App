import { getPool } from '../config/db.js';
import { listActiveCurrencies } from './currencyModel.js';

export const ensureWalletTable = async () => {
  const pool = getPool();
  const sql = `
    CREATE TABLE IF NOT EXISTS wallets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      currency_code VARCHAR(10) NOT NULL,
      address VARCHAR(64) NOT NULL UNIQUE,
      balance DECIMAL(18, 4) DEFAULT 0,
      status ENUM('active', 'frozen', 'closed') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_wallets_user FOREIGN KEY (user_id) REFERENCES users(id),
      INDEX idx_wallets_user (user_id),
      INDEX idx_wallets_currency (currency_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  await pool.query(sql);
};

const buildWalletAddress = (currencyCode) => {
  const random = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `FXW-${currencyCode}-${random}`;
};

export const createDefaultWalletsForUser = async (userId) => {
  const pool = getPool();
  const currencies = await listActiveCurrencies();
  if (!currencies.length) return;

  const values = currencies.map((c) => [
    userId,
    c.code,
    buildWalletAddress(c.code),
  ]);

  const sql = `
    INSERT INTO wallets (user_id, currency_code, address)
    VALUES ?
  `;
  await pool.query(sql, [values]);
};

export const listWalletsForUser = async (userId) => {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT id, currency_code, address, balance, status
     FROM wallets
     WHERE user_id = ?
     ORDER BY currency_code ASC`,
    [userId],
  );
  return rows;
};


