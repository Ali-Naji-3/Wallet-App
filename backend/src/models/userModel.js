import { getPool } from '../config/db.js';

// Create the users table if it does not exist (simple bootstrap for dev)
export const ensureUserTable = async () => {
  const pool = getPool();
  // Basic user table aligned with Phase 1 requirements + admin role
  const createSql = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) DEFAULT NULL,
      base_currency VARCHAR(10) DEFAULT 'USD',
      timezone VARCHAR(100) DEFAULT 'UTC',
      role ENUM('user', 'admin') DEFAULT 'user',
      is_verified TINYINT(1) DEFAULT 0,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  await pool.query(createSql);

  // Add role column if table existed before this update
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN role ENUM('user', 'admin') DEFAULT 'user' AFTER timezone`);
  } catch (e) {
    // Column already exists, ignore
  }
};

export const findUserByEmail = async (email) => {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
};

export const findUserById = async (id) => {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] || null;
};

export const createUser = async ({ email, passwordHash, fullName, baseCurrency = 'USD', timezone = 'UTC' }) => {
  const pool = getPool();
  const [result] = await pool.query(
    `INSERT INTO users (email, password_hash, full_name, base_currency, timezone)
     VALUES (?, ?, ?, ?, ?)`,
    [email, passwordHash, fullName || null, baseCurrency, timezone]
  );
  return findUserById(result.insertId);
};

export const updateUserProfile = async (id, { fullName, baseCurrency, timezone }) => {
  const pool = getPool();
  await pool.query(
    `UPDATE users
     SET full_name = ?, base_currency = ?, timezone = ?
     WHERE id = ?`,
    [fullName || null, baseCurrency || 'USD', timezone || 'UTC', id]
  );
  return findUserById(id);
};

export const updateUserPassword = async (id, passwordHash) => {
  const pool = getPool();
  await pool.query(
    `UPDATE users
     SET password_hash = ?
     WHERE id = ?`,
    [passwordHash, id]
  );
  return findUserById(id);
};

// Admin functions
export const listAllUsers = async (limit = 50, offset = 0, search = '') => {
  const pool = getPool();
  let sql = `SELECT id, email, full_name, base_currency, timezone, role, is_verified, is_active, created_at
             FROM users`;
  const params = [];

  if (search) {
    sql += ` WHERE email LIKE ? OR full_name LIKE ?`;
    params.push(`%${search}%`, `%${search}%`);
  }

  sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const [rows] = await pool.query(sql, params);
  return rows;
};

export const countAllUsers = async (search = '') => {
  const pool = getPool();
  let sql = `SELECT COUNT(*) as count FROM users`;
  const params = [];

  if (search) {
    sql += ` WHERE email LIKE ? OR full_name LIKE ?`;
    params.push(`%${search}%`, `%${search}%`);
  }

  const [rows] = await pool.query(sql, params);
  return rows[0]?.count || 0;
};

export const setUserActiveStatus = async (id, isActive) => {
  const pool = getPool();
  await pool.query(
    `UPDATE users SET is_active = ? WHERE id = ?`,
    [isActive ? 1 : 0, id]
  );
  return findUserById(id);
};

export const setUserRole = async (id, role) => {
  const pool = getPool();
  await pool.query(
    `UPDATE users SET role = ? WHERE id = ?`,
    [role, id]
  );
  return findUserById(id);
};


