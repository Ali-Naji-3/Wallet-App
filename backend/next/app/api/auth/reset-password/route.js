import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import bcrypt from 'bcryptjs';

/**
 * POST /api/auth/reset-password
 * Resets user password using valid token
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { token, password } = body || {};

    if (!token || !password) {
      return NextResponse.json(
        { message: 'Token and new password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const pool = getPool();
    
    // Find and validate token
    const [tokenRows] = await pool.query(
      `SELECT t.id, t.user_id, t.expires_at, t.used_at, u.email, u.full_name
       FROM password_reset_tokens t
       JOIN users u ON t.user_id = u.id
       WHERE t.token = ?
       LIMIT 1`,
      [token]
    );
    
    const resetToken = tokenRows[0];
    
    if (!resetToken) {
      return NextResponse.json(
        { 
          message: 'Invalid or expired reset token',
          error: 'INVALID_TOKEN'
        },
        { status: 400 }
      );
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(resetToken.expires_at);
    
    if (now > expiresAt) {
      return NextResponse.json(
        { 
          message: 'Reset token has expired. Please request a new one.',
          error: 'TOKEN_EXPIRED'
        },
        { status: 400 }
      );
    }

    // Check if token was already used
    if (resetToken.used_at) {
      return NextResponse.json(
        { 
          message: 'Reset token has already been used',
          error: 'TOKEN_USED'
        },
        { status: 400 }
      );
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Update password
    await pool.query(
      `UPDATE users 
       SET password_hash = ? 
       WHERE id = ?`,
      [passwordHash, resetToken.user_id]
    );

    // Mark token as used
    await pool.query(
      `UPDATE password_reset_tokens 
       SET used_at = NOW() 
       WHERE id = ?`,
      [resetToken.id]
    );

    // Clear failed login attempts
    await pool.query(
      `DELETE FROM login_attempts 
       WHERE email = ? AND success = FALSE`,
      [resetToken.email]
    );

    console.log(`✅ [ResetPassword] Password reset successful for: ${resetToken.email}`);

    return NextResponse.json({
      message: 'Password reset successful. You can now log in with your new password.',
      success: true,
    });
    
  } catch (err) {
    console.error('❌ [ResetPassword] Error:', err);
    return NextResponse.json(
      { message: 'Failed to reset password. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/reset-password?token=xxx
 * Validates reset token
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { message: 'Token is required', valid: false },
        { status: 400 }
      );
    }

    const pool = getPool();
    
    const [tokenRows] = await pool.query(
      `SELECT id, expires_at, used_at
       FROM password_reset_tokens
       WHERE token = ?
       LIMIT 1`,
      [token]
    );
    
    const resetToken = tokenRows[0];
    
    if (!resetToken) {
      return NextResponse.json({
        valid: false,
        message: 'Invalid reset token',
      });
    }

    const now = new Date();
    const expiresAt = new Date(resetToken.expires_at);
    
    if (now > expiresAt) {
      return NextResponse.json({
        valid: false,
        message: 'Reset token has expired',
      });
    }

    if (resetToken.used_at) {
      return NextResponse.json({
        valid: false,
        message: 'Reset token has already been used',
      });
    }

    return NextResponse.json({
      valid: true,
      message: 'Token is valid',
    });
    
  } catch (err) {
    console.error('❌ [ValidateToken] Error:', err);
    return NextResponse.json(
      { valid: false, message: 'Failed to validate token' },
      { status: 500 }
    );
  }
}