/**
 * OPTIMIZED Database Connection Pool (Option 7)
 * Better connection management and retry logic
 */

import mysql from 'mysql2/promise';

let pool = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

export function getEnv(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing env ${name}`);
  }
  return value;
}

export function getPool() {
  if (pool) return pool;
  
  const host = process.env.MYSQL_HOST || 'localhost';
  const port = Number(process.env.MYSQL_PORT || 3306);
  const user = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || '';
  const database = process.env.MYSQL_DB || 'fxwallet';

  if (!host || !user || !database) {
    throw new Error(`Missing required database environment variables. MYSQL_HOST, MYSQL_USER, and MYSQL_DB are required.`);
  }

  // OPTIMIZED: Better connection pool settings
  pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 20, // Increased from 10
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    // Connection timeout
    connectTimeout: 10000,
    // Reconnect on connection loss
    reconnect: true,
  });

  // Handle connection errors
  pool.on('connection', (connection) => {
    reconnectAttempts = 0;
    connection.on('error', (err) => {
      console.error('[DB] Connection error:', err);
      if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
        reconnectAttempts++;
        if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
          console.log(`[DB] Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
        }
      }
    });
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
 * Execute query with automatic retry on connection errors
 */
export async function queryWithRetry(sql, params = [], retries = 2) {
  const pool = getPool();
  
  for (let i = 0; i <= retries; i++) {
    try {
      return await pool.query(sql, params);
    } catch (error) {
      if (
        (error.code === 'PROTOCOL_CONNECTION_LOST' || 
         error.code === 'ECONNRESET' ||
         error.code === 'ETIMEDOUT') &&
        i < retries
      ) {
        console.warn(`[DB] Query failed, retrying (${i + 1}/${retries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      throw error;
    }
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

