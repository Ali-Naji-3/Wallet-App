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

    // Verify admin access
    await requireAdmin(token);

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const offset = (page - 1) * limit;
    const search = searchParams.get('search') || '';

    const pool = getPool();

    let sql = `
      SELECT id, email, full_name, role, is_active, created_at
      FROM users
    `;
    const params = [];

    if (search) {
      sql += ` WHERE email LIKE ? OR full_name LIKE ?`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [users] = await pool.query(sql, params);

    // Get total count
    let countSql = `SELECT COUNT(*) as count FROM users`;
    const countParams = [];
    if (search) {
      countSql += ` WHERE email LIKE ? OR full_name LIKE ?`;
      countParams.push(`%${search}%`, `%${search}%`);
    }
    const [countResult] = await pool.query(countSql, countParams);
    const total = countResult[0]?.count || 0;

    return NextResponse.json({
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        role: u.role,
        is_active: !!u.is_active,
        created_at: u.created_at,
      })),
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
    console.error('Admin list users error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to list users' },
      { status: 500 }
    );
  }
}

