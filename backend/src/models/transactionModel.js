import { getPool } from '../config/db.js';

export const ensureTransactionTable = async () => {
  const pool = getPool();
  const sql = `
    CREATE TABLE IF NOT EXISTS transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      type ENUM('exchange', 'transfer') NOT NULL,
      source_wallet_id INT NULL,
      target_wallet_id INT NULL,
      source_currency VARCHAR(10) NOT NULL,
      target_currency VARCHAR(10) NOT NULL,
      source_amount DECIMAL(18, 4) NOT NULL,
      target_amount DECIMAL(18, 4) NOT NULL,
      fx_rate DECIMAL(18, 8) NULL,
      fee_amount DECIMAL(18, 4) DEFAULT 0,
      note VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_tx_user (user_id),
      INDEX idx_tx_type (type),
      CONSTRAINT fk_tx_user FOREIGN KEY (user_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  await pool.query(sql);
};

export const createTransaction = async (tx, conn = null) => {
  const executor = conn || getPool();
  const {
    userId,
    type,
    sourceWalletId,
    targetWalletId,
    sourceCurrency,
    targetCurrency,
    sourceAmount,
    targetAmount,
    fxRate,
    feeAmount = 0,
    note,
  } = tx;

  const [result] = await executor.query(
    `
    INSERT INTO transactions
      (user_id, type, source_wallet_id, target_wallet_id, source_currency, target_currency,
       source_amount, target_amount, fx_rate, fee_amount, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      userId,
      type,
      sourceWalletId || null,
      targetWalletId || null,
      sourceCurrency,
      targetCurrency,
      sourceAmount,
      targetAmount,
      fxRate,
      feeAmount,
      note || null,
    ],
  );
  return result.insertId;
};

export const listTransactionsForUser = async (userId, { limit = 20 } = {}) => {
  const pool = getPool();
  const [rows] = await pool.query(
    `
    SELECT
      id,
      type,
      source_currency,
      target_currency,
      source_amount,
      target_amount,
      fx_rate,
      fee_amount,
      note,
      created_at
    FROM transactions
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `,
    [userId, limit],
  );
  return rows;
};


