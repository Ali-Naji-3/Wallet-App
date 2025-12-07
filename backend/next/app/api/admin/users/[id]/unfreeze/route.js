import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer } from '@/lib/auth';
import { requireAdmin } from '@/lib/admin';

export async function POST(req, { params }) {
  try {
    const token = parseBearer(req.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await requireAdmin(token);
    
    // Handle params - might be a Promise in Next.js 15+
    let resolvedParams = params;
    if (params && typeof params.then === 'function') {
      resolvedParams = await params;
    }
    
    // Try to get ID from params or URL
    let userId = null;
    if (resolvedParams?.id) {
      userId = parseInt(String(resolvedParams.id), 10);
    } else {
      // Fallback: extract from URL pathname
      // URL format: /api/admin/users/4/unfreeze
      // Segments: ['api', 'admin', 'users', '4', 'unfreeze']
      const url = new URL(req.url);
      const segments = url.pathname.split('/').filter(Boolean);
      const usersIndex = segments.indexOf('users');
      if (usersIndex !== -1 && segments[usersIndex + 1]) {
        userId = parseInt(segments[usersIndex + 1], 10);
      }
    }

    if (!userId || isNaN(userId) || userId <= 0) {
      console.error('[Unfreeze] Invalid user ID. Params:', resolvedParams, 'URL:', req.url);
      return NextResponse.json({ 
        message: 'Invalid user ID',
        debug: { params: resolvedParams, url: req.url }
      }, { status: 400 });
    }

    const pool = getPool();

    // First check if user exists
    const [userCheck] = await pool.query(
      `SELECT id, email, full_name, is_active FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    if (!userCheck || userCheck.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const existingUser = userCheck[0];
    
    // If user is already active, return success
    if (existingUser.is_active === 1) {
      return NextResponse.json({
        message: 'User account is already active',
        user: {
          id: existingUser.id,
          email: existingUser.email,
          isActive: true,
        },
      });
    }

    // Check if suspension_reason column exists and clear it
    let updateQuery = `UPDATE users SET is_active = 1`;
    try {
      const [cols] = await pool.query(`SHOW COLUMNS FROM users LIKE 'suspension_reason'`);
      if (cols.length > 0) {
        updateQuery += `, suspension_reason = NULL`;
      }
    } catch (colErr) {
      // Column doesn't exist, continue without it
    }
    updateQuery += ` WHERE id = ?`;
    
    // Unfreeze user and clear suspension reason
    await pool.query(updateQuery, [userId]);

    // Get updated user
    const [userRows] = await pool.query(
      `SELECT id, email, full_name, is_active FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    const user = userRows[0];

    // Create notification
    await pool.query(
      `INSERT INTO notifications (user_id, title, body, type)
       VALUES (?, ?, ?, ?)`,
      [
        userId,
        'Account Reactivated',
        'Good news! Your account has been reactivated. You can now log in and access all features again.',
        'security',
      ]
    );
    
    console.log(`[Admin] User ${userId} (${user.email}) account REACTIVATED`);

    return NextResponse.json({
      message: 'User account unfrozen',
      user: {
        id: user.id,
        email: user.email,
        isActive: !!user.is_active,
      },
    });
  } catch (err) {
    if (err.message === 'Unauthorized' || err.message.includes('Forbidden')) {
      return NextResponse.json({ message: err.message }, { status: err.message.includes('Forbidden') ? 403 : 401 });
    }
    console.error('Admin unfreeze user error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to unfreeze user' },
      { status: 500 }
    );
  }
}

