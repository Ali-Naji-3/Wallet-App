import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer } from '@/lib/auth';
import { requireAdmin } from '@/lib/admin';

export async function GET(req) {
  try {
    const token = parseBearer(req.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await requireAdmin(token);

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const offset = (page - 1) * limit;
    const type = searchParams.get('type') || '';

    const pool = getPool();

    let sql = `
      SELECT t.*, u.email as user_email
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
    `;
    const params = [];

    if (type) {
      sql += ` WHERE t.type = ?`;
      params.push(type);
    }

    sql += ` ORDER BY t.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [transactions] = await pool.query(sql, params);

    // Get total count
    let countSql = `SELECT COUNT(*) as count FROM transactions`;
    const countParams = [];
    if (type) {
      countSql += ` WHERE type = ?`;
      countParams.push(type);
    }
    const [countResult] = await pool.query(countSql, countParams);
    const total = countResult[0]?.count || 0;

    return NextResponse.json({
      transactions: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    if (err.message === 'Unauthorized' || err.message.includes('Forbidden')) {
      return NextResponse.json({ message: err.message }, { status: err.message.includes('Forbidden') ? 403 : 401 });
    }
    console.error('Admin list transactions error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to list transactions' },
      { status: 500 }
    );
  }
}

