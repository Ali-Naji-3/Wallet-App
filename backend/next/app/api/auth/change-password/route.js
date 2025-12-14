import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer, verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

/**
 * POST /api/auth/change-password
 * Change user password (requires current password)
 */
export async function POST(req) {
  try {
    // ===== STEP 1: Authentication =====
    const token = parseBearer(req.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (tokenError) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token. Please log in again.' },
        { status: 401 }
      );
    }

    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = decoded.id;

    // ===== STEP 2: Parse Request Body =====
    const body = await req.json().catch(() => ({}));
    const { currentPassword, newPassword, confirmPassword } = body || {};

    // ===== STEP 3: Validation =====
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: 'All password fields are required',
          error: 'MISSING_FIELDS',
        },
        { status: 400 }
      );
    }

    // Password match validation
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: 'New password and confirm password do not match',
          error: 'PASSWORD_MISMATCH',
        },
        { status: 400 }
      );
    }

    // Password length validation
    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: 'New password must be at least 8 characters long',
          error: 'PASSWORD_TOO_SHORT',
        },
        { status: 400 }
      );
    }

    // Password strength validation
    const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordStrengthRegex.test(newPassword)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
          error: 'PASSWORD_WEAK',
        },
        { status: 400 }
      );
    }

    // Check if new password is same as current password
    if (currentPassword === newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: 'New password must be different from current password',
          error: 'PASSWORD_SAME',
        },
        { status: 400 }
      );
    }

    // ===== STEP 4: Database Operations =====
    const pool = getPool();

    // Get user with password hash
    const [userRows] = await pool.query(
      `SELECT id, email, password_hash, is_active FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    if (userRows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const user = userRows[0];

    // Check if account is active
    if (!user.is_active) {
      return NextResponse.json(
        {
          success: false,
          message: 'Account is suspended. Please contact support.',
          error: 'ACCOUNT_SUSPENDED',
        },
        { status: 403 }
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Current password is incorrect',
          error: 'INVALID_CURRENT_PASSWORD',
        },
        { status: 401 }
      );
    }

    // ===== STEP 5: Hash and Update Password =====
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await pool.query(
      `UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?`,
      [passwordHash, userId]
    );

    // ===== STEP 6: Log Security Event =====
    try {
      // Ensure security_logs table exists
      await pool.query(`
        CREATE TABLE IF NOT EXISTS security_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          action VARCHAR(50) NOT NULL,
          ip_address VARCHAR(45),
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id),
          INDEX idx_action (action),
          INDEX idx_created_at (created_at),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `).catch(() => {
        // Table might already exist, continue
      });

      await pool.query(
        `INSERT INTO security_logs (user_id, action, ip_address, user_agent, created_at)
         VALUES (?, 'password_changed', ?, ?, NOW())`,
        [
          userId,
          req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
          req.headers.get('user-agent') || 'unknown',
        ]
      );
    } catch (logError) {
      // Log error but don't fail the password change
      console.error('[Change Password] Failed to log security event:', logError);
    }

    console.log(`[Change Password] ✅ Password changed successfully for user ID: ${userId}, email: ${user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('[Change Password] ❌ Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to change password',
        error: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

