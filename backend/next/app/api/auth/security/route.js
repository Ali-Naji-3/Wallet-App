import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer, verifyToken } from '@/lib/auth';

/**
 * GET /api/auth/security
 * Get user security settings
 */
export async function GET(req) {
  try {
    const token = parseBearer(req.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (tokenError) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
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
    const pool = getPool();

    // Ensure security columns exist in users table (MySQL doesn't support IF NOT EXISTS)
    const securityColumns = [
      { name: 'two_factor_enabled', type: 'TINYINT(1) DEFAULT 0' },
      { name: 'two_factor_secret', type: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'security_questions_set', type: 'TINYINT(1) DEFAULT 0' },
      { name: 'last_password_change', type: 'TIMESTAMP NULL DEFAULT NULL' },
    ];

    for (const col of securityColumns) {
      try {
        await pool.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
        console.log(`[Security] ✅ Added column: ${col.name}`);
      } catch (alterError) {
        // Column already exists (Error 1060: Duplicate column name), ignore
        if (alterError.code === 'ER_DUP_FIELDNAME' || alterError.code === 1060) {
          // Column exists, continue
        } else {
          console.warn(`[Security] ⚠️ Could not add column ${col.name}:`, alterError.message);
        }
      }
    }

    // Get user security settings
    const [rows] = await pool.query(
      `SELECT 
        id,
        email,
        COALESCE(two_factor_enabled, 0) as two_factor_enabled,
        two_factor_secret,
        COALESCE(security_questions_set, 0) as security_questions_set,
        last_password_change,
        created_at
       FROM users 
       WHERE id = ? LIMIT 1`,
      [userId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const user = rows[0];

    return NextResponse.json({
      success: true,
      security: {
        twoFactorEnabled: !!user.two_factor_enabled,
        twoFactorSecret: user.two_factor_secret ? 'configured' : null, // Don't expose secret
        securityQuestionsSet: !!user.security_questions_set,
        lastPasswordChange: user.last_password_change,
        accountCreatedAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('[Security] ❌ Error getting security settings:', error);
    console.error('[Security] Error stack:', error.stack);
    console.error('[Security] Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
    });
    
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to get security settings',
        error: error.code || 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/auth/security
 * Update user security settings (2FA toggle, etc.)
 */
export async function PUT(req) {
  try {
    const token = parseBearer(req.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (tokenError) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
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
    const body = await req.json().catch(() => ({}));
    const { twoFactorEnabled } = body || {};

    const pool = getPool();

    // Ensure security columns exist in users table (MySQL doesn't support IF NOT EXISTS)
    const securityColumns = [
      { name: 'two_factor_enabled', type: 'TINYINT(1) DEFAULT 0' },
      { name: 'two_factor_secret', type: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'security_questions_set', type: 'TINYINT(1) DEFAULT 0' },
      { name: 'last_password_change', type: 'TIMESTAMP NULL DEFAULT NULL' },
    ];

    for (const col of securityColumns) {
      try {
        await pool.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
        console.log(`[Security] ✅ Added column: ${col.name}`);
      } catch (alterError) {
        // Column already exists (Error 1060: Duplicate column name), ignore
        if (alterError.code === 'ER_DUP_FIELDNAME' || alterError.code === 1060) {
          // Column exists, continue
        } else {
          console.warn(`[Security] ⚠️ Could not add column ${col.name}:`, alterError.message);
        }
      }
    }

    // Update 2FA setting
    if (typeof twoFactorEnabled === 'boolean') {
      await pool.query(
        `UPDATE users 
         SET two_factor_enabled = ?, updated_at = NOW() 
         WHERE id = ?`,
        [twoFactorEnabled ? 1 : 0, userId]
      );

      // Log security event
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
           VALUES (?, ?, ?, ?, NOW())`,
          [
            userId,
            twoFactorEnabled ? '2fa_enabled' : '2fa_disabled',
            req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
            req.headers.get('user-agent') || 'unknown',
          ]
        );
      } catch (logError) {
        console.error('[Security] Failed to log security event:', logError);
      }

      console.log(`[Security] ✅ 2FA ${twoFactorEnabled ? 'enabled' : 'disabled'} for user ID: ${userId}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Security settings updated successfully',
    });
  } catch (error) {
    console.error('[Security] ❌ Error updating security settings:', error);
    console.error('[Security] Error stack:', error.stack);
    console.error('[Security] Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
    });
    
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to update security settings',
        error: error.code || 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

