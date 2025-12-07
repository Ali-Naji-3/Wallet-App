import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer, verifyToken } from '@/lib/auth';
import { requireAdmin } from '@/lib/admin';

export async function POST(req, { params }) {
  try {
    const token = parseBearer(req.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    let adminUser;
    try {
      adminUser = await requireAdmin(token);
    } catch (authError) {
      console.error('[Freeze] Auth error:', authError.message);
      return NextResponse.json({ 
        message: authError.message || 'Unauthorized' 
      }, { status: 401 });
    }
    
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
      // URL format: /api/admin/users/4/freeze
      // Segments: ['api', 'admin', 'users', '4', 'freeze']
      const url = new URL(req.url);
      const segments = url.pathname.split('/').filter(Boolean);
      const usersIndex = segments.indexOf('users');
      if (usersIndex !== -1 && segments[usersIndex + 1]) {
        userId = parseInt(segments[usersIndex + 1], 10);
      }
    }

    if (!userId || isNaN(userId) || userId <= 0) {
      console.error('[Freeze] Invalid user ID. Params:', resolvedParams, 'URL:', req.url, 'userId:', userId);
      return NextResponse.json({ 
        message: 'Invalid user ID',
        debug: { params: resolvedParams, url: req.url, parsedUserId: userId }
      }, { status: 400 });
    }
    
    console.log('[Freeze] Processing freeze request for user ID:', userId, 'by admin:', adminUser.id);

    const pool = getPool();

    // First check if user exists
    const [userCheck] = await pool.query(
      `SELECT id, email, is_active FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    if (!userCheck || userCheck.length === 0) {
      console.log('[Freeze] User not found. User ID:', userId);
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const existingUser = userCheck[0];
    
    // If user is already frozen, return success
    if (existingUser.is_active === 0) {
      return NextResponse.json({
        message: 'User account is already frozen',
        user: {
          id: existingUser.id,
          email: existingUser.email,
          isActive: false,
        },
      });
    }

    // Prevent admin from freezing themselves
    if (userId === adminUser.id) {
      console.log('[Freeze] Admin tried to freeze themselves. Admin ID:', adminUser.id, 'Target ID:', userId);
      return NextResponse.json(
        { message: 'Cannot freeze your own account' },
        { status: 400 }
      );
    }

    // Freeze user
    await pool.query(
      `UPDATE users SET is_active = 0 WHERE id = ?`,
      [userId]
    );

    // Get updated user
    const [userRows] = await pool.query(
      `SELECT id, email, is_active FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    const user = userRows[0];

    // Create notification
    await pool.query(
      `INSERT INTO notifications (user_id, title, body, type)
       VALUES (?, ?, ?, ?)`,
      [
        userId,
        'Account frozen',
        'Your account has been frozen by an administrator. Please contact support if this is unexpected.',
        'security',
      ]
    );

    return NextResponse.json({
      message: 'User account frozen',
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
    console.error('Admin freeze user error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to freeze user' },
      { status: 500 }
    );
  }
}

