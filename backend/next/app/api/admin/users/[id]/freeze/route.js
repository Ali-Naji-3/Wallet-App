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

    const adminUser = await requireAdmin(token);
    const userId = parseInt(params.id, 10);

    if (!userId) {
      return NextResponse.json({ message: 'Invalid user ID' }, { status: 400 });
    }

    // Prevent admin from freezing themselves
    if (userId === adminUser.id) {
      return NextResponse.json(
        { message: 'Cannot freeze your own account' },
        { status: 400 }
      );
    }

    const pool = getPool();

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

