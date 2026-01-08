import { verifyToken } from './auth';
import { getPool } from './db';

/**
 * Check if user has admin role
 */
export async function requireAdmin(token) {
  if (!token) {
    throw new Error('Unauthorized: No token provided');
  }

  try {
    const user = verifyToken(token);
    if (!user || !user.id) {
      throw new Error('Unauthorized: Invalid token');
    }

    const pool = getPool();
    
    const [rows] = await pool.query(
      `SELECT role FROM users WHERE id = ? LIMIT 1`,
      [user.id]
    );
    
    if (!rows || rows.length === 0) {
      throw new Error('Unauthorized: User not found');
    }
    
    const userRole = rows[0]?.role;
    const normalizedRole = String(userRole || '').trim().toLowerCase();
    
    if (normalizedRole !== 'admin') {
      throw new Error('Forbidden: Admin access required');
    }
    
    return user;
  } catch (error) {
    // If token verification fails, throw a clear error
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw new Error('Unauthorized: Invalid or expired token');
    }
    throw error;
  }
}

