import { verifyToken } from './auth';
import { getPool } from './db';

/**
 * Check if user has admin role
 */
export async function requireAdmin(token) {
  if (!token) {
    throw new Error('Unauthorized');
  }

  const user = verifyToken(token);
  const pool = getPool();
  
  const [rows] = await pool.query(
    `SELECT role FROM users WHERE id = ? LIMIT 1`,
    [user.id]
  );
  
  const userRole = rows[0]?.role;
  if (userRole !== 'admin') {
    throw new Error('Forbidden: Admin access required');
  }
  
  return user;
}

