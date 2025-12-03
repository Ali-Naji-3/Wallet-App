import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer } from '@/lib/auth';
import { requireAdmin } from '@/lib/admin';

export async function GET(req, { params }) {
  try {
    const token = parseBearer(req.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await requireAdmin(token);

    const userId = parseInt(params.id, 10);
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

