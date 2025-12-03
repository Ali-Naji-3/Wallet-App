import { getPool } from '../config/db.js';

export const ensureNotificationTable = async () => {
  const pool = getPool();
  const sql = `
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      body TEXT DEFAULT NULL,
      is_read TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_notifications_user (user_id),
      CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  await pool.query(sql);
};

export const createNotification = async ({ userId, type, title, body }, conn = null) => {
  const executor = conn || getPool();
  await executor.query(
    `
    INSERT INTO notifications (user_id, type, title, body)
    VALUES (?, ?, ?, ?)
  `,
    [userId, type, title, body || null],
  );
};

export const listNotificationsForUser = async (userId, { limit = 20 } = {}) => {
  const pool = getPool();
  const [rows] = await pool.query(
    `
    SELECT id, type, title, body, is_read, created_at
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `,
    [userId, limit],
  );
  return rows;
};

export const markNotificationRead = async (userId, notificationId) => {
  const pool = getPool();
  await pool.query(
    `
    UPDATE notifications
    SET is_read = 1
    WHERE id = ? AND user_id = ?
  `,
    [notificationId, userId],
  );
};


