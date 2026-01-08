import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer, verifyToken } from '@/lib/auth';

// Removed caching for real-time balance updates
// When admin credits funds, user dashboard should see changes immediately

export async function GET(req) {
  try {
    const token = parseBearer(req.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const user = verifyToken(token);
    if (!user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Fetch fresh data every time for real-time balance updates
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT id, user_id, currency_code, balance, status, address, created_at
       FROM wallets
       WHERE user_id = ?
       ORDER BY id DESC`,
      [user.id]
    );

    return NextResponse.json(rows, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (err) {
    return NextResponse.json({ message: err?.message || 'Failed to load wallets' }, { status: 500 });
  }
}

