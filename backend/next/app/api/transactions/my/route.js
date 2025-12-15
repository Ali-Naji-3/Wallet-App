import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer, verifyToken } from '@/lib/auth';

/**
 * GET /api/transactions
 * Get user's transaction history
 */
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

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const pool = getPool();

    const [transactions] = await pool.query(
      `SELECT 
        id,
        type,
        source_currency as from_currency,
        target_currency as to_currency,
        source_amount as from_amount,
        target_amount as to_amount,
        note,
        created_at,
        'completed' as status
       FROM transactions 
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [user.id, limit]
    );

    return NextResponse.json({ transactions });

  } catch (err) {
    console.error('❌ [Transactions] Error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
