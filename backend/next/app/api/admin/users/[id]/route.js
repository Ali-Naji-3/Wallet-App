import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer } from '@/lib/auth';
import { requireAdmin } from '@/lib/admin';

function getUserIdFromRequest(req, params) {
  // Prefer params.id when available
  if (params?.id) {
    const parsed = parseInt(params.id, 10);
    if (!Number.isNaN(parsed)) return parsed;
  }

  // Fallback: parse from URL path
  const url = new URL(req.url);
  const segments = url.pathname.split('/').filter(Boolean); // e.g. ["api","admin","users","3"]
  const last = segments[segments.length - 1];
  const parsed = parseInt(last, 10);
  if (!Number.isNaN(parsed)) return parsed;

  return null;
}

export async function GET(req, { params }) {
  try {
    const token = parseBearer(req.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await requireAdmin(token);

    const userId = getUserIdFromRequest(req, params);
    if (!userId) {
      return NextResponse.json({ message: 'Invalid user ID' }, { status: 400 });
    }

    const pool = getPool();

    // Get user
    const [userRows] = await pool.query(
      `SELECT id, email, full_name, base_currency, timezone, role, is_active, created_at
       FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    const user = userRows[0];
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Get wallets
    const [wallets] = await pool.query(
      `SELECT id, currency_code, balance, status, address
       FROM wallets WHERE user_id = ? ORDER BY id DESC`,
      [userId]
    );

    // Get transaction stats
    const [txStats] = await pool.query(
      `SELECT 
         COUNT(*) as totalTransactions,
         SUM(CASE WHEN type = 'exchange' THEN 1 ELSE 0 END) as exchanges,
         SUM(CASE WHEN type = 'transfer' THEN 1 ELSE 0 END) as transfers
       FROM transactions
       WHERE user_id = ?`,
      [userId]
    );

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        baseCurrency: user.base_currency,
        timezone: user.timezone,
        role: user.role,
        isActive: !!user.is_active,
        createdAt: user.created_at,
      },
      wallets: wallets,
      stats: {
        totalTransactions: txStats[0]?.totalTransactions || 0,
        exchanges: txStats[0]?.exchanges || 0,
        transfers: txStats[0]?.transfers || 0,
      },
    });
  } catch (err) {
    if (err.message === 'Unauthorized' || err.message.includes('Forbidden')) {
      return NextResponse.json({ message: err.message }, { status: err.message.includes('Forbidden') ? 403 : 401 });
    }
    console.error('Admin get user details error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to get user details' },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const token = parseBearer(req.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await requireAdmin(token);

    const userId = getUserIdFromRequest(req, params);
    if (!userId) {
      return NextResponse.json({ message: 'Invalid user ID' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      email,
      fullName,
      role,
      baseCurrency,
      timezone,
      isActive,
    } = body || {};

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    const safeRole = role === 'admin' ? 'admin' : 'user';
    const activeFlag = typeof isActive === 'boolean' ? (isActive ? 1 : 0) : 1;

    const pool = getPool();

    // Ensure user exists
    const [existingRows] = await pool.query(
      `SELECT id, email FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );
    if (existingRows.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const currentUser = existingRows[0];

    // Check if email is being changed and if new email already exists
    if (email !== currentUser.email) {
      const [emailCheck] = await pool.query(
        `SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1`,
        [email, userId]
      );
      if (emailCheck.length > 0) {
        return NextResponse.json(
          { message: 'Email is already registered to another user' },
          { status: 409 }
        );
      }
    }

    await pool.query(
      `UPDATE users 
       SET email = ?, full_name = ?, base_currency = ?, timezone = ?, role = ?, is_active = ?
       WHERE id = ?`,
      [
        email,
        fullName || null,
        baseCurrency || 'USD',
        timezone || 'UTC',
        safeRole,
        activeFlag,
        userId,
      ]
    );

    const [userRows] = await pool.query(
      `SELECT id, email, full_name, base_currency, timezone, role, is_active, created_at
       FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    const user = userRows[0];

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        baseCurrency: user.base_currency,
        timezone: user.timezone,
        role: user.role,
        isActive: !!user.is_active,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    if (err.message === 'Unauthorized' || err.message.includes('Forbidden')) {
      return NextResponse.json(
        { message: err.message },
        { status: err.message.includes('Forbidden') ? 403 : 401 }
      );
    }
    console.error('Admin update user error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/:id
 * Soft delete a user (set is_deleted = 1)
 */
export async function DELETE(req, { params }) {
  try {
    const token = parseBearer(req.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const admin = await requireAdmin(token);

    const userId = getUserIdFromRequest(req, params);
    if (!userId) {
      return NextResponse.json({ message: 'Invalid user ID' }, { status: 400 });
    }

    // Prevent admin from deleting themselves
    if (userId === admin.id) {
      return NextResponse.json(
        { message: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    const pool = getPool();

    // Get user to check if exists and is admin
    const [userRows] = await pool.query(
      `SELECT id, role FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    if (userRows.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const user = userRows[0];

    // Prevent deleting other admins
    if (user.role === 'admin') {
      return NextResponse.json(
        { message: 'Cannot delete admin accounts' },
        { status: 403 }
      );
    }

    // Soft delete: set is_active = 0 and add deleted_at timestamp
    // First check if deleted_at column exists, if not just deactivate
    try {
      await pool.query(
        `UPDATE users SET is_active = 0, email = CONCAT('deleted_', id, '_', email) WHERE id = ?`,
        [userId]
      );
    } catch (e) {
      // If column doesn't exist, just deactivate
      await pool.query(
        `UPDATE users SET is_active = 0 WHERE id = ?`,
        [userId]
      );
    }

    return NextResponse.json({
      message: 'User deleted successfully',
      userId,
    });
  } catch (err) {
    if (err.message === 'Unauthorized' || err.message.includes('Forbidden')) {
      return NextResponse.json(
        { message: err.message },
        { status: err.message.includes('Forbidden') ? 403 : 401 }
      );
    }
    console.error('Admin delete user error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}

