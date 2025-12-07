import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer, verifyToken } from '@/lib/auth';
import { unstable_cache } from 'next/cache';

// OPTIMIZATION: Cache wallets for 2 minutes
const getCachedWallets = unstable_cache(
  async (userId) => {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT id, user_id, currency_code, balance, status, address, created_at
       FROM wallets
       WHERE user_id = ?
       ORDER BY id DESC`,
      [userId]
    );
    return rows;
  },
  ['wallets'],
  {
    revalidate: 120, // Cache for 2 minutes
    tags: ['wallets'],
  }
);

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

    // OPTIMIZATION: Use cached version
    const rows = await getCachedWallets(user.id);

    return NextResponse.json(rows, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=240',
      },
    });
  } catch (err) {
    return NextResponse.json({ message: err?.message || 'Failed to load wallets' }, { status: 500 });
  }
}

