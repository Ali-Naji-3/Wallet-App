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
  const host = getEnv('MYSQL_HOST');
  const port = Number(process.env.MYSQL_PORT || 3306);
  const user = getEnv('MYSQL_USER');
  const password = process.env.MYSQL_PASSWORD || '';
  const database = getEnv('MYSQL_DB');

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

