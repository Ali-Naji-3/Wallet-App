import { getPool } from './db';

/**
 * Check and record login attempt
 */
export async function checkLoginAttempts(email, ipAddress = 'unknown') {
  const pool = getPool();
  const timeWindow = 15; // minutes
  const maxAttempts = 5;
  
  try {
    const [attempts] = await pool.query(
      `SELECT COUNT(*) as count 
       FROM login_attempts 
       WHERE email = ? 
       AND success = FALSE 
       AND attempted_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
      [email, timeWindow]
    );
    
    const failedAttempts = attempts[0]?.count || 0;
    
    if (failedAttempts >= maxAttempts) {
      return {
        allowed: false,
        attemptsLeft: 0,
        message: `Too many failed login attempts. Please try again in ${timeWindow} minutes.`,
      };
    }
    
    return {
      allowed: true,
      attemptsLeft: maxAttempts - failedAttempts,
    };
  } catch (error) {
    console.error('Error checking login attempts:', error);
    return { allowed: true, attemptsLeft: maxAttempts };
  }
}

/**
 * Record a login attempt
 */
export async function recordLoginAttempt(email, ipAddress = 'unknown', success = false) {
  const pool = getPool();
  
  try {
    await pool.query(
      `INSERT INTO login_attempts (email, ip_address, success) 
       VALUES (?, ?, ?)`,
      [email, ipAddress, success]
    );
    
    await pool.query(
      `DELETE FROM login_attempts 
       WHERE attempted_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)`
    );
  } catch (error) {
    console.error('Error recording login attempt:', error);
  }
}

/**
 * Clear failed login attempts
 */
export async function clearLoginAttempts(email) {
  const pool = getPool();
  
  try {
    await pool.query(
      `DELETE FROM login_attempts 
       WHERE email = ? AND success = FALSE`,
      [email]
    );
  } catch (error) {
    console.error('Error clearing login attempts:', error);
  }
}