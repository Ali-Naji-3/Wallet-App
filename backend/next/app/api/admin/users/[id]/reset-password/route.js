import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer } from '@/lib/auth';
import { requireAdmin } from '@/lib/admin';
import bcrypt from 'bcryptjs';

function getUserIdFromRequest(req, params) {
  if (params?.id) {
    const parsed = parseInt(params.id, 10);
    if (!Number.isNaN(parsed)) return parsed;
  }

  const url = new URL(req.url);
  const segments = url.pathname.split('/').filter(Boolean);
  // e.g. ["api","admin","users","3","reset-password"]
  const idSegment = segments[segments.length - 2]; // "3"
  const parsed = parseInt(idSegment, 10);
  if (!Number.isNaN(parsed)) return parsed;

  return null;
}

/**
 * POST /api/admin/users/:id/reset-password
 * Reset user password (admin only)
 */
export async function POST(req, { params }) {
  try {
    const token = parseBearer(req.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await requireAdmin(token);

    // Next.js 16: params is a Promise
    const resolvedParams = await params;
    const userId = getUserIdFromRequest(req, resolvedParams);
    if (!userId) {
      return NextResponse.json({ message: 'Invalid user ID' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { newPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { message: 'New password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const pool = getPool();

    // Check if user exists
    const [userRows] = await pool.query(
      `SELECT id, email FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    if (userRows.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const user = userRows[0];

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await pool.query(
      `UPDATE users SET password_hash = ? WHERE id = ?`,
      [passwordHash, userId]
    );

    return NextResponse.json({
      message: 'Password reset successfully',
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (err) {
    if (err.message === 'Unauthorized' || err.message.includes('Forbidden')) {
      return NextResponse.json(
        { message: err.message },
        { status: err.message.includes('Forbidden') ? 403 : 401 }
      );
    }
    console.error('Admin reset password error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to reset password' },
      { status: 500 }
    );
  }
}

