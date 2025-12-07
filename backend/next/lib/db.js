import mysql from 'mysql2/promise';

let pool = null;

export function getEnv(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing env ${name}`);
  }
  return value;
}

export function getPool() {
  if (pool) return pool;
  
  // Ensure environment variables are available
  const host = process.env.MYSQL_HOST || 'localhost';
  const port = Number(process.env.MYSQL_PORT || 3306);
  const user = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || '';
  const database = process.env.MYSQL_DB || 'fxwallet';

  // Validate required variables
  if (!host || !user || !database) {
    throw new Error(`Missing required database environment variables. MYSQL_HOST, MYSQL_USER, and MYSQL_DB are required.`);
  }

  pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
  return pool;
}

export async function pingDb() {
  const p = getPool();
  const conn = await p.getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
}

/**
 * Ensure notifications table exists
 */
export async function ensureNotificationTable() {
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
      INDEX idx_notifications_read (user_id, is_read),
      INDEX idx_notifications_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  try {
    await pool.query(sql);
    console.log('[DB] Notifications table ensured');
  } catch (error) {
    console.error('[DB] Error ensuring notifications table:', error);
    throw error;
  }
}

