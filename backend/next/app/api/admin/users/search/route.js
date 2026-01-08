import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer, verifyToken } from '@/lib/auth';

export async function GET(req) {
  const pool = getPool();

  try {
    // Verify admin authentication
    const token = parseBearer(req.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const [userRows] = await pool.query(
      `SELECT role FROM users WHERE id = ?`,
      [user.id]
    );

    const role = userRows?.[0]?.role;
    const normalizedRole = String(role || '').trim().toLowerCase();
    if (!userRows.length || normalizedRole !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get search query
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    if (query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    // Search users by email or full name (include all users, not just 'user' role)
    const [users] = await pool.query(
      `SELECT id, email, full_name, base_currency, role, is_active
       FROM users
       WHERE (email LIKE ? OR COALESCE(full_name, '') LIKE ?)
       ORDER BY 
         CASE 
           WHEN email LIKE ? THEN 1
           WHEN COALESCE(full_name, '') LIKE ? THEN 2
           ELSE 3
         END,
         email ASC
       LIMIT 10`,
      [`%${query}%`, `%${query}%`, `${query}%`, `${query}%`]
    );

    return NextResponse.json({ users });
  } catch (error) {
    console.error('User search error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to search users' },
      { status: 500 }
    );
  }
}

