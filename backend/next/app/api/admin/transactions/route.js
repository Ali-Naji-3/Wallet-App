
import { NextResponse } from 'next/server';
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const pool = getPool();

    // Build WHERE clause
    let whereConditions = [];
    const queryParams = [];

    if (search) {
      // Search by Transaction ID or User Email
      whereConditions.push('(t.id LIKE ? OR u.email LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (type && type !== 'all') {
      whereConditions.push('t.type = ?');
      queryParams.push(type);
    }

    // Status filter removed as DB schema lacks status column.
    // if (status && status !== 'all') { ... }

    let whereClause = '';
    if (whereConditions.length > 0) {
      whereClause = 'WHERE ' + whereConditions.join(' AND ');
    }

    // 1. Get Total Count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      ${whereClause}
    `;

    // Use queryParams for count (it has all the filter values)
    const [countRows] = await pool.query(countQuery, queryParams);
    const total = countRows[0]?.total || 0;

    // 2. Get Data with Details
    // Join wallets to resolve recipient email if possible
    const dataQuery = `
      SELECT t.*, 
             u.email as user_email,
             r.email as recipient_email,
             r.id as recipient_id,
             r.full_name as recipient_name
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN wallets w ON t.target_wallet_id = w.id
      LEFT JOIN users r ON w.user_id = r.id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `;

    // Add pagination params to a COPY of queryParams or push to it?
    // queryParams array is used for count. We need to create a new array for dataQuery.
    const dataParams = [...queryParams, limit, offset];

    const [transactions] = await pool.query(dataQuery, dataParams);

    return NextResponse.json({
      transactions: transactions,
      pagination: {
        total: total,
        page: page,
        limit: limit,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (err) {
    if (err.message === 'Unauthorized' || err.message.includes('Forbidden')) {
      return NextResponse.json({ message: err.message }, { status: err.message.includes('Forbidden') ? 403 : 401 });
    }
    console.error('Admin transactions error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
