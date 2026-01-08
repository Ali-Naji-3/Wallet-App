import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer } from '@/lib/auth';
import { requireAdmin } from '@/lib/admin';

/**
 * Get helper to extract userId from params
 */
function getUserIdFromRequest(req, params) {
  const rawId = params?.id;
  
  if (!rawId) return null;
  
  const userId = parseInt(rawId, 10);
  if (isNaN(userId) || userId <= 0) {
    return null;
  }

  return userId;
}

/**
 * GET /api/admin/users/:id/transactions
 * Get all transactions for a specific user
 * Query params:
 *   - type: 'exchange' or 'transfer' (optional filter)
 *   - limit: max results (default 50, max 200)
 */
export async function GET(req, { params }) {
  try {
    const token = parseBearer(req.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await requireAdmin(token);

    // Next.js 16: params is a Promise, must await it
    const resolvedParams = await params;
    const userId = getUserIdFromRequest(req, resolvedParams);
    if (!userId) {
      return NextResponse.json({ message: 'Invalid user ID' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);

    const pool = getPool();

    // Verify user exists
    const [userRows] = await pool.query(
      'SELECT id FROM users WHERE id = ? LIMIT 1',
      [userId]
    );
    if (!userRows.length) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Build query
    let sql = `
      SELECT 
        t.id,
        t.type,
        t.source_currency,
        t.target_currency,
        t.source_amount,
        t.target_amount,
        t.fx_rate,
        t.fee_amount,
        t.note,
        t.created_at
      FROM transactions t
      WHERE t.user_id = ?
    `;
    const params_arr = [userId];

    // Optional type filter
    if (type) {
      sql += ` AND t.type = ?`;
      params_arr.push(type);
    }

    sql += ` ORDER BY t.created_at DESC LIMIT ?`;
    params_arr.push(limit);

    const [transactions] = await pool.query(sql, params_arr);

    return NextResponse.json({
      transactions: transactions,
      count: transactions.length,
    });
  } catch (err) {
    if (err.message === 'Unauthorized' ||
        err.message === 'Forbidden' ||
        err.message === 'Forbidden: Admin access required') {
      return NextResponse.json({ message: err.message }, { status: 403 });
    }
    console.error('Get user transactions error:', err);
    return NextResponse.json(
      { message: 'Failed to get user transactions' },
      { status: 500 }
    );
  }
}

