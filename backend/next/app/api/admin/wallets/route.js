import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer, verifyToken } from '@/lib/auth';
import { authenticateAdmin } from '@/lib/api/utils';

export async function GET(req) {
  try {
    await authenticateAdmin(req);

    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT 
        w.id,
        w.user_id,
        w.currency_code,
        w.balance,
        w.status,
        w.address,
        w.created_at,
        u.email AS user_email,
        u.name AS user_name
      FROM wallets w
      JOIN users u ON w.user_id = u.id
      ORDER BY w.created_at DESC
      LIMIT 1000`
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Admin wallets error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to load wallets' },
      { status: error.message?.includes('Unauthorized') || error.message?.includes('Forbidden') ? 403 : 500 }
    );
  }
}



